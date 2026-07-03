import { test, expect, devices } from '@playwright/test';
import { hasClerkBrowserE2e } from '../fixtures/env';
import { signInClient, signInClerkAndSync } from '../fixtures/auth';
import { JOURNEY_PERSONAS } from '../fixtures/journey-matrix';
import { flushJourneyReport } from '../fixtures/journey-report';
import { assertHealthyPage, assertNotSignInRedirect, journeyStep } from '../fixtures/journey-helpers';

const PERSONA = JOURNEY_PERSONAS.mobileClient;

test.use({ ...devices['iPhone 13'] });

test.describe.serial('Mobile client user journey', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasClerkBrowserE2e(), 'Set CLERK_SECRET_KEY, E2E_CLERK_USER_EMAIL, E2E_FRONTEND_URL');
    await signInClient(page);
    await signInClerkAndSync(page, process.env.E2E_CLERK_USER_EMAIL!);
  });

  test.afterAll(() => {
    flushJourneyReport();
  });

  test('Mobile dashboard', async ({ page }) => {
    await journeyStep(PERSONA, 'Mobile dashboard', page, async () => {
      await page.goto('/Dashboard');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await assertHealthyPage(page);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 30_000 });
    });
  });

  test('Guest shell on Explore (no client bottom nav when signed out)', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      const c = (window as unknown as { Clerk?: { signOut: () => Promise<void> } }).Clerk;
      if (c?.signOut) await c.signOut();
    }).catch(() => {});

    await journeyStep(PERSONA, 'No client bottom nav on Explore (guest shell)', page, async () => {
      await page.goto('/Explore');
      await page.waitForLoadState('networkidle').catch(() => {});
      await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);
      await expect(page.getByPlaceholder(/search barbers/i)).toBeVisible({ timeout: 30_000 });
    });
  });

  test('Mobile wallet', async ({ page }) => {
    await signInClient(page);
    await signInClerkAndSync(page, process.env.E2E_CLERK_USER_EMAIL!);

    await journeyStep(PERSONA, 'Mobile wallet', page, async () => {
      await page.goto('/ClientWallet');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await expect(page.getByRole('heading', { name: 'Wallet' })).toBeVisible({ timeout: 30_000 });
    });
  });

  test('Mobile marketplace', async ({ page }) => {
    await signInClient(page);
    await signInClerkAndSync(page, process.env.E2E_CLERK_USER_EMAIL!);

    await journeyStep(PERSONA, 'Mobile marketplace', page, async () => {
      await page.goto('/Marketplace');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertHealthyPage(page);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    });
  });
});
