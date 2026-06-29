/**
 * Provider fixed-fee plans — Jan–Mar enrollment, 30% annual discount.
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_ff_${Date.now()}`;
const EMAIL = `fixedfee-int-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'barber',
        full_name: 'Fixed Fee Barber',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import {
    calculateFixedFeeCheckoutAmount,
    confirmFixedFeeFromCheckout,
    createFixedFeeCheckout,
    getCoverageYear,
    isEnrollmentWindowOpen,
    runFixedFeeMaintenance,
    shouldWaiveCommissionForBooking,
} from '../fixedFee/logic';

describe('fixedFee logic', () => {
    it('calculateFixedFeeCheckoutAmount applies 30% annual discount', () => {
        expect(calculateFixedFeeCheckoutAmount(100, 'monthly')).toEqual({
            amount: 100,
            discount_percent: 0,
            months_covered: 1,
        });
        expect(calculateFixedFeeCheckoutAmount(100, 'annual')).toEqual({
            amount: 840,
            discount_percent: 30,
            months_covered: 12,
        });
    });

    it('isEnrollmentWindowOpen is true only in Jan–Mar', () => {
        expect(isEnrollmentWindowOpen(new Date('2026-01-15T12:00:00Z'))).toBe(true);
        expect(isEnrollmentWindowOpen(new Date('2026-03-31T12:00:00Z'))).toBe(true);
        expect(isEnrollmentWindowOpen(new Date('2026-06-15T12:00:00Z'))).toBe(false);
    });

    it('createFixedFeeCheckout rejects new enrollment outside Jan–Mar', async () => {
        const meRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: { authorization: 'Bearer test-token' },
        });
        const userId = JSON.parse(meRes.payload).id;
        const existingBarber = await prisma.barbers.findFirst({ where: { user_id: userId } });
        if (!existingBarber) {
            await prisma.barbers.create({ data: { user_id: userId, name: 'FF Barber' } });
        }

        await expect(
            createFixedFeeCheckout(userId, 'barber', 'barber', 'annual', undefined, {
                at: new Date('2026-07-01T12:00:00Z'),
            })
        ).rejects.toThrow(/January and March/i);
    });
});

describe('integration: fixed-fee API', () => {
    let userId: string;
    let barberId: string;
    let planId: string;
    const authHeaders = { authorization: 'Bearer test-token' };
    const coverageYear = getCoverageYear();

    afterAll(async () => {
        if (planId) await prisma.provider_fixed_fee_plans.deleteMany({ where: { id: planId } });
        if (barberId) await prisma.barbers.deleteMany({ where: { id: barberId } });
        if (userId) {
            await prisma.audit_logs.deleteMany({ where: { actor_id: userId } });
            await prisma.users.deleteMany({ where: { id: userId } });
        }
        await (app as FastifyInstance).close();
    });

    it('GET /api/fixed-fee/config is public', async () => {
        const res = await (app as FastifyInstance).inject({ method: 'GET', url: '/api/fixed-fee/config' });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.annual_discount_percent).toBe(30);
        expect(body.enrollment_months).toEqual([1, 2, 3]);
    });

    it('POST /api/fixed-fee/subscribe blocked outside enrollment window (real calendar)', async () => {
        if (isEnrollmentWindowOpen()) {
            return;
        }

        const meRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: authHeaders,
        });
        userId = JSON.parse(meRes.payload).id;
        let barber = await prisma.barbers.findFirst({ where: { user_id: userId } });
        if (!barber) {
            barber = await prisma.barbers.create({ data: { user_id: userId, name: 'FF Barber' } });
        }
        barberId = barber.id;

        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/fixed-fee/subscribe',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { scope: 'barber', billing_cycle: 'annual' },
        });
        expect(res.statusCode).toBe(400);
        expect(JSON.parse(res.payload).error).toMatch(/January and March/i);
    });

    it('confirm checkout activates plan and waives commission', async () => {
        const meRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: authHeaders,
        });
        userId = JSON.parse(meRes.payload).id;
        let barber = await prisma.barbers.findFirst({ where: { user_id: userId } });
        if (!barber) {
            barber = await prisma.barbers.create({ data: { user_id: userId, name: 'FF Barber' } });
        }
        barberId = barber.id;

        const monthlyFee = 79;
        const { amount } = calculateFixedFeeCheckoutAmount(monthlyFee, 'annual');
        const now = new Date();
        const periodEnd = new Date(Date.UTC(coverageYear, 11, 31, 23, 59, 59, 999)).toISOString();

        const plan = await prisma.provider_fixed_fee_plans.upsert({
            where: {
                user_id_scope_coverage_year: {
                    user_id: userId,
                    scope: 'barber',
                    coverage_year: coverageYear,
                },
            },
            create: {
                user_id: userId,
                barber_id: barberId,
                scope: 'barber',
                billing_cycle: 'annual',
                coverage_year: coverageYear,
                monthly_fee_amount: monthlyFee,
                discount_percent: 30,
                status: 'pending_payment',
                payment_status: 'unpaid',
                period_start: now.toISOString(),
                period_end: periodEnd,
            },
            update: {
                status: 'pending_payment',
                payment_status: 'unpaid',
                period_start: now.toISOString(),
                period_end: periodEnd,
            },
        });
        planId = plan.id;

        const result = await confirmFixedFeeFromCheckout({
            id: 'cs_test_fixedfee',
            metadata: {
                plan_id: planId,
                user_id: userId,
                amount: String(amount),
            },
        } as Parameters<typeof confirmFixedFeeFromCheckout>[0]);
        expect(result.processed).toBe(true);

        const waived = await shouldWaiveCommissionForBooking(barberId, null);
        expect(waived).toBe(true);

        const statusRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/fixed-fee/me',
            headers: authHeaders,
        });
        expect(statusRes.statusCode).toBe(200);
        const status = JSON.parse(statusRes.payload);
        expect(status.commission_waived).toBe(true);
        expect(status.active.barber.billing_cycle).toBe('annual');
    });

    it('runFixedFeeMaintenance expires past-due plans', async () => {
        const meRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: authHeaders,
        });
        userId = JSON.parse(meRes.payload).id;
        let barber = await prisma.barbers.findFirst({ where: { user_id: userId } });
        if (!barber) {
            barber = await prisma.barbers.create({ data: { user_id: userId, name: 'FF Barber' } });
        }
        barberId = barber.id;

        await prisma.provider_fixed_fee_plans.deleteMany({ where: { user_id: userId } });

        const expiredPlan = await prisma.provider_fixed_fee_plans.create({
            data: {
                user_id: userId,
                barber_id: barberId,
                scope: 'barber',
                billing_cycle: 'monthly',
                coverage_year: 2025,
                monthly_fee_amount: 79,
                status: 'active',
                payment_status: 'paid',
                period_start: '2025-01-01T00:00:00.000Z',
                period_end: '2025-01-31T23:59:59.999Z',
            },
        });
        planId = expiredPlan.id;

        const result = await runFixedFeeMaintenance(new Date('2026-06-01T12:00:00Z'));
        expect(result.expired).toBeGreaterThanOrEqual(1);

        const updated = await prisma.provider_fixed_fee_plans.findUnique({ where: { id: planId } });
        expect(updated?.status).toBe('expired');

        const waived = await shouldWaiveCommissionForBooking(barberId, null);
        expect(waived).toBe(false);
    });
});
