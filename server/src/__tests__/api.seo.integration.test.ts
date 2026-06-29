/**
 * Smoke: public SEO city landing API + sitemap.
 */
import { describe, it, expect, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { fastify as app } from '../index';

describe('integration: SEO public API', () => {
    afterAll(async () => {
        await (app as FastifyInstance).close();
    });

    it('GET /api/public/cities returns catalog', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/public/cities',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(Array.isArray(body.cities)).toBe(true);
        expect(body.cities.length).toBeGreaterThanOrEqual(6);
        expect(body.cities[0]).toHaveProperty('slug');
        expect(body.cities[0]).toHaveProperty('barber_count');
    });

    it('GET /api/public/cities/paris returns landing payload', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/public/cities/paris',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.city.slug).toBe('paris');
        expect(body).toHaveProperty('barbers');
        expect(body).toHaveProperty('stats');
    });

    it('GET /api/public/cities/unknown returns 404', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/public/cities/not-a-real-city-slug',
        });
        expect(res.statusCode).toBe(404);
    });

    it('GET /api/public/sitemap.xml returns XML', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/public/sitemap.xml',
        });
        expect(res.statusCode).toBe(200);
        expect(res.headers['content-type']).toMatch(/xml/);
        expect(res.payload).toContain('<urlset');
        expect(res.payload).toContain('/barbers-in/paris');
    });
});
