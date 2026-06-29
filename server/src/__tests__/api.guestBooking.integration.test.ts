/**
 * Guest booking — no auth for book/view/cancel; auth for claim.
 */
import { describe, it, expect, afterAll, vi, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { addDays, format } from 'date-fns';
import { enUS } from 'date-fns/locale';

const PROVIDER_CLERK = `clerk_guest_provider_${Date.now()}`;
const PROVIDER_EMAIL = `guest-provider-${Date.now()}@example.com`;
const CLIENT_CLERK = `clerk_guest_client_${Date.now()}`;
const CLIENT_EMAIL = `guest-client-${Date.now()}@example.com`;

let mockClerkUser: {
    id: string;
    email: string;
    role: string;
    full_name: string;
    avatar_url: null;
} = {
    id: PROVIDER_CLERK,
    email: PROVIDER_EMAIL,
    role: 'barber',
    full_name: 'Guest Test Barber',
    avatar_url: null,
};

vi.mock('../auth/clerk', () => ({
    verifyClerkToken: vi.fn(async () => mockClerkUser),
}));

import { prisma } from '../db/prisma';
import { fastify as app } from '../index';

function tomorrowDateText(): string {
    return format(addDays(new Date(), 1), 'PPP', { locale: enUS });
}

describe('integration: guest booking API', () => {
    let providerUserId: string;
    let clientUserId: string;
    let shopId: string;
    let barberId: string;
    let shopMemberId: string;
    let serviceId: string;
    let walletId: string;
    const authHeaders = { authorization: 'Bearer test-token' };

    beforeAll(async () => {
        shopId = `shop-guest-${Date.now()}`;
        barberId = `barber-guest-${Date.now()}`;
        shopMemberId = `sm-guest-${Date.now()}`;
        serviceId = `svc-guest-${Date.now()}`;
        walletId = `pfw-guest-${Date.now()}`;
        providerUserId = crypto.randomUUID();

        await prisma.users.create({
            data: {
                id: providerUserId,
                clerk_user_id: PROVIDER_CLERK,
                email: PROVIDER_EMAIL,
                full_name: 'Guest Test Barber',
                role: 'barber',
            },
        });

        await prisma.shops.create({
            data: {
                id: shopId,
                name: 'Guest Test Shop',
                location: 'Test City',
                owner_id: providerUserId,
                accepts_cash_in_store: true,
            },
        });

        await prisma.barbers.create({
            data: {
                id: barberId,
                user_id: providerUserId,
                shop_id: shopId,
                name: 'Guest Test Barber',
                accepts_cash_in_store: true,
            },
        });

        await prisma.shop_members.create({
            data: {
                id: shopMemberId,
                shop_id: shopId,
                user_id: providerUserId,
                barber_id: barberId,
                role: 'barber',
            },
        });

        await prisma.provider_fee_wallets.create({
            data: {
                id: walletId,
                user_id: providerUserId,
                shop_id: shopId,
                balance: 50,
                accepts_cash_in_store: true,
                minimum_balance: 5,
                currency: 'EUR',
            },
        });

        await prisma.services.create({
            data: {
                id: serviceId,
                shop_id: shopId,
                barber_id: barberId,
                name: 'Guest Cut',
                category: 'Hair',
                price: 35,
                duration_minutes: 30,
            },
        });
    });

    afterAll(async () => {
        await prisma.bookings.deleteMany({ where: { barber_id: barberId } });
        await prisma.provider_fee_transactions.deleteMany({ where: { wallet_id: walletId } });
        await prisma.provider_fee_wallets.deleteMany({ where: { id: walletId } });
        await prisma.services.deleteMany({ where: { id: serviceId } });
        await prisma.shop_members.deleteMany({ where: { id: shopMemberId } });
        await prisma.barbers.deleteMany({ where: { id: barberId } });
        await prisma.shops.deleteMany({ where: { id: shopId } });
        if (clientUserId) await prisma.users.deleteMany({ where: { id: clientUserId } });
        if (providerUserId) await prisma.users.deleteMany({ where: { id: providerUserId } });
        await (app as FastifyInstance).close();
    });

    it('POST /api/pricing/quote works without auth', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/pricing/quote',
            headers: { 'content-type': 'application/json' },
            payload: {
                barber_id: barberId,
                shop_id: shopId,
                shop_member_id: shopMemberId,
                service_ids: [serviceId],
                context_type: 'shop',
            },
        });
        expect(res.statusCode).toBe(200);
        const quote = JSON.parse(res.payload);
        expect(quote.final_price ?? quote.sum_price).toBeGreaterThan(0);
    });

    it('guest books, views, previews cancel, and cancels', async () => {
        const quoteRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/pricing/quote',
            headers: { 'content-type': 'application/json' },
            payload: {
                barber_id: barberId,
                shop_id: shopId,
                shop_member_id: shopMemberId,
                service_ids: [serviceId],
                context_type: 'shop',
            },
        });
        const quote = JSON.parse(quoteRes.payload);
        const finalPrice = quote.final_price ?? quote.sum_price ?? 35;

        const bookRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/bookings/guest',
            headers: { 'content-type': 'application/json' },
            payload: {
                barber_id: barberId,
                shop_id: shopId,
                shop_member_id: shopMemberId,
                service_ids: [serviceId],
                service_name: 'Guest Cut',
                date_text: tomorrowDateText(),
                time_text: '3:30 PM',
                location: 'Guest Test Shop',
                visit_type: 'shop',
                context_type: 'shop',
                status: 'pending',
                payment_method: 'cash_at_store',
                price_at_booking: finalPrice,
                duration_at_booking: 30,
                guest_name: 'Integration Guest',
                guest_phone: '+33611223344',
            },
        });
        expect(bookRes.statusCode, bookRes.payload).toBe(200);
        const booking = JSON.parse(bookRes.payload);
        expect(booking.guest_access_token?.length).toBeGreaterThan(20);
        expect(booking.is_guest_booking).toBe(true);

        const viewRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/bookings/guest/${encodeURIComponent(booking.guest_access_token)}`,
        });
        expect(viewRes.statusCode).toBe(200);
        expect(JSON.parse(viewRes.payload).client_name).toBe('Integration Guest');

        const previewRes = await (app as FastifyInstance).inject({
            method: 'GET',
            url: `/api/bookings/guest/${encodeURIComponent(booking.guest_access_token)}/cancel-preview`,
        });
        expect(previewRes.statusCode).toBe(200);
        expect(JSON.parse(previewRes.payload).is_guest).toBe(true);

        const cancelRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: `/api/bookings/guest/${encodeURIComponent(booking.guest_access_token)}/cancel`,
        });
        expect(cancelRes.statusCode).toBe(200);
        expect(JSON.parse(cancelRes.payload).cancelled).toBe(true);
    });

    it('rejects online payment for guest bookings', async () => {
        const res = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/bookings/guest',
            headers: { 'content-type': 'application/json' },
            payload: {
                barber_id: barberId,
                shop_id: shopId,
                shop_member_id: shopMemberId,
                service_ids: [serviceId],
                payment_method: 'online',
                guest_name: 'Bad Guest',
                guest_phone: '+33699887766',
            },
        });
        expect(res.statusCode).toBe(400);
        expect(JSON.parse(res.payload).error).toMatch(/pay-at-shop/i);
    });

    it('authenticated client can claim guest booking by token', async () => {
        const quoteRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/pricing/quote',
            headers: { 'content-type': 'application/json' },
            payload: {
                barber_id: barberId,
                shop_id: shopId,
                shop_member_id: shopMemberId,
                service_ids: [serviceId],
                context_type: 'shop',
            },
        });
        const quote = JSON.parse(quoteRes.payload);
        const finalPrice = quote.final_price ?? quote.sum_price ?? 35;

        const bookRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: '/api/bookings/guest',
            headers: { 'content-type': 'application/json' },
            payload: {
                barber_id: barberId,
                shop_id: shopId,
                shop_member_id: shopMemberId,
                service_ids: [serviceId],
                service_name: 'Guest Cut',
                date_text: tomorrowDateText(),
                time_text: '5:00 PM',
                location: 'Guest Test Shop',
                visit_type: 'shop',
                context_type: 'shop',
                payment_method: 'cash_at_store',
                price_at_booking: finalPrice,
                duration_at_booking: 30,
                guest_name: 'Claim Me',
                guest_phone: '+33655443322',
            },
        });
        const { guest_access_token: token, id: bookingId } = JSON.parse(bookRes.payload);

        mockClerkUser = {
            id: CLIENT_CLERK,
            email: CLIENT_EMAIL,
            role: 'client',
            full_name: 'Claim Client',
            avatar_url: null,
        };

        clientUserId = crypto.randomUUID();
        await prisma.users.create({
            data: {
                id: clientUserId,
                clerk_user_id: CLIENT_CLERK,
                email: CLIENT_EMAIL,
                full_name: 'Claim Client',
                role: 'client',
            },
        });

        const claimRes = await (app as FastifyInstance).inject({
            method: 'POST',
            url: `/api/bookings/guest/${encodeURIComponent(token)}/claim`,
            headers: authHeaders,
        });
        expect(claimRes.statusCode, claimRes.payload).toBe(200);
        expect(JSON.parse(claimRes.payload).linked).toBe(true);

        const row = await prisma.bookings.findUnique({ where: { id: bookingId } });
        expect(row?.client_id).toBe(clientUserId);
        expect(row?.guest_access_token).toBeNull();
    });
});
