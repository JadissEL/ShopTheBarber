/**
 * Company marketplace commerce requires on-request activation.
 */
import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_company_product_${Date.now()}`;
const EMAIL = `company-product-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'company',
        full_name: 'Company Product',
        avatar_url: null,
        account_type: 'company',
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { seedCompanyWorkspace, seedProvisionedUser } from './helpers/integrationUser';

describe('integration: company product write RBAC', () => {
    const authHeaders = { authorization: 'Bearer test-token', 'content-type': 'application/json' };
    let userId: string;

    beforeAll(async () => {
        delete process.env.COMPANY_COMMERCE_USER_IDS;
        const user = await seedProvisionedUser({
            clerkUserId: CLERK_ID,
            email: EMAIL,
            accountType: 'company',
            fullName: 'Company Product',
        });
        userId = user.id;
        await seedCompanyWorkspace(userId, 'Company Product Co', { commerceEnabled: false });
    });

    afterAll(async () => {
        await prisma.company_accounts.deleteMany({ where: { user_id: userId } }).catch(() => undefined);
        await prisma.users.deleteMany({ where: { email: EMAIL } });
        await (app as FastifyInstance).close();
    });

    it('rejects company POST /api/products when commerce is not activated', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/products',
            headers: authHeaders,
            payload: { name: 'Company Product', price: 19.99 },
        });
        expect(res.statusCode).toBe(403);
    });
});
