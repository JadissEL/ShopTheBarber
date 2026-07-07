/**
 * Spec §7: Shop POST /api/products → 200
 */
import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_shop_spec_${Date.now()}`;
const EMAIL = `shop-spec-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'shop_owner',
        full_name: 'Shop Spec',
        avatar_url: null,
        account_type: 'shop',
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { seedProvisionedUser, seedShopWorkspace } from './helpers/integrationUser';

describe('integration: shop role scenarios (spec §7)', () => {
    const authHeaders = { authorization: 'Bearer test-token', 'content-type': 'application/json' };
    let productId: string | undefined;
    let userId: string;
    let shopId: string;

    beforeAll(async () => {
        const user = await seedProvisionedUser({
            clerkUserId: CLERK_ID,
            email: EMAIL,
            accountType: 'shop',
            role: 'shop_owner',
            fullName: 'Shop Spec',
        });
        userId = user.id;
        const workspace = await seedShopWorkspace(user.id);
        shopId = workspace.shopId;
    });

    afterAll(async () => {
        if (productId) await prisma.products.delete({ where: { id: productId } }).catch(() => undefined);
        await prisma.shop_members.deleteMany({ where: { user_id: userId } }).catch(() => undefined);
        await prisma.shops.deleteMany({ where: { owner_id: userId } }).catch(() => undefined);
        await prisma.barbers.deleteMany({ where: { user_id: userId } }).catch(() => undefined);
        await prisma.users.deleteMany({ where: { email: EMAIL } });
        await (app as FastifyInstance).close();
    });

    it('allows shop POST /api/products', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/products',
            headers: authHeaders,
            payload: {
                name: 'Shop Spec Product',
                price: 40,
                category: 'tools',
                shop_id: shopId,
                seller_type: 'shop',
                stock: 6,
            },
        });
        expect(res.statusCode).not.toBe(403);
        expect([200, 201]).toContain(res.statusCode);
        productId = (res.json() as { id?: string }).id;
    });
});
