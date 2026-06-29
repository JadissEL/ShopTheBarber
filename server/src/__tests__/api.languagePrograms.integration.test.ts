/**
 * Language learning programs — paid waitlist (20% non-refundable deposit).
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import crypto from 'crypto';

const CLERK_ID = `clerk_langprog_${Date.now()}`;
const EMAIL = `langprog-int-${Date.now()}@example.com`;

let mockRole = 'barber';

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: mockRole,
        full_name: 'Lang Program Barber',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { computeDepositAmount, confirmWaitlistDepositFromCheckout } from '../languagePrograms/logic';

describe('languagePrograms logic', () => {
    it('computeDepositAmount returns 20% rounded', () => {
        expect(computeDepositAmount(500)).toBe(100);
        expect(computeDepositAmount(249.99)).toBe(50);
    });
});

describe('integration: language programs API', () => {
    let userId: string;
    let barberId: string;
    let programId: string;
    let waitlistId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    afterAll(async () => {
        if (waitlistId) {
            await prisma.language_program_waitlist.deleteMany({ where: { id: waitlistId } });
        }
        if (programId) {
            await prisma.language_program_waitlist.deleteMany({ where: { program_id: programId } });
            await prisma.language_programs.deleteMany({ where: { id: programId } });
        }
        if (barberId) await prisma.barbers.deleteMany({ where: { id: barberId } });
        if (userId) await prisma.users.deleteMany({ where: { id: userId } });
        await (app as FastifyInstance).close();
    });

    it('GET /api/language-programs/config is public', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/language-programs/config',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.deposit_percent).toBe(20);
        expect(body.non_refundable_terms).toContain('non-refundable');
    });

    it('admin creates open French program', async () => {
        mockRole = 'admin';
        userId = crypto.randomUUID();
        await prisma.users.upsert({
            where: { clerk_user_id: CLERK_ID },
            create: {
                id: userId,
                clerk_user_id: CLERK_ID,
                email: EMAIL,
                full_name: 'Lang Admin',
                role: 'admin',
            },
            update: { role: 'admin' },
        });

        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/language-programs/admin',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {
                title: 'French for Barbers',
                description: 'Learn French to serve more clients',
                language_code: 'fr',
                total_price: 400,
                currency: 'EUR',
                max_waitlist: 20,
                status: 'open',
                format: 'online',
            },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.deposit_amount).toBe(80);
        programId = body.id;
    });

    it('barber sets spoken languages and lists suggested program', async () => {
        mockRole = 'barber';
        await prisma.users.updateMany({
            where: { clerk_user_id: CLERK_ID },
            data: { role: 'barber' },
        });

        const langRes = await (app as FastifyInstance).inject({
            method: 'PUT',
            url: '/api/provider/barber/languages',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { languages: ['en', 'el'] },
        });
        expect(langRes.statusCode).toBe(200);
        barberId = JSON.parse(langRes.payload).id;

        const listRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/language-programs/provider',
            headers: authHeaders,
        });
        expect(listRes.statusCode).toBe(200);
        const list = JSON.parse(listRes.payload);
        expect(list.spoken_languages).toEqual(['en', 'el']);
        const program = list.programs.find((p: { id: string }) => p.id === programId);
        expect(program).toBeTruthy();
        expect(program.suggested).toBe(true);
        expect(program.registration_open).toBe(true);
    });

    it('join without terms is rejected', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: `/api/language-programs/${programId}/join`,
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { terms_accepted: false },
        });
        expect(res.statusCode).toBe(400);
        expect(JSON.parse(res.payload).error).toContain('terms');
    });

    it('join with terms creates pending entry (Stripe may be unavailable in CI)', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: `/api/language-programs/${programId}/join`,
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { terms_accepted: true },
        });
        const body = JSON.parse(res.payload);
        if (res.statusCode === 200) {
            expect(body.checkout_url).toBeTruthy();
            waitlistId = body.waitlist.id;
        } else {
            expect(res.statusCode).toBe(400);
            expect(body.error).toMatch(/Stripe|checkout/i);
            const entry = await prisma.language_program_waitlist.findFirst({
                where: { program_id: programId, user_id: userId },
            });
            expect(entry).toBeTruthy();
            expect(entry?.status).toBe('pending_payment');
            waitlistId = entry!.id;
        }
    });

    it('confirmWaitlistDepositFromCheckout marks waitlisted with position', async () => {
        const result = await confirmWaitlistDepositFromCheckout({
            id: 'cs_test_langprog',
            metadata: {
                waitlist_id: waitlistId,
                user_id: userId,
                program_id: programId,
                deposit_amount: '80',
            },
            payment_intent: 'pi_test_langprog',
        } as Parameters<typeof confirmWaitlistDepositFromCheckout>[0]);

        expect(result.processed).toBe(true);

        const entry = await prisma.language_program_waitlist.findUnique({ where: { id: waitlistId } });
        expect(entry?.status).toBe('waitlisted');
        expect(entry?.payment_status).toBe('paid');
        expect(entry?.position).toBe(1);
    });

    it('cancel waitlist keeps deposit non-refundable', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: `/api/language-programs/${programId}/cancel`,
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.deposit_refunded).toBe(false);

        const entry = await prisma.language_program_waitlist.findUnique({ where: { id: waitlistId } });
        expect(entry?.status).toBe('cancelled');
    });

    it('admin lists waitlist and cannot re-enroll cancelled paid entry via join', async () => {
        mockRole = 'admin';
        await prisma.users.updateMany({
            where: { clerk_user_id: CLERK_ID },
            data: { role: 'admin' },
        });

        const wlRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/language-programs/admin/${programId}/waitlist`,
            headers: authHeaders,
        });
        expect(wlRes.statusCode).toBe(200);
        const wl = JSON.parse(wlRes.payload);
        expect(wl.some((e: { id: string }) => e.id === waitlistId)).toBe(true);

        mockRole = 'barber';
        await prisma.users.updateMany({
            where: { clerk_user_id: CLERK_ID },
            data: { role: 'barber' },
        });

        const rejoin = await (app as FastifyInstance).inject({
            method: 'POST',
            url: `/api/language-programs/${programId}/join`,
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { terms_accepted: true },
        });
        expect(rejoin.statusCode).toBe(400);
        expect(JSON.parse(rejoin.payload).error).toContain('non-refundable');
    });
});
