/**
 * Financial Trust Phase 1 cron routes.
 */
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { fastify as app } from '../index';

describe('integration: Financial Trust cron routes', () => {
    beforeAll(() => {
        process.env.CRON_SECRET = 'test-cron-secret';
    });

    afterAll(async () => {
        await (app as FastifyInstance).close();
    });

    it('POST /api/cron/bookings/auto-confirm rejects missing secret', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/cron/bookings/auto-confirm',
        });
        expect(res.statusCode).toBe(401);
    });

    it('POST /api/cron/bookings/auto-confirm runs with valid secret', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/cron/bookings/auto-confirm',
            headers: { 'x-cron-secret': 'test-cron-secret' },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body).toHaveProperty('confirmed');
    });

    it('POST /api/cron/waitlist/expire-offers runs with valid secret', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/cron/waitlist/expire-offers',
            headers: { 'x-cron-secret': 'test-cron-secret' },
        });
        expect(res.statusCode).toBe(200);
    });

    it('POST /api/cron/marketplace/expire-reservations runs with valid secret', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/cron/marketplace/expire-reservations',
            headers: { 'x-cron-secret': 'test-cron-secret' },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body).toHaveProperty('expired');
    });

    it('POST /api/cron/wallet/expire-promotional-credits runs with valid secret', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/cron/wallet/expire-promotional-credits',
            headers: { 'x-cron-secret': 'test-cron-secret' },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body).toHaveProperty('expired');
    });

    it('POST /api/cron/championships/refresh runs with valid secret', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/cron/championships/refresh',
            headers: { 'x-cron-secret': 'test-cron-secret' },
        });
        expect(res.statusCode).toBe(200);
    });

    it('POST /api/cron/wallets/reconcile runs with valid secret', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/cron/wallets/reconcile',
            headers: { 'x-cron-secret': 'test-cron-secret' },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body).toHaveProperty('scanned');
    });

    it('POST /api/cron/wallets/auto-recharge-nudge runs with valid secret', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/cron/wallets/auto-recharge-nudge',
            headers: { 'x-cron-secret': 'test-cron-secret' },
        });
        expect(res.statusCode).toBe(200);
    });

    it('POST /api/cron/championships/finalize-ended runs with valid secret', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/cron/championships/finalize-ended',
            headers: { 'x-cron-secret': 'test-cron-secret' },
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body).toHaveProperty('finalized');
    });
});
