import { test, expect } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';

/**
 * Setup guide smoke test — requires Clerk test user + running frontend.
 *
 * Env:
 * - CLERK_SECRET_KEY
 * - E2E_CLERK_USER_EMAIL
 * - E2E_FRONTEND_URL (defaults to http://localhost:3000 when E2E_START_SERVERS=1)
 */

function hasClerkBrowserE2e(): boolean {
  const base = process.env.E2E_FRONTEND_URL || 'http://localhost:3000';
  return !!(process.env.CLERK_SECRET_KEY && process.env.E2E_CLERK_USER_EMAIL && base);
}

function frontendBase(): string {
  return process.env.E2E_FRONTEND_URL || 'http://localhost:3000';
}

test.describe('Setup guide (@clerk/testing)', () => {
  test('authenticated user sees getting started wizard', async ({ page }) => {
    test.skip(
      !hasClerkBrowserE2e(),
      'Set CLERK_SECRET_KEY, E2E_CLERK_USER_EMAIL, and E2E_FRONTEND_URL (see AGENTS.md)',
    );

    await page.goto(frontendBase());
    await clerk.signIn({
      page,
      emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
    });

    await page.goto(`${frontendBase()}/SetupGuide`);
    await expect(page).toHaveURL(/SetupGuide/i, { timeout: 45_000 });
    await expect(page.getByRole('heading', { name: 'Getting started' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/Step 1 of/i)).toBeVisible({ timeout: 15_000 });
  });

  test('sign-in redirect param lands on setup guide', async ({ page }) => {
    test.skip(
      !hasClerkBrowserE2e(),
      'Set CLERK_SECRET_KEY, E2E_CLERK_USER_EMAIL, and E2E_FRONTEND_URL (see AGENTS.md)',
    );

    await page.goto(`${frontendBase()}/SignIn?redirect=${encodeURIComponent('/SetupGuide')}`);
    await clerk.signIn({
      page,
      emailAddress: process.env.E2E_CLERK_USER_EMAIL!,
    });

    await expect(page).toHaveURL(/SetupGuide/i, { timeout: 60_000 });
  });
});
