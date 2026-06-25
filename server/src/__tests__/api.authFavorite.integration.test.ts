/**
 * API integration (Clerk-only): a mocked Clerk Bearer provisions a DB user →
 * GET /api/auth/me → scoped POST /api/favorites. Verifies Clerk→DB user mapping
 * and that entity writes are scoped to the resolved user id.
 *
 * verifyClerkToken is mocked so no live Clerk session is needed. Runs against the
 * isolated Neon test branch (NODE_ENV=test → TEST_DATABASE_URL).
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_test_${Date.now()}`;
const EMAIL = `api-int-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'client',
        full_name: 'API Integration User',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';

describe('integration: Clerk Bearer → GET /auth/me → POST /favorites', () => {
    let userId: string;
    let favoriteId: string | undefined;

    afterAll(async () => {
        if (favoriteId) await prisma.favorites.deleteMany({ where: { id: favoriteId } });
        if (userId) await prisma.users.deleteMany({ where: { id: userId } });
        await (app as FastifyInstance).close();
    });

    it('resolves a consistent user id and creates a scoped favorite row', async () => {
        const me = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: { authorization: 'Bearer clerk.test.token' },
        });
        expect(me.statusCode).toBe(200);
        const meBody = JSON.parse(me.body as string);
        expect(meBody.id).toBeTruthy();
        expect(meBody.email).toBe(EMAIL);
        userId = String(meBody.id);

        const fav = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/favorites',
            headers: { authorization: 'Bearer clerk.test.token', 'content-type': 'application/json' },
            payload: {
                user_id: userId,
                target_id: crypto.randomUUID(),
                target_type: 'barber',
            },
        });

        expect(fav.statusCode).toBe(200);
        const favRow = JSON.parse(fav.body as string);
        expect(favRow.user_id).toBe(userId);
        favoriteId = String(favRow.id);
    });
});
