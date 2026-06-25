import { test, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';

/**
 * Real browser flow using Clerk’s testing helpers (`clerk.signIn` with `emailAddress`).
 * Requires the same `CLERK_SECRET_KEY` as your backend (server-side sign-in via Clerk API).
 *
 * Env (all required when not skipping):
 * - `E2E_FRONTEND_URL` — Vite app (e.g. http://localhost:3000 or Vercel preview)
 * - `E2E_CLERK_USER_EMAIL` — existing Clerk user email in **this** Clerk application
 * - `CLERK_SECRET_KEY` — from Clerk Dashboard API keys (do not expose to the frontend)
 */

function hasClerkBrowserE2e(): boolean {
    return !!(process.env.CLERK_SECRET_KEY && process.env.E2E_CLERK_USER_EMAIL && process.env.E2E_FRONTEND_URL);
}

test.describe('Clerk browser sign-in (@clerk/testing)', () => {
    test('session allows client zone / UserBookings', async ({ page }) => {
        test.skip(
            !hasClerkBrowserE2e(),
            'Set CLERK_SECRET_KEY, E2E_CLERK_USER_EMAIL, and E2E_FRONTEND_URL (see AGENTS.md)'
        );

        await page.goto('/');
        await clerk.signIn({
            page,
            emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
        });

        await page.goto('/UserBookings');
        await expect(page).toHaveURL(/UserBookings/i, { timeout: 45_000 });
        await expect(page.getByRole('heading', { level: 1, name: 'My Bookings' })).toBeVisible({
            timeout: 30_000,
        });
    });
});
