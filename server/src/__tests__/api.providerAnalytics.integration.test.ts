/**
 * Provider analytics is booking-provider only (solo barber / shop).
 */
import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_pa_${Date.now()}`;
const EMAIL = `pa-seller-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'seller',
        full_name: 'Seller Analytics',
        avatar_url: null,
        account_type: 'seller',
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { seedProvisionedUser } from './helpers/integrationUser';

describe('integration: provider analytics RBAC', () => {
    const authHeaders = { authorization: 'Bearer test-token', 'content-type': 'application/json' };

    beforeAll(async () => {
        await seedProvisionedUser({
            clerkUserId: CLERK_ID,
            email: EMAIL,
            accountType: 'seller',
            fullName: 'Seller Analytics',
        });
    });

    afterAll(async () => {
        await prisma.users.deleteMany({ where: { email: EMAIL } });
        await (app as FastifyInstance).close();
    });

    it('rejects seller account from provider analytics', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/functions/provider-analytics',
            headers: authHeaders,
            payload: { barberId: '00000000-0000-0000-0000-000000000001' },
        });
        expect(res.statusCode).toBe(403);
        const body = JSON.parse(res.payload);
        expect(body.error).toMatch(/booking provider/i);
    });
});
