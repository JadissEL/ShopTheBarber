/**
 * SMS booking reminders cron + preferences API.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { fastify as app } from '../index';

describe('integration: SMS booking reminders', () => {
    beforeAll(() => {
        process.env.CRON_SECRET = 'test-cron-secret';
    });

    afterAll(async () => {
        await (app as FastifyInstance).close();
    });

    it('POST /api/cron/booking-reminders rejects missing secret when CRON_SECRET is set', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/cron/booking-reminders',
        });
        expect(res.statusCode).toBe(401);
    });

    it('POST /api/cron/booking-reminders runs with valid secret', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/cron/booking-reminders',
            headers: { 'x-cron-secret': 'test-cron-secret' },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.ok).toBe(true);
        expect(body.sms).toHaveProperty('scanned');
        expect(body.email).toHaveProperty('scanned');
    });

    it('POST /api/cron/rebook-nudges rejects missing secret when CRON_SECRET is set', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/cron/rebook-nudges',
        });
        expect(res.statusCode).toBe(401);
    });

    it('POST /api/cron/rebook-nudges runs with valid secret', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/cron/rebook-nudges',
            headers: { 'x-cron-secret': 'test-cron-secret' },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body).toHaveProperty('scanned_clients');
        expect(body).toHaveProperty('sent');
    });
});
