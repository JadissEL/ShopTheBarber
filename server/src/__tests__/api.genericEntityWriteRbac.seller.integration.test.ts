/**
 * Non-booking roles must not create provider entities via generic API.
 */
import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_seller_entity_${Date.now()}`;
const EMAIL = `seller-entity-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'seller',
        full_name: 'Seller Entity',
        avatar_url: null,
        account_type: 'seller',
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { seedProvisionedUser } from './helpers/integrationUser';

describe('integration: generic entity write RBAC (seller)', () => {
    const authHeaders = { authorization: 'Bearer test-token', 'content-type': 'application/json' };

    beforeAll(async () => {
        await seedProvisionedUser({
            clerkUserId: CLERK_ID,
            email: EMAIL,
            accountType: 'seller',
            fullName: 'Seller Entity',
        });
    });

    afterAll(async () => {
        await prisma.users.deleteMany({ where: { email: EMAIL } });
        await (app as FastifyInstance).close();
    });

    it('rejects seller POST /api/services', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/services',
            headers: authHeaders,
            payload: { name: 'Test Cut', price: 25, duration_minutes: 30 },
        });
        expect(res.statusCode).toBe(403);
    });

    it('rejects seller POST /api/barbers', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/barbers',
            headers: authHeaders,
            payload: { title: 'Test Barber' },
        });
        expect(res.statusCode).toBe(403);
    });
});
