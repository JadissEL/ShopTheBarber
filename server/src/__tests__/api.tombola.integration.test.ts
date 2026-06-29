/**
 * Smoke: weekly tombola API.
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_tombola_${Date.now()}`;
const EMAIL = `tombola-int-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'client',
        full_name: 'Tombola Test User',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';

describe('integration: tombola API', () => {
    let userId: string;
    let drawId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    afterAll(async () => {
        if (drawId) {
            await prisma.draw_winner_claims.deleteMany({ where: { draw_id: drawId } });
            await prisma.draw_entries.deleteMany({ where: { draw_id: drawId } });
            await prisma.weekly_draws.deleteMany({ where: { id: drawId } });
        }
        if (userId) {
            await prisma.users.deleteMany({ where: { id: userId } });
        }
        await (app as FastifyInstance).close();
    });

    it('GET /api/tombola/current is public', async () => {
        const res = await (app as FastifyInstance).inject({ method: 'GET', url: '/api/tombola/current' });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.draw?.prize_title).toBeTruthy();
        drawId = body.draw.id;
    });

    it('GET /api/tombola/me requires auth', async () => {
        const res = await (app as FastifyInstance).inject({ method: 'GET', url: '/api/tombola/me' });
        expect(res.statusCode).toBe(401);
    });

    it('POST /api/tombola/free-entry registers alternate entry', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/tombola/free-entry',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {},
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.entry?.entry_count).toBeGreaterThan(0);
        const user = await prisma.users.findFirst({ where: { clerk_user_id: CLERK_ID } });
        userId = user?.id ?? '';
    });

    it('GET /api/tombola/admin/draws forbidden for client', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/tombola/admin/draws',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(403);
    });
});
