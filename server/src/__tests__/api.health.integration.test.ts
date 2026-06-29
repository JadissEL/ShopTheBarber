/**
 * Health / readiness endpoints for uptime monitors and Render.
 */
import { describe, it, expect, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { fastify as app } from '../index';

describe('integration: health API', () => {
    afterAll(async () => {
        await (app as FastifyInstance).close();
    });

    it('GET /api/health/live returns alive', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/health/live',
        });
        expect(res.statusCode).toBe(200);
        expect(JSON.parse(res.payload)).toMatchObject({ ok: true, status: 'alive' });
    });

    it('GET /api/health/ready includes schema checks when DB is available', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/health/ready',
        });
        const body = JSON.parse(res.payload);
        expect(body).toHaveProperty('db');
        expect(body).toHaveProperty('migrations');
        expect(body).toHaveProperty('schema');
        if (body.ok) {
            expect(res.statusCode).toBe(200);
            expect(body.checks).toMatchObject({
                offers_mobile_service: true,
                offers_shop_service: true,
                provider_fixed_fee: true,
                promo_targeting: true,
            });
        } else {
            expect(res.statusCode).toBe(503);
        }
    });
});
