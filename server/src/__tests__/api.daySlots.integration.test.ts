/**
 * Public day-slots API (rate-limited).
 */
import { describe, it, expect, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { fastify as app } from '../index';

describe('integration: barber day-slots API', () => {
    afterAll(async () => {
        await (app as FastifyInstance).close();
    });

    it('GET /api/barbers/:id/day-slots requires date param', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/barbers/test-barber-id/day-slots',
        });
        expect(res.statusCode).toBe(400);
        expect(JSON.parse(res.payload)).toMatchObject({ error: expect.stringContaining('date') });
    });

    it('GET /api/barbers/:id/day-slots rejects invalid date', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/barbers/test-barber-id/day-slots?date=not-a-date',
        });
        expect(res.statusCode).toBe(400);
    });
});
