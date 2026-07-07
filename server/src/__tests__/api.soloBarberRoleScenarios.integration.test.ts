/**
 * Spec §7: Solo barber products + jobs; dual booking payment rails respond.
 */
import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_solo_spec_${Date.now()}`;
const EMAIL = `solo-spec-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'barber',
        full_name: 'Solo Spec',
        avatar_url: null,
        account_type: 'solo_barber',
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { seedProvisionedUser, seedShopWorkspace } from './helpers/integrationUser';

describe('integration: solo barber role scenarios (spec §7)', () => {
    const authHeaders = { authorization: 'Bearer test-token', 'content-type': 'application/json' };
    let barberId: string;
    let shopId: string;
    let userId: string;
    let serviceId: string | undefined;
    let productId: string | undefined;
    let jobId: string | undefined;

    beforeAll(async () => {
        const user = await seedProvisionedUser({
            clerkUserId: CLERK_ID,
            email: EMAIL,
            accountType: 'solo_barber',
            fullName: 'Solo Spec',
        });
        userId = user.id;
        const workspace = await seedShopWorkspace(user.id);
        barberId = workspace.barberId!;
        shopId = workspace.shopId;
    });

    afterAll(async () => {
        if (jobId) await prisma.jobs.delete({ where: { id: jobId } }).catch(() => undefined);
        if (productId) await prisma.products.delete({ where: { id: productId } }).catch(() => undefined);
        if (serviceId) await prisma.services.delete({ where: { id: serviceId } }).catch(() => undefined);
        await prisma.shop_members.deleteMany({ where: { user_id: userId } }).catch(() => undefined);
        await prisma.shops.deleteMany({ where: { owner_id: userId } }).catch(() => undefined);
        await prisma.provider_fee_wallets.deleteMany({ where: { user_id: userId } }).catch(() => undefined);
        await prisma.barbers.deleteMany({ where: { user_id: userId } });
        await prisma.users.deleteMany({ where: { email: EMAIL } });
        await (app as FastifyInstance).close();
    });

    it('allows solo barber POST /api/services', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/services',
            headers: authHeaders,
            payload: {
                name: 'Solo Spec Cut',
                price: 35,
                duration_minutes: 45,
                barber_id: barberId,
            },
        });
        expect(res.statusCode).not.toBe(403);
        expect([200, 201]).toContain(res.statusCode);
        serviceId = (res.json() as { id?: string }).id;
    });

    it('allows solo barber POST /api/products', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/products',
            headers: authHeaders,
            payload: {
                name: 'Barber Product',
                price: 22,
                category: 'styling',
                barber_id: barberId,
                seller_type: 'barber',
                stock: 4,
            },
        });
        expect(res.statusCode).not.toBe(403);
        expect([200, 201]).toContain(res.statusCode);
        productId = (res.json() as { id?: string }).id;
    });

    it('allows solo barber POST /api/jobs', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/jobs',
            headers: authHeaders,
            payload: {
                title: 'Assistant Barber',
                category: 'grooming',
                employer_type: 'shop',
                shop_id: shopId,
                employment_type: 'part_time',
                location_type: 'on_site',
            },
        });
        expect(res.statusCode).not.toBe(403);
        expect([200, 201]).toContain(res.statusCode);
        jobId = (res.json() as { id?: string }).id;
    });

    it('returns 200 for card booking preview (Stripe Connect rail)', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/payment-protection/preview?barber_id=${barberId}&total_price=50&payment_method=online`,
        });
        expect(res.statusCode).toBe(200);
    });

    it('returns 200 for provider wallet dashboard (cash rail)', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/provider-wallet/me',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(200);
    });
});
