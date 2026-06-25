/**
 * Smoke: anonymous GET /api/public/active-promotions (Explore / BarberProfile).
 * Same lifecycle as [`api.authFavorite.integration.test.ts`](./api.authFavorite.integration.test.ts) — Vitest gates `listen` via `VITEST=true`.
 */
import { describe, it, expect, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { fastify as app } from '../index';

describe('integration: GET /api/public/active-promotions', () => {
    afterAll(async () => {
        await (app as FastifyInstance).close();
    });

    it('returns shop_ids + has_platform_promos without auth', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/public/active-promotions',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(Array.isArray(body.shop_ids)).toBe(true);
        expect(typeof body.has_platform_promos).toBe('boolean');
    });

    it('with barber_id returns an array payload', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/public/active-promotions?barber_id=b1',
        });
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(JSON.parse(res.payload))).toBe(true);
    });
});
