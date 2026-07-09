import { test, expect, devices } from '../fixtures/test-with-auth';
import { authStoragePath, PERSONA_IDS } from '../fixtures/personas';
import { hasClerkBrowserE2e, skipAuthenticatedJourneys } from '../fixtures/env';
import { JOURNEY_PERSONAS } from '../fixtures/journey-matrix';
import { flushJourneyReport } from '../fixtures/journey-report';
import { assertHealthyPage, assertNotSignInRedirect, journeyStep } from '../fixtures/journey-helpers';

const PERSONA = JOURNEY_PERSONAS.mobileClient;

test.use({ ...devices['iPhone 13'] });

test.describe('Mobile client user journey', () => {
  test.beforeAll(() => {
    test.skip(
      skipAuthenticatedJourneys(),
      'Authenticated journeys require local dev servers (QA Clerk users are not on production)',
    );
    test.skip(!hasClerkBrowserE2e(), 'Set CLERK_SECRET_KEY, E2E_FRONTEND_URL');
  });

  test.afterAll(() => {
    flushJourneyReport();
  });

  test.describe('Authenticated', () => {
    test.use({ storageState: authStoragePath(PERSONA_IDS.client) });

    test('Mobile dashboard', async ({ page }) => {
      await journeyStep(PERSONA, 'Mobile dashboard', page, async () => {
        await page.goto('/Dashboard');
        await page.waitForLoadState('networkidle').catch(() => {});
        await assertNotSignInRedirect(page);
        await assertHealthyPage(page);
        await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 30_000 });
      });
    });

    test('Mobile wallet', async ({ page }) => {
      await journeyStep(PERSONA, 'Mobile wallet', page, async () => {
        await page.goto('/ClientWallet');
        await page.waitForLoadState('networkidle').catch(() => {});
        await assertNotSignInRedirect(page);
        await expect(page.getByRole('heading', { name: 'Wallet' })).toBeVisible({ timeout: 30_000 });
      });
    });

    test('Mobile marketplace', async ({ page }) => {
      await journeyStep(PERSONA, 'Mobile marketplace', page, async () => {
        await page.goto('/Marketplace');
        await page.waitForLoadState('networkidle').catch(() => {});
        await assertHealthyPage(page);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
      });
    });
  });

  test.describe('Guest shell', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('Guest shell on Explore (no client bottom nav when signed out)', async ({ page }) => {
      await journeyStep(PERSONA, 'No client bottom nav on Explore (guest shell)', page, async () => {
        await page.goto('/Explore');
        await page.waitForLoadState('networkidle').catch(() => {});
        await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);
        await expect(page.getByPlaceholder(/search barbers/i)).toBeVisible({ timeout: 30_000 });
      });
    });
  });
});
