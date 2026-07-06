/**
 * Sellers must not access booking-provider barber mutation routes.
 */
import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_seller_rbac_${Date.now()}`;
const EMAIL = `seller-rbac-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'seller',
        full_name: 'Seller RBAC',
        avatar_url: null,
        account_type: 'seller',
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { seedProvisionedUser } from './helpers/integrationUser';

describe('integration: seller blocked from booking-provider routes', () => {
    const authHeaders = { authorization: 'Bearer test-token', 'content-type': 'application/json' };

    beforeAll(async () => {
        await seedProvisionedUser({
            clerkUserId: CLERK_ID,
            email: EMAIL,
            accountType: 'seller',
            fullName: 'Seller RBAC',
        });
    });

    afterAll(async () => {
        await prisma.users.deleteMany({ where: { email: EMAIL } });
        await (app as FastifyInstance).close();
    });

    it('rejects seller from barber languages update', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'PUT',
            url: '/api/provider/barber/languages',
            headers: authHeaders,
            payload: { languages: ['en'] },
        });
        expect(res.statusCode).toBe(403);
    });

    it('rejects seller from provider fee wallet dashboard', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/provider-wallet/me',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(403);
    });
});
