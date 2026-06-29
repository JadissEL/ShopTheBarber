/**
 * Reviews API: public listing, submit, booking status.
 */
import { describe, it, expect, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { fastify as app } from '../index';

describe('integration: reviews API', () => {
    afterAll(async () => {
        await (app as FastifyInstance).close();
    });

    it('GET /api/reviews/public requires target params', async () => {
        const res = await (app as FastifyInstance).inject({ method: 'GET', url: '/api/reviews/public' });
        expect(res.statusCode).toBe(400);
    });

    it('GET /api/reviews/public returns reviews array for barber', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/reviews/public?target_type=barber&target_id=b1',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(Array.isArray(body.reviews)).toBe(true);
    });

    it('GET /api/reviews/status/:id requires auth', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/reviews/status/bk1',
        });
        expect(res.statusCode).toBe(401);
    });

    it('POST /api/reviews requires auth', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/reviews',
            payload: { booking_id: 'bk1', rating: 5 },
        });
        expect(res.statusCode).toBe(401);
    });

    it('GET /api/reviews/request/:token rejects short token', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/reviews/request/short',
        });
        expect(res.statusCode).toBe(404);
    });

    it('GET /api/reviews/pending requires auth', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/reviews/pending',
        });
        expect(res.statusCode).toBe(401);
    });
});
