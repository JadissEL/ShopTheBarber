/**
 * Smoke: provider fee wallet (cash-in-store bookings).
 */
import { describe, it, expect, afterAll, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import crypto from 'crypto';

const BARBER_CLERK = `clerk_pfw_barber_${Date.now()}`;
const BARBER_EMAIL = `pfw-barber-${Date.now()}@example.com`;

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => ({
        id: BARBER_CLERK,
        email: BARBER_EMAIL,
        role: 'barber',
        full_name: 'PFW Barber',
        avatar_url: null,
    })),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';
import { calculatePlatformFee } from '../providerWallet/logic';

describe('providerWallet logic', () => {
    it('calculatePlatformFee uses shop vs freelancer rates', () => {
        expect(calculatePlatformFee(100, 'shop-id')).toBe(20);
        expect(calculatePlatformFee(100, null)).toBe(15);
    });
});

describe('integration: provider fee wallet API', () => {
    let userId: string;
    let barberId: string;
    let walletId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    afterAll(async () => {
        if (walletId) {
            await prisma.provider_fee_transactions.deleteMany({ where: { wallet_id: walletId } });
            await prisma.provider_fee_wallets.deleteMany({ where: { id: walletId } });
        }
        if (barberId) {
            await prisma.barbers.deleteMany({ where: { id: barberId } });
        }
        if (userId) {
            await prisma.users.deleteMany({ where: { id: userId } });
        }
        await (app as FastifyInstance).close();
    });

    it('GET /api/provider-wallet/me requires auth', async () => {
        const res = await (app as FastifyInstance).inject({ method: 'GET', url: '/api/provider-wallet/me' });
        expect(res.statusCode).toBe(401);
    });

    it('creates barber profile and wallet dashboard', async () => {
        userId = crypto.randomUUID();
        barberId = crypto.randomUUID();
        await prisma.users.create({
            data: {
                id: userId,
                clerk_user_id: BARBER_CLERK,
                email: BARBER_EMAIL,
                full_name: 'PFW Barber',
                role: 'barber',
            },
        });
        await prisma.barbers.create({
            data: {
                id: barberId,
                user_id: userId,
                name: 'Test Barber',
            },
        });

        const res = await (app as FastifyInstance).inject({
            method: 'GET',
            url: '/api/provider-wallet/me',
            headers: authHeaders,
        });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.payload);
        expect(body.barber_wallet).toBeTruthy();
        walletId = body.barber_wallet.id;
    });

    it('PATCH settings rejects cash without minimum balance', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'PATCH',
            url: '/api/provider-wallet/settings',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { accepts_cash_in_store: true, scope: 'barber' },
        });
        expect(res.statusCode).toBe(400);
    });

    it('enables cash after crediting wallet', async () => {
        await prisma.provider_fee_wallets.update({
            where: { id: walletId },
            data: { balance: 50 },
        });

        const settingsRes = await (app as FastifyInstance).inject({
            method: 'PATCH',
            url: '/api/provider-wallet/settings',
            headers: { ...authHeaders, 'content-type': 'application/json' },
            payload: { accepts_cash_in_store: true, scope: 'barber' },
        });
        expect(settingsRes.statusCode).toBe(200);

        const availRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/provider-wallet/cash-availability?barber_id=${barberId}`,
        });
        expect(availRes.statusCode).toBe(200);
        const avail = JSON.parse(availRes.payload);
        expect(avail.accepts_cash).toBe(true);
    });
});
