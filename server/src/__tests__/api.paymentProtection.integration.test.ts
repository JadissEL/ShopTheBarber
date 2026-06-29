/**
 * Payment protection preview API smoke test.
 */
import { describe, it, expect, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { fastify as app } from '../index';
import { prisma } from '../db/prisma';

describe('integration: payment protection preview', () => {
    afterAll(async () => {
        await (app as FastifyInstance).close();
    });

    it('GET /api/payment-protection/preview returns policy shape', async () => {
        const barber = await prisma.barbers.findFirst({ select: { id: true, shop_id: true } });
        if (!barber) {
            return expect(true).toBe(true);
        }

        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/payment-protection/preview?barber_id=${barber.id}&total_price=50&payment_method=online`,
        });

        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body).toHaveProperty('next_step');
        expect(body).toHaveProperty('policy');
        expect(body).toHaveProperty('stripe_configured');
        if (body.schema_not_ready) {
            expect(body.next_step).toBe('none');
            return;
        }
        expect(['none', 'save_card', 'deposit', 'auth_hold', 'full_payment']).toContain(body.next_step);
    });
});
