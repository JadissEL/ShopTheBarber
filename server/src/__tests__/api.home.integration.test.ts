/**
 * Public homepage curated content.
 */
import { describe, it, expect, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { fastify as app } from '../index';

describe('integration: GET /api/public/home', () => {
    afterAll(async () => {
        await (app as FastifyInstance).close();
    });

    it('returns top barbers, offers, and home visit sections', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/public/home',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(Array.isArray(body.top_barbers)).toBe(true);
        expect(body.offers).toMatchObject({
            platform: expect.any(Array),
            shops: expect.any(Array),
            barbers: expect.any(Array),
        });
        expect(Array.isArray(body.mobile_barbers)).toBe(true);
        expect(body.home_visit?.headline).toBeTruthy();
    });
});
