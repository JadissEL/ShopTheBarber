/**
 * Smoke: tips API (status, write protection).
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_tip_${Date.now()}`;
const EMAIL = `tip-int-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'client',
        full_name: 'Tip Test User',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';

describe('integration: tips API', () => {
    let userId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    afterAll(async () => {
        if (userId) {
            await prisma.booking_tips.deleteMany({ where: { client_id: userId } });
            await prisma.users.deleteMany({ where: { id: userId } });
        }
        await (app as FastifyInstance).close();
    });

    it('GET /api/tips/booking/:id requires auth', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/tips/booking/fake-id',
        });
        expect(res.statusCode).toBe(401);
    });

    it('GET /api/tips/booking/:id returns 404 for missing booking', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/tips/booking/00000000-0000-0000-0000-000000000099',
            headers: authHeaders,
        });
        expect([404, 400]).toContain(res.statusCode);
        const user = await prisma.users.findFirst({ where: { clerk_user_id: CLERK_ID } });
        userId = user?.id ?? '';
        expect(userId).toBeTruthy();
    });

    it('POST /api/tips/create-checkout requires booking_id', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/tips/create-checkout',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {},
        });
        expect(res.statusCode).toBe(400);
    });

    it('GET /api/tips/provider/summary requires auth', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/tips/provider/summary',
        });
        expect(res.statusCode).toBe(401);
    });
});
