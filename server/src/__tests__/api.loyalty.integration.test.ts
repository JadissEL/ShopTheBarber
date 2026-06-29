/**
 * Smoke: loyalty program API (earn preview, auth profile, write protection).
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_loyalty_${Date.now()}`;
const EMAIL = `loyalty-int-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'client',
        full_name: 'Loyalty Test User',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';

describe('integration: loyalty API', () => {
    let userId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    afterAll(async () => {
        if (userId) {
            await prisma.loyalty_transactions.deleteMany({ where: { user_id: userId } });
            await prisma.loyalty_profiles.deleteMany({ where: { user_id: userId } });
            await prisma.notifications.deleteMany({ where: { user_id: userId } });
            await prisma.users.deleteMany({ where: { id: userId } });
        }
        await (app as FastifyInstance).close();
    });

    it('GET /api/loyalty/program returns catalog without auth', async () => {
        const res = await (app as FastifyInstance).inject({ method: 'GET', url: '/api/loyalty/program' });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.points_per_dollar).toBe(1);
        expect(Array.isArray(body.rewards)).toBe(true);
        expect(body.rewards.length).toBeGreaterThan(0);
    });

    it('GET /api/loyalty/preview estimates earn for amount', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/loyalty/preview?amount=45&tier=Bronze',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.points_earned).toBe(45);
        expect(body.dollar_value_if_redeemed).toBe(0.9);
    });

    it('GET /api/loyalty/me requires auth', async () => {
        const res = await (app as FastifyInstance).inject({ method: 'GET', url: '/api/loyalty/me' });
        expect(res.statusCode).toBe(401);
    });

    it('GET /api/loyalty/me returns profile for authenticated user', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/loyalty/me',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.current_points).toBe(0);
        expect(body.tier).toBe('Bronze');
        expect(Array.isArray(body.transactions)).toBe(true);
        expect(Array.isArray(body.active_reward_codes)).toBe(true);
        userId = body.profile.user_id;
    });

    it('blocks direct entity writes to loyalty_profile', async () => {
        const profiles = await prisma.loyalty_profiles.findMany({ where: { user_id: userId } });
        const profileId = profiles[0]?.id;
        if (!profileId) return;

        const res = await (app as FastifyInstance).inject({
            method: 'PATCH',
            url: `/api/loyalty_profiles/${profileId}`,
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { current_points: 99999 },
        });
        expect(res.statusCode).toBe(403);
    });
});
