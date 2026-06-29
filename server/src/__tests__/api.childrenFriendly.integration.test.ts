/**
 * Children-friendly settings for barbers and shops.
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_cf_${Date.now()}`;
const EMAIL = `cf-int-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'barber',
        full_name: 'CF Barber',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { effectiveChildrenFriendly } from '../childrenFriendly/logic';

describe('childrenFriendly logic', () => {
    it('effectiveChildrenFriendly is true if barber OR shop welcomes kids', () => {
        expect(effectiveChildrenFriendly(false, false)).toBe(false);
        expect(effectiveChildrenFriendly(true, false)).toBe(true);
        expect(effectiveChildrenFriendly(false, true)).toBe(true);
    });
});

describe('integration: children-friendly API', () => {
    let userId: string;
    let barberId: string;
    let shopId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    afterAll(async () => {
        if (barberId) await prisma.barbers.deleteMany({ where: { id: barberId } });
        if (shopId) await prisma.shops.deleteMany({ where: { id: shopId } });
        if (userId) await prisma.users.deleteMany({ where: { id: userId } });
        await (app as FastifyInstance).close();
    });

    it('GET /api/children-friendly/config is public', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/children-friendly/config',
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.label).toBe('Kids welcome');
    });

    it('PUT barber and shop children-friendly, GET effective', async () => {
        const meRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/auth/me',
            headers: authHeaders,
        });
        expect(meRes.statusCode).toBe(200);
        userId = JSON.parse(meRes.payload).id;

        const barberRes = await (app as FastifyInstance).inject({
            method: 'PUT',
            url: '/api/provider/barber/children-friendly',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { children_friendly: true },
        });
        expect(barberRes.statusCode).toBe(200);
        barberId = JSON.parse(barberRes.payload).id;
        expect(JSON.parse(barberRes.payload).children_friendly).toBe(true);

        const shop = await prisma.shops.create({
            data: {
                name: 'Kids Cut Shop',
                owner_id: userId,
                children_friendly: false,
            },
        });
        shopId = shop.id;
        await prisma.barbers.update({
            where: { id: barberId },
            data: { shop_id: shopId },
        });

        const shopRes = await (app as FastifyInstance).inject({
            method: 'PUT',
            url: `/api/provider/shop/${shopId}/children-friendly`,
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { children_friendly: true },
        });
        expect(shopRes.statusCode).toBe(200);
        expect(JSON.parse(shopRes.payload).children_friendly).toBe(true);

        const effectiveRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/barbers/${barberId}/children-friendly`,
        });
        expect(effectiveRes.statusCode).toBe(200);
        const effective = JSON.parse(effectiveRes.payload);
        expect(effective.children_friendly).toBe(true);
        expect(effective.barber_friendly).toBe(true);
        expect(effective.shop_friendly).toBe(true);

        const shopPublic = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/shops/${shopId}/children-friendly`,
        });
        expect(shopPublic.statusCode).toBe(200);
        expect(JSON.parse(shopPublic.payload).children_friendly).toBe(true);
    });
});
