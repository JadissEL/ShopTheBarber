/**
 * Spec §7: Blogger articles/products allowed, services denied.
 */
import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_blogger_spec_${Date.now()}`;
const EMAIL = `blogger-spec-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'blogger',
        full_name: 'Blogger Spec',
        avatar_url: null,
        account_type: 'blogger',
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { seedAuthorProfile, seedProvisionedUser, seedSellerProfile } from './helpers/integrationUser';

describe('integration: blogger role scenarios (spec §7)', () => {
    const authHeaders = { authorization: 'Bearer test-token', 'content-type': 'application/json' };
    let articleId: string | undefined;
    let productId: string | undefined;
    let userId: string;

    beforeAll(async () => {
        const user = await seedProvisionedUser({
            clerkUserId: CLERK_ID,
            email: EMAIL,
            accountType: 'blogger',
            fullName: 'Blogger Spec',
        });
        userId = user.id;
        await seedAuthorProfile(user.id, 'Blogger Spec');
        await seedSellerProfile(user.id, 'Blogger Store');
    });

    afterAll(async () => {
        if (articleId) await prisma.articles.delete({ where: { id: articleId } }).catch(() => undefined);
        if (productId) await prisma.products.delete({ where: { id: productId } }).catch(() => undefined);
        await prisma.author_profiles.deleteMany({ where: { user_id: userId } }).catch(() => undefined);
        await prisma.seller_profiles.deleteMany({ where: { user_id: userId } }).catch(() => undefined);
        await prisma.users.deleteMany({ where: { email: EMAIL } });
        await (app as FastifyInstance).close();
    });

    it('allows blogger POST /api/articles', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/articles',
            headers: authHeaders,
            payload: {
                title: 'Blogger Spec Article',
                excerpt: 'Short excerpt for spec test.',
                content: 'Body content long enough for blogger spec scenario validation.',
                category: 'tips',
            },
        });
        expect(res.statusCode).not.toBe(403);
        expect([200, 201]).toContain(res.statusCode);
        articleId = (res.json() as { id?: string }).id;
    });

    it('allows blogger POST /api/products', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/products',
            headers: authHeaders,
            payload: { name: 'Blogger Product', price: 18, category: 'beard', stock: 3 },
        });
        expect(res.statusCode).not.toBe(403);
        expect([200, 201]).toContain(res.statusCode);
        productId = (res.json() as { id?: string }).id;
    });

    it('rejects blogger POST /api/services', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/services',
            headers: authHeaders,
            payload: { name: 'Forbidden Cut', price: 20, duration_minutes: 30 },
        });
        expect(res.statusCode).toBe(403);
    });
});
