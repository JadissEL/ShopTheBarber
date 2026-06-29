/**
 * Smoke: shipping API (addresses, seller orders auth).
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';

const CLERK_ID = `clerk_ship_${Date.now()}`;
const EMAIL = `ship-int-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: CLERK_ID,
        email: EMAIL,
        role: 'client',
        full_name: 'Shipping Test User',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';

describe('integration: shipping API', () => {
    let userId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    afterAll(async () => {
        if (userId) {
            await prisma.saved_addresses.deleteMany({ where: { user_id: userId } });
            await prisma.users.deleteMany({ where: { id: userId } });
        }
        await (app as FastifyInstance).close();
    });

    it('GET /api/shipping/addresses requires auth', async () => {
        const res = await (app as FastifyInstance).inject({ method: 'GET', url: '/api/shipping/addresses' });
        expect(res.statusCode).toBe(401);
    });

    it('GET /api/shipping/addresses returns array for authenticated user', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/shipping/addresses',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(Array.isArray(body)).toBe(true);
        const user = await prisma.users.findFirst({ where: { clerk_user_id: CLERK_ID } });
        userId = user?.id ?? '';
        expect(userId).toBeTruthy();
    });

    it('POST /api/shipping/addresses validates required fields', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/shipping/addresses',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { label: 'Home' },
        });
        expect(res.statusCode).toBe(400);
    });

    it('GET /api/shipping/seller/orders returns array for client (empty)', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/shipping/seller/orders',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(JSON.parse(res.payload))).toBe(true);
    });
});
