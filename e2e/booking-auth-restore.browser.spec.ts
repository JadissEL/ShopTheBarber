import { test, expect } from '@playwright/test';
import { hasClerkBrowserE2e } from './fixtures/env';
import { signInClerkOnCurrentPage } from './fixtures/auth';
import { emailForProfile } from './fixtures/qa-profiles';
import { SEED } from './fixtures/seed-data';
import {
    bookingFlowUrl,
    completeGuestBookingToConfirmation,
} from './fixtures/booking-helpers';

/**
 * Guest starts booking → signs in mid-flow → returns to confirmation with selections intact.
 */
test.describe('Booking auth restore (browser user journey)', () => {
    test('guest sign-in during booking restores confirmation step and service', async ({ page }) => {
        test.skip(
            !hasClerkBrowserE2e(),
            'Set CLERK_SECRET_KEY, E2E_CLERK_USER_EMAIL, E2E_FRONTEND_URL (see AGENTS.md)',
        );

        const serviceName = SEED.service.signatureCut.name;
        await page.goto(bookingFlowUrl(SEED.barber.nikos.id, SEED.shop.downtown.id));
        await completeGuestBookingToConfirmation(page);

        await expect(page.getByText(serviceName, { exact: true }).first()).toBeVisible({ timeout: 15_000 });

        await page.getByRole('link', { name: /Sign in/i }).first().click();
        await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });
        expect(page.url()).toMatch(/return=/);

        const email = process.env.E2E_CLERK_USER_EMAIL || emailForProfile('qa-c1');
        if (!email) test.skip(true, 'E2E_CLERK_USER_EMAIL required');

        await signInClerkOnCurrentPage(page, email);

        await expect(page).toHaveURL(/BookingFlow/i, { timeout: 45_000 });
        await expect(page.getByRole('heading', { name: /Review & Confirm/i })).toBeVisible({
            timeout: 30_000,
        });
        await expect(page.getByText(serviceName, { exact: true }).first()).toBeVisible({ timeout: 15_000 });
    });
});
