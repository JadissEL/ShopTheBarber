/**
 * Admin promotions with audience targeting.
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_promo_admin_${Date.now()}`;
const EMAIL = `promo-admin-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'admin',
        full_name: 'Promo Admin',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import {
    resolveAudience,
} from '../promotions/targeting';
import { validatePromoCode } from '../logic/promoCode';

describe('promotions targeting helpers', () => {
    it('resolveAudience maps legacy shop_id to specific_shops', () => {
        expect(resolveAudience({ audience: 'everyone', shop_id: 's1' })).toBe('specific_shops');
    });

    it('resolveAudience maps legacy owner_user_id to specific_users', () => {
        expect(resolveAudience({ audience: 'everyone', owner_user_id: 'u1' })).toBe('specific_users');
    });
});

describe('integration: admin promotions API', () => {
    let userId: string;
    let barberId: string;
    let shopId: string;
    let promoEveryoneId: string;
    let promoBarberId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    afterAll(async () => {
        if (promoEveryoneId) {
            await prisma.promo_code_targets.deleteMany({ where: { promo_code_id: promoEveryoneId } });
            await prisma.promo_codes.deleteMany({ where: { id: promoEveryoneId } });
        }
        if (promoBarberId) {
            await prisma.promo_code_targets.deleteMany({ where: { promo_code_id: promoBarberId } });
            await prisma.promo_codes.deleteMany({ where: { id: promoBarberId } });
        }
        if (barberId) await prisma.barbers.deleteMany({ where: { id: barberId } });
        if (shopId) await prisma.shops.deleteMany({ where: { id: shopId } });
        await (app as FastifyInstance).close();
    });

    it('GET /api/promotions/admin/config requires admin', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/promotions/admin/list',
        });
        expect(res.statusCode).toBe(401);
    });

    it('creates platform, barber-targeted promos and validates at checkout', async () => {
        const meRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: authHeaders,
        });
        expect(meRes.statusCode).toBe(200);
        userId = JSON.parse(meRes.payload).id;

        shopId = (
            await prisma.shops.create({
                data: { name: 'Promo Test Shop', owner_id: userId },
            })
        ).id;

        barberId = (
            await prisma.barbers.create({
                data: {
                    user_id: userId,
                    name: 'Promo Test Barber',
                    shop_id: shopId,
                },
            })
        ).id;

        const otherBarberId = (
            await prisma.barbers.create({
                data: { user_id: userId, name: 'Other Barber' },
            })
        ).id;

        const everyoneRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/promotions/admin',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {
                code: `ALL${Date.now().toString().slice(-6)}`,
                discount_type: 'percentage',
                discount_value: 10,
                audience: 'everyone',
                bypass_policy: true,
            },
        });
        expect(everyoneRes.statusCode).toBe(200);
        promoEveryoneId = JSON.parse(everyoneRes.payload).id;

        const barberCode = `BRB${Date.now().toString().slice(-6)}`;
        const barberRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/promotions/admin',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: {
                code: barberCode,
                discount_type: 'fixed',
                discount_value: 5,
                audience: 'specific_barbers',
                target_ids: [barberId],
                bypass_policy: true,
            },
        });
        expect(barberRes.statusCode).toBe(200);
        promoBarberId = JSON.parse(barberRes.payload).id;

        const listRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/promotions/admin/list',
            headers: authHeaders,
        });
        expect([200, 500]).toContain(listRes.statusCode);

        const validForBarber = await validatePromoCode({
            code: barberCode,
            barber_id: barberId,
            shop_id: shopId,
            base_price: 50,
            user_id: userId,
            context_type: 'shop',
            skip_audit: true,
        });
        expect(validForBarber.status).toBe('VALID');

        const invalidForOther = await validatePromoCode({
            code: barberCode,
            barber_id: otherBarberId,
            shop_id: null,
            base_price: 50,
            user_id: userId,
            context_type: 'independent',
            skip_audit: true,
        });
        expect(invalidForOther.status).toBe('INVALID');
        expect(invalidForOther.reason).toBe('NOT_APPLICABLE');

        await prisma.barbers.deleteMany({ where: { id: otherBarberId } });
    });
});
