import { test, expect } from '@playwright/test';
import { hasApiBaseUrl, hasClerkJwt, clerkAuthHeaders } from './fixtures/env';
import { SEED } from './fixtures/seed-data';
import {
    fetchPriceQuote,
    createShopBooking,
    tomorrowBookingDateText,
} from './fixtures/booking-helpers';

/**
 * Booking + promo checkout via REST (mirrors what the BookingFlow UI calls).
 * Requires seeded DB + E2E_CLERK_JWT for authenticated steps.
 */
test.describe('Booking checkout API (user journey)', () => {
    test('public pricing offers surface seeded shop promos for gb1', async ({ request }) => {
        test.skip(!hasApiBaseUrl(), 'Set E2E_API_BASE_URL');

        const res = await request.get(
            `/api/pricing/offers?shop_id=${SEED.shop.downtown.id}&barber_id=${SEED.barber.nikos.id}`
        );
        expect(res.ok(), await res.text()).toBeTruthy();
        const body = (await res.json()) as { promotions?: Array<{ code?: string }> };
        const codes = (body.promotions ?? []).map((p) => p.code);
        expect(codes).toContain(SEED.promo.downtown10);
    });

    test('client quotes and books with DOWNTOWN10 at Downtown Cuts', async ({ request }) => {
        test.skip(!hasClerkJwt(), 'Set E2E_API_BASE_URL and E2E_CLERK_JWT');

        const headers = clerkAuthHeaders();

        const meRes = await request.get('/api/auth/me', { headers });
        expect(meRes.ok(), await meRes.text()).toBeTruthy();
        const me = (await meRes.json()) as { id: string };

        const quoteWithout = await fetchPriceQuote(request, headers, {
            barberId: SEED.barber.nikos.id,
            shopId: SEED.shop.downtown.id,
            shopMemberId: SEED.shopMember.gb1,
            serviceIds: [SEED.service.signatureCut.id],
        });

        const quoteWith = await fetchPriceQuote(request, headers, {
            barberId: SEED.barber.nikos.id,
            shopId: SEED.shop.downtown.id,
            shopMemberId: SEED.shopMember.gb1,
            serviceIds: [SEED.service.signatureCut.id],
            promoCode: SEED.promo.downtown10,
        });

        expect(quoteWith.promo?.code).toBe(SEED.promo.downtown10);
        expect(quoteWith.promo?.discount_amount ?? 0).toBeGreaterThan(0);
        expect(quoteWith.final_price ?? 0).toBeLessThan(quoteWithout.final_price ?? quoteWithout.sum_price ?? 999);

        const booking = await createShopBooking(request, headers, {
            clientId: me.id,
            barberId: SEED.barber.nikos.id,
            shopId: SEED.shop.downtown.id,
            shopMemberId: SEED.shopMember.gb1,
            serviceIds: [SEED.service.signatureCut.id],
            finalPrice: quoteWith.final_price ?? 31.5,
            durationMinutes: 30,
            promoCode: SEED.promo.downtown10,
            timeText: '2:30 PM',
        });

        expect(booking.id).toMatch(/^[0-9a-f-]{36}$/i);
        expect(booking.discount_code).toBe(SEED.promo.downtown10);

        const detailsRes = await request.get(`/api/bookings/${booking.id}/details`, { headers });
        expect(detailsRes.ok(), await detailsRes.text()).toBeTruthy();
        const details = (await detailsRes.json()) as { date_text?: string; discount_code?: string };
        expect(details.date_text).toBe(tomorrowBookingDateText());
        expect(details.discount_code).toBe(SEED.promo.downtown10);
    });

    test('payment protection preview returns checkout step metadata', async ({ request }) => {
        test.skip(!hasClerkJwt(), 'Set E2E_API_BASE_URL and E2E_CLERK_JWT');

        const headers = clerkAuthHeaders();
        const res = await request.get(
            `/api/payment-protection/preview?barber_id=${SEED.barber.nikos.id}&total_price=35&payment_method=online`,
            { headers }
        );
        expect(res.ok(), await res.text()).toBeTruthy();
        const body = (await res.json()) as { next_step?: string; stripe_configured?: boolean };
        expect(body).toHaveProperty('next_step');
        expect(typeof body.stripe_configured).toBe('boolean');
    });

    test('WELCOME5 platform promo applies on shop booking quote', async ({ request }) => {
        test.skip(!hasClerkJwt(), 'Set E2E_API_BASE_URL and E2E_CLERK_JWT');

        const quote = await fetchPriceQuote(request, clerkAuthHeaders(), {
            barberId: SEED.barber.nikos.id,
            shopId: SEED.shop.downtown.id,
            shopMemberId: SEED.shopMember.gb1,
            serviceIds: [SEED.service.signatureCut.id],
            promoCode: SEED.promo.welcome5,
        });

        expect(quote.promo?.code).toBe(SEED.promo.welcome5);
        expect(quote.promo?.discount_amount).toBe(5);
    });
});
