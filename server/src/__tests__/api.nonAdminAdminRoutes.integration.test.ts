/**
 * Spec §7: Non-admin users blocked from admin routes.
 */
import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_nonadmin_${Date.now()}`;
const EMAIL = `nonadmin-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'client',
        full_name: 'Non Admin',
        avatar_url: null,
        account_type: 'client',
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { seedProvisionedUser } from './helpers/integrationUser';

describe('integration: non-admin admin route RBAC (spec §7)', () => {
    const authHeaders = { authorization: 'Bearer test-token', 'content-type': 'application/json' };

    beforeAll(async () => {
        await seedProvisionedUser({
            clerkUserId: CLERK_ID,
            email: EMAIL,
            accountType: 'client',
            fullName: 'Non Admin',
        });
    });

    afterAll(async () => {
        await prisma.users.deleteMany({ where: { email: EMAIL } });
        await (app as FastifyInstance).close();
    });

    it('rejects client GET /api/admin/products', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/admin/products',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(403);
    });

    it('rejects client POST /api/admin/feature-flags/test-flag', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'PATCH',
            url: '/api/admin/feature-flags/marketplace',
            headers: authHeaders,
            payload: { enabled: false },
        });
        expect(res.statusCode).toBe(403);
    });
});
