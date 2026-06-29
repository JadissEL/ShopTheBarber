import { test, expect } from '@playwright/test';
import { hasApiBaseUrl } from './fixtures/env';
import { SEED } from './fixtures/seed-data';
import {
    bookingFlowUrl,
    completeGuestBookingToConfirmation,
    fillGuestContactAndConfirm,
} from './fixtures/booking-helpers';

/**
 * Cutly-style guest journey — no Clerk sign-in required.
 * Requires seeded DB with pay-at-shop enabled for Downtown Cuts / Nikos (see seed.ts).
 */
test.describe('Guest booking (browser user journey)', () => {
    test.beforeEach(async ({ request }) => {
        test.skip(!hasApiBaseUrl(), 'Set E2E_API_BASE_URL for cash-availability check');

        const cashRes = await request.get(
            `/api/provider-wallet/cash-availability?barber_id=${SEED.barber.nikos.id}&shop_id=${SEED.shop.downtown.id}`
        );
        expect(cashRes.ok()).toBeTruthy();
        const cash = (await cashRes.json()) as { accepts_cash?: boolean };
        test.skip(!cash.accepts_cash, 'Re-run seed: Downtown Cuts must accept pay-at-shop for guest E2E');
    });

    test('BookingFlow loads without redirecting to Sign In', async ({ page }) => {
        await page.goto(bookingFlowUrl(SEED.barber.nikos.id, SEED.shop.downtown.id));
        await expect(page).not.toHaveURL(/SignIn/i, { timeout: 15_000 });
        await expect(page.getByRole('heading', { name: /Book Appointment/i })).toBeVisible({
            timeout: 30_000,
        });
    });

    test('guest completes 3-tap book with pay-at-shop', async ({ page }) => {
        await page.goto(bookingFlowUrl(SEED.barber.nikos.id, SEED.shop.downtown.id));

        await completeGuestBookingToConfirmation(page);
        await fillGuestContactAndConfirm(page, {
            name: 'Playwright Guest',
            phone: '+33687654321',
        });

        await expect(page.getByRole('link', { name: /View your booking/i })).toBeVisible({
            timeout: 15_000,
        });
    });
});
