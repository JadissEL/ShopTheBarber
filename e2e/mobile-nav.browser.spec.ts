import { test, expect, devices } from '@playwright/test';
import { hasClerkBrowserE2e } from './fixtures/env';
import { signInClient } from './fixtures/auth';
import { SEED } from './fixtures/seed-data';
import { bookingFlowUrl } from './fixtures/booking-helpers';

/**
 * Mobile client navigation — bottom tab bar, More menu, focus-flow hiding.
 * Requires Clerk browser E2E env (see AGENTS.md).
 */
test.use({ ...devices['iPhone 13'] });

test.describe('Mobile client navigation (authenticated)', () => {
    test.beforeEach(async ({ page }) => {
        test.skip(
            !hasClerkBrowserE2e(),
            'Set CLERK_SECRET_KEY, E2E_CLERK_USER_EMAIL, E2E_FRONTEND_URL (see AGENTS.md)',
        );
        await signInClient(page);
    });

    test('bottom tab bar visible on dashboard', async ({ page }) => {
        await page.goto('/Dashboard');
        const nav = page.getByRole('navigation', { name: 'Main navigation' });
        await expect(nav).toBeVisible({ timeout: 30_000 });
        await expect(nav.getByRole('link', { name: /Home/i })).toBeVisible();
        await expect(nav.getByRole('link', { name: /Bookings/i })).toBeVisible();
        await expect(nav.getByRole('link', { name: /Bag/i })).toBeVisible();
    });

    test('bottom tab bar hidden during booking flow', async ({ page }) => {
        await page.goto(bookingFlowUrl(SEED.barber.nikos.id, SEED.shop.downtown.id));
        await expect(page.getByRole('heading', { name: 'Book Appointment' })).toBeVisible({
            timeout: 30_000,
        });
        await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);
    });

    test('More menu exposes secondary destinations', async ({ page }) => {
        await page.goto('/Dashboard');
        await page.getByRole('button', { name: 'More options' }).click();
        await expect(page.getByRole('heading', { name: 'Menu' })).toBeVisible({ timeout: 10_000 });
        await expect(page.getByRole('link', { name: /Messages/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Profile/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /Find a Barber/i })).toBeVisible();
    });

    test('Book FAB navigates to booking flow', async ({ page }) => {
        await page.goto('/Dashboard');
        await page.getByRole('link', { name: 'Book appointment' }).click();
        await expect(page).toHaveURL(/BookingFlow/i, { timeout: 30_000 });
        await expect(page.getByRole('heading', { name: 'Book Appointment' })).toBeVisible();
    });
});
