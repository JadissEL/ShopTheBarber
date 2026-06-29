/**
 * Public geocoding config and address suggest endpoints.
 */
import { describe, it, expect, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { fastify as app } from '../index';

describe('integration: geocoding API', () => {
    afterAll(async () => {
        await (app as FastifyInstance).close();
    });

    it('GET /api/geocoding/config returns provider and default center', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/geocoding/config',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body).toMatchObject({
            country_bias: 'GR',
            default_center: { latitude: 37.9838, longitude: 23.7275 },
        });
        expect(body.geocoding).toHaveProperty('provider');
        expect(body.geocoding).toHaveProperty('supports_autocomplete');
    });

    it('GET /api/at-home-service/suggest returns empty for short query', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/at-home-service/suggest?q=ab',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.suggestions).toEqual([]);
    });

    it('POST /api/at-home-service/quote accepts coordinates for seeded barber', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/at-home-service/quote',
            payload: {
                barber_id: 'gb1',
                latitude: 37.9755,
                longitude: 23.7348,
                address: 'Syntagma, Athens',
            },
        });
        const body = JSON.parse(res.payload);
        if (body.configured === false) {
            expect(res.statusCode).toBe(200);
            return;
        }
        expect(res.statusCode).toBe(200);
        expect(body.in_service_area).toBe(true);
        expect(typeof body.distance_km).toBe('number');
    });

    it('GET /api/health includes geocoding status', async () => {
        const health = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/health',
        });
        const body = JSON.parse(health.payload);
        expect(body.geocoding).toMatchObject({
            provider: expect.any(String),
            supports_autocomplete: expect.any(Boolean),
            production_ready: expect.any(Boolean),
        });
    });
});
