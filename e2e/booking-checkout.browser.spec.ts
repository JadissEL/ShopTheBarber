import { test, expect } from '@playwright/test';
import { hasClerkBrowserE2e } from './fixtures/env';
import { signInClient } from './fixtures/auth';
import { SEED } from './fixtures/seed-data';
import {
    bookingFlowUrl,
    completeBookingStepsToConfirmation,
    confirmBookingAndExpectSuccess,
} from './fixtures/booking-helpers';

/**
 * Real browser user journey: browse booking flow → apply promo → confirm appointment.
 * Mirrors a client using BookingFlow (not marketplace /Checkout cart).
 */
test.describe('Booking checkout (browser user journey)', () => {
    test.beforeEach(async ({ page }) => {
        test.skip(
            !hasClerkBrowserE2e(),
            'Set CLERK_SECRET_KEY, E2E_CLERK_USER_EMAIL, E2E_FRONTEND_URL (see AGENTS.md)'
        );
        await signInClient(page);
    });

    test('barber profile shows seeded promotions before booking', async ({ page }) => {
        await page.goto(`/BarberProfile?id=${SEED.barber.nikos.id}`);
        await expect(page.getByText(SEED.barber.nikos.name)).toBeVisible({ timeout: 30_000 });
        await expect(page.getByText(SEED.promo.downtown10)).toBeVisible({ timeout: 20_000 });
    });

    test('client books at Downtown Cuts with DOWNTOWN10 promo applied', async ({ page }) => {
        await page.goto(bookingFlowUrl(SEED.barber.nikos.id, SEED.shop.downtown.id));

        await completeBookingStepsToConfirmation(page, { promoCode: SEED.promo.downtown10 });

        await expect(page.getByText(/Promo \(.*DOWNTOWN10/i)).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/-\$\d+\.\d{2}/)).toBeVisible();

        await confirmBookingAndExpectSuccess(page);
    });

    test('invalid promo shows error on confirmation step', async ({ page }) => {
        await page.goto(bookingFlowUrl(SEED.barber.nikos.id, SEED.shop.downtown.id));
        await completeBookingStepsToConfirmation(page);

        const input = page.getByPlaceholder('Promo Code');
        await input.fill('NOTAVALIDCODE');
        await page.getByRole('button', { name: 'Apply', exact: true }).click();
        await expect(page.getByText(/invalid promo|failed to validate/i)).toBeVisible({ timeout: 20_000 });
    });

    test('confirmed booking appears in My Bookings', async ({ page }) => {
        await page.goto(bookingFlowUrl(SEED.barber.nikos.id, SEED.shop.downtown.id));
        await completeBookingStepsToConfirmation(page, { promoCode: SEED.promo.welcome5 });
        await confirmBookingAndExpectSuccess(page);

        await page.goto('/UserBookings');
        await expect(page.getByRole('heading', { level: 1, name: 'My Bookings' })).toBeVisible({
            timeout: 30_000,
        });
        await expect(page.getByText(SEED.barber.nikos.name).first()).toBeVisible({ timeout: 20_000 });
    });
});
