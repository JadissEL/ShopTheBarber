/**
 * Smoke: GET /api/pricing/offers (booking upsell / promo suggestions).
 */
import { describe, it, expect, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { fastify as app } from '../index';

describe('integration: GET /api/pricing/offers', () => {
    afterAll(async () => {
        await (app as FastifyInstance).close();
    });

    it('returns promotions and bundle shape for shop s1', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/pricing/offers?shop_id=s1',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(Array.isArray(body.promotions)).toBe(true);
        expect(Array.isArray(body.near_miss_bundles)).toBe(true);
        expect(Array.isArray(body.available_bundles)).toBe(true);
        expect(body).toHaveProperty('matched_bundle');
    });

    it('returns near-miss suggestions when partial combo is selected', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/pricing/offers?shop_id=s1&service_ids=ser1',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(Array.isArray(body.near_miss_bundles)).toBe(true);
        expect(body.matched_bundle === null || typeof body.matched_bundle === 'object').toBe(true);
    });

    it('requires shop_id or barber_id', async () => {
        const res = await (app as FastifyInstance).inject({ method: 'GET', url: '/api/pricing/offers' });
        expect(res.statusCode).toBe(400);
    });
});
