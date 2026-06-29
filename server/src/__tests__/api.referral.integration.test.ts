/**
 * Smoke: referral program API (validate, dashboard, claim protection, write blocks).
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_referral_${Date.now()}`;
const EMAIL = `referral-int-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'client',
        full_name: 'Referral Test User',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';

describe('integration: referral API', () => {
    let userId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    afterAll(async () => {
        if (userId) {
            await prisma.wallet_transactions.deleteMany({ where: { user_id: userId } });
            await prisma.wallet_accounts.deleteMany({ where: { user_id: userId } });
            await prisma.referrals.deleteMany({
                where: { OR: [{ referrer_id: userId }, { referred_user_id: userId }] },
            });
            await prisma.promo_codes.deleteMany({ where: { owner_user_id: userId } });
            await prisma.notifications.deleteMany({ where: { user_id: userId } });
            await prisma.users.updateMany({
                where: { id: userId },
                data: { referred_by_user_id: null, referral_code: null },
            });
            await prisma.users.deleteMany({ where: { id: userId } });
        }
        await (app as FastifyInstance).close();
    });

    it('GET /api/referral/programs returns catalog without auth', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/referral/programs?role=client',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(Array.isArray(body.programs)).toBe(true);
        expect(body.programs[0].type).toBe('client_b2c');
    });

    it('GET /api/referral/me requires auth', async () => {
        const res = await (app as FastifyInstance).inject({ method: 'GET', url: '/api/referral/me' });
        expect(res.statusCode).toBe(401);
    });

    it('GET /api/referral/me returns dashboard with code for authenticated user', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/referral/me',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.referral_code).toMatch(/^STB-/);
        expect(body.stats).toBeDefined();
        expect(Array.isArray(body.referrals)).toBe(true);
        userId = (await prisma.users.findFirst({ where: { clerk_user_id: CLERK_ID } }))?.id ?? '';
        expect(userId).toBeTruthy();
    });

    it('GET /api/referral/validate/:code validates own code', async () => {
        const me = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/referral/me',
            headers: authHeaders,
        });
        const code = JSON.parse(me.payload).referral_code;
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/referral/validate/${code}`,
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.valid).toBe(true);
    });

    it('blocks direct entity writes to referrals', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/referrals',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { referrer_id: userId, referral_code: 'FAKE' },
        });
        expect(res.statusCode).toBe(403);
    });

    it('GET /api/wallet/me returns wallet for authenticated user', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/wallet/me',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(typeof body.balance).toBe('number');
        expect(Array.isArray(body.transactions)).toBe(true);
    });
});
