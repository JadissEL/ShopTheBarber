import { test, expect } from '../fixtures/test-with-auth';
import { authStoragePath, PERSONA_IDS } from '../fixtures/personas';
import { hasClerkProviderBrowser, skipAuthenticatedJourneys } from '../fixtures/env';
import { JOURNEY_PERSONAS } from '../fixtures/journey-matrix';
import { flushJourneyReport } from '../fixtures/journey-report';
import { assertHealthyPage, assertNotSignInRedirect, gotoAuthenticated, journeyStep } from '../fixtures/journey-helpers';

const PERSONA = JOURNEY_PERSONAS.provider;

test.use({ storageState: authStoragePath(PERSONA_IDS.soloBarber) });

test.describe('Provider user journey', () => {
  test.beforeAll(() => {
    test.skip(
      skipAuthenticatedJourneys(),
      'Authenticated journeys require local dev servers (QA Clerk users are not on production)',
    );
    test.skip(!hasClerkProviderBrowser(), 'Set CLERK_SECRET_KEY, E2E_FRONTEND_URL (qa-b1 profile)');
  });

  test.afterAll(() => {
    flushJourneyReport();
  });

  test('Provider dashboard', async ({ page }) => {
    await journeyStep(PERSONA, 'Provider dashboard', page, async () => {
      await page.goto('/ProviderDashboard');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await assertHealthyPage(page);
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/dashboard|booking|revenue|provider|welcome/i);
    });
  });

  test('Provider bookings', async ({ page }) => {
    await journeyStep(PERSONA, 'Provider bookings', page, async () => {
      await page.goto('/ProviderBookings');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/booking|upcoming|appointment/i);
    });
  });

  test('Provider settings', async ({ page }) => {
    await journeyStep(PERSONA, 'Provider settings', page, async () => {
      await page.goto('/ProviderSettings?tab=services');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await assertHealthyPage(page);
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/service|settings|price|duration/i);
    });
  });

  test('Provider payouts', async ({ page }) => {
    await journeyStep(PERSONA, 'Provider payouts', page, async () => {
      await gotoAuthenticated(page, '/ProviderPayouts');
      await expect(page.getByRole('heading', { name: /Payouts & earnings/i })).toBeVisible({ timeout: 30_000 });
    });
  });
});
