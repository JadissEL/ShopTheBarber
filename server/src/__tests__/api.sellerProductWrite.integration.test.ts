/**
 * Spec §7: Seller POST /api/products → 200
 */
import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_seller_product_${Date.now()}`;
const EMAIL = `seller-product-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'seller',
        full_name: 'Seller Product',
        avatar_url: null,
        account_type: 'seller',
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { seedProvisionedUser, seedSellerProfile } from './helpers/integrationUser';

describe('integration: seller product write (spec §7)', () => {
    const authHeaders = { authorization: 'Bearer test-token', 'content-type': 'application/json' };
    let productId: string | undefined;

    beforeAll(async () => {
        const user = await seedProvisionedUser({
            clerkUserId: CLERK_ID,
            email: EMAIL,
            accountType: 'seller',
            fullName: 'Seller Product',
        });
        await seedSellerProfile(user.id, 'Seller Product Store');
    });

    afterAll(async () => {
        if (productId) {
            await prisma.products.delete({ where: { id: productId } }).catch(() => undefined);
        }
        await prisma.users.deleteMany({ where: { email: EMAIL } });
        await (app as FastifyInstance).close();
    });

    it('allows seller POST /api/products', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/products',
            headers: authHeaders,
            payload: { name: 'Seller Spec Product', price: 29.99, category: 'hair', stock: 5 },
        });
        expect(res.statusCode).not.toBe(403);
        expect([200, 201]).toContain(res.statusCode);
        productId = (res.json() as { id?: string }).id;
    });
});
