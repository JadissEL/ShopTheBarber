/**
 * Generic router write-scope hardening (validation report V1–V4).
 */
import { describe, it, expect, afterAll, beforeAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import crypto from 'crypto';

const CLERK_CLIENT = `clerk_scope_client_${Date.now()}`;
const CLERK_SHOP = `clerk_scope_shop_${Date.now()}`;
const EMAIL_CLIENT = `scope-client-${Date.now()}@example.com`;
const EMAIL_SHOP = `scope-shop-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_SHOP,
        email: EMAIL_SHOP,
        role: 'shop_owner',
        full_name: 'Scope Shop',
        avatar_url: null,
        account_type: 'shop',
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { seedProvisionedUser, seedShopWorkspace } from './helpers/integrationUser';

describe('integration: generic entity write scope hardening', () => {
    let clientUserId: string;
    let shopUserId: string;
    let ownedShopId: string;
    let victimShopId: string;

    beforeAll(async () => {
        const client = await seedProvisionedUser({
            clerkUserId: CLERK_CLIENT,
            email: EMAIL_CLIENT,
            accountType: 'client',
        });
        clientUserId = client.id;

        const shopUser = await seedProvisionedUser({
            clerkUserId: CLERK_SHOP,
            email: EMAIL_SHOP,
            accountType: 'shop',
            fullName: 'Scope Shop Owner',
        });
        shopUserId = shopUser.id;
        const workspace = await seedShopWorkspace(shopUserId);
        ownedShopId = workspace.shopId;
        victimShopId = crypto.randomUUID();
        await prisma.shops.create({
            data: {
                id: victimShopId,
                name: 'Victim Shop',
                location: 'Elsewhere',
                owner_id: clientUserId,
            },
        });
    });

    afterAll(async () => {
        await prisma.shop_members.deleteMany({ where: { shop_id: { in: [ownedShopId, victimShopId] } } }).catch(() => undefined);
        await prisma.shops.deleteMany({ where: { id: { in: [ownedShopId, victimShopId] } } }).catch(() => undefined);
        await prisma.barbers.deleteMany({ where: { user_id: shopUserId } }).catch(() => undefined);
        await prisma.users.deleteMany({ where: { email: { in: [EMAIL_CLIENT, EMAIL_SHOP] } } });
        await (app as FastifyInstance).close();
    });

    it('rejects unauthenticated POST /api/brands', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/brands',
            headers: { 'content-type': 'application/json' },
            payload: { name: 'Fake Brand' },
        });
        expect(res.statusCode).toBe(401);
    });

    it('rejects non-admin authenticated POST /api/brands', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/brands',
            headers: {
                authorization: 'Bearer shop-token',
                'content-type': 'application/json',
            },
            payload: { name: 'Fake Brand' },
        });
        expect(res.statusCode).toBe(403);
    });

    it('rejects shop POST /api/shop_members for victim shop_id', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/shop_members',
            headers: {
                authorization: 'Bearer shop-token',
                'content-type': 'application/json',
            },
            payload: {
                shop_id: victimShopId,
                user_id: shopUserId,
                role: 'owner',
                status: 'active',
            },
        });
        expect(res.statusCode).toBe(403);
    });

    it('rejects shop POST /api/services for victim shop_id', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/services',
            headers: {
                authorization: 'Bearer shop-token',
                'content-type': 'application/json',
            },
            payload: {
                name: 'Injected Service',
                price: 25,
                duration_minutes: 30,
                shop_id: victimShopId,
            },
        });
        expect(res.statusCode).toBe(403);
    });
});
