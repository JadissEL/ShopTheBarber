/**
 * API integration: sovereign JWT registration → GET /api/auth/me → scoped POST /api/favorites.
 * Mirrors the audit “auth + favorite mutation” checklist without needing a live Clerk browser session.
 *
 * Clerk Bearer E2E: set staging `Bearer` manually or wire Playwright with `process.env.E2E_CLERK_JWT`.
 *
 * Imports the full Fastify app with `start()` gated off when `VITEST=true` (see [`index.ts`](../index.ts)).
 */
import { describe, it, expect, afterAll } from 'vitest';

import type { FastifyInstance } from 'fastify';

import * as schema from '../db/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { fastify as app } from '../index';

describe('integration: POST /register → GET /auth/me → POST /favorites', () => {
    const email = `api-int-${Date.now()}@example.com`;
    let userId: string;
    let favoriteId: string | undefined;

    afterAll(async () => {
        if (favoriteId) {
            await db.delete(schema.favorites).where(eq(schema.favorites.id, favoriteId));
        }
        if (userId) {
            await db.delete(schema.users).where(eq(schema.users.id, userId));
        }
        await (app as FastifyInstance).close();
    });

    it('returns consistent user id and creates a scoped favorite row', async () => {
        const reg = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/auth/register',
            headers: { 'content-type': 'application/json' },
            payload: {
                email,
                password: 'password123',
                full_name: 'API Integration User',
            },
        });

        expect(reg.statusCode).toBe(200);
        const regBody = JSON.parse(reg.body as string);
        expect(regBody.token).toBeTruthy();
        expect(regBody.user?.id).toBeTruthy();
        userId = String(regBody.user.id);

        const me = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: { authorization: `Bearer ${regBody.token}` },
        });
        expect(me.statusCode).toBe(200);
        const meBody = JSON.parse(me.body as string);
        expect(meBody.id).toBe(userId);

        const barberIdPlaceholder = crypto.randomUUID();
        const fav = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/favorites',
            headers: {
                authorization: `Bearer ${regBody.token}`,
                'content-type': 'application/json',
            },
            payload: {
                user_id: userId,
                target_id: barberIdPlaceholder,
                target_type: 'barber',
            },
        });

        expect(fav.statusCode).toBe(200);
        const favRow = JSON.parse(fav.body as string);
        expect(favRow.user_id).toBe(userId);
        favoriteId = String(favRow.id);
    });
});
