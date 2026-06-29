import { test, expect } from '@playwright/test';
import { hasApiBaseUrl } from './fixtures/env';
import { SEED } from './fixtures/seed-data';
import {
    createGuestShopBooking,
    fetchPublicPriceQuote,
    tomorrowBookingDateText,
} from './fixtures/booking-helpers';

/**
 * Guest booking API — no Clerk JWT required (Cutly-style path).
 * Requires seeded DB; skips when pay-at-shop is unavailable for the seeded barber.
 */
test.describe('Guest booking API', () => {
    test('public quote works without auth', async ({ request }) => {
        test.skip(!hasApiBaseUrl(), 'Set E2E_API_BASE_URL');

        const quote = await fetchPublicPriceQuote(request, {
            barberId: SEED.barber.nikos.id,
            shopId: SEED.shop.downtown.id,
            shopMemberId: SEED.shopMember.gb1,
            serviceIds: [SEED.service.signatureCut.id],
        });

        expect(quote.final_price ?? quote.sum_price ?? 0).toBeGreaterThan(0);
    });

    test('guest can book, view, and cancel via magic link token', async ({ request }) => {
        test.skip(!hasApiBaseUrl(), 'Set E2E_API_BASE_URL');

        const cashRes = await request.get(
            `/api/provider-wallet/cash-availability?barber_id=${SEED.barber.nikos.id}&shop_id=${SEED.shop.downtown.id}`
        );
        expect(cashRes.ok()).toBeTruthy();
        const cash = (await cashRes.json()) as { accepts_cash?: boolean };
        test.skip(!cash.accepts_cash, 'Seeded barber must accept pay-at-shop for guest booking E2E');

        const quote = await fetchPublicPriceQuote(request, {
            barberId: SEED.barber.nikos.id,
            shopId: SEED.shop.downtown.id,
            shopMemberId: SEED.shopMember.gb1,
            serviceIds: [SEED.service.signatureCut.id],
        });

        const booking = await createGuestShopBooking(request, {
            barberId: SEED.barber.nikos.id,
            shopId: SEED.shop.downtown.id,
            shopMemberId: SEED.shopMember.gb1,
            serviceIds: [SEED.service.signatureCut.id],
            finalPrice: quote.final_price ?? quote.sum_price ?? 35,
            durationMinutes: 30,
            timeText: '4:15 PM',
            guestName: 'E2E Guest',
            guestPhone: '+33698765432',
        });

        expect(booking.id).toMatch(/^[0-9a-f-]{36}$/i);
        expect(booking.guest_access_token?.length).toBeGreaterThan(20);

        const viewRes = await request.get(
            `/api/bookings/guest/${encodeURIComponent(booking.guest_access_token)}`
        );
        expect(viewRes.ok(), await viewRes.text()).toBeTruthy();
        const viewBody = (await viewRes.json()) as { date_text?: string; client_name?: string };
        expect(viewBody.date_text).toBe(tomorrowBookingDateText());
        expect(viewBody.client_name).toBe('E2E Guest');

        const previewRes = await request.get(
            `/api/bookings/guest/${encodeURIComponent(booking.guest_access_token)}/cancel-preview`
        );
        expect(previewRes.ok(), await previewRes.text()).toBeTruthy();

        const cancelRes = await request.post(
            `/api/bookings/guest/${encodeURIComponent(booking.guest_access_token)}/cancel`
        );
        expect(cancelRes.ok(), await cancelRes.text()).toBeTruthy();
        const cancelBody = (await cancelRes.json()) as { cancelled?: boolean };
        expect(cancelBody.cancelled).toBe(true);

        const afterRes = await request.get(
            `/api/bookings/guest/${encodeURIComponent(booking.guest_access_token)}`
        );
        expect(afterRes.ok()).toBeTruthy();
        const afterBody = (await afterRes.json()) as { status?: string };
        expect(afterBody.status).toBe('cancelled');
    });
});
