import { test, expect } from '../fixtures/test-with-auth';
import { authStoragePath, PERSONA_IDS } from '../fixtures/personas';
import { hasClerkShopOwnerBrowser, skipAuthenticatedJourneys } from '../fixtures/env';
import { JOURNEY_PERSONAS } from '../fixtures/journey-matrix';
import { flushJourneyReport } from '../fixtures/journey-report';
import { assertHealthyPage, assertNotSignInRedirect, journeyStep } from '../fixtures/journey-helpers';

const PERSONA = JOURNEY_PERSONAS.shopOwner;

test.use({ storageState: authStoragePath(PERSONA_IDS.shopOwner) });

test.describe('Shop owner user journey', () => {
  test.beforeAll(() => {
    test.skip(
      skipAuthenticatedJourneys(),
      'Authenticated journeys require local dev servers (QA Clerk users are not on production)',
    );
    test.skip(
      !hasClerkShopOwnerBrowser(),
      'Set CLERK_SECRET_KEY, E2E_FRONTEND_URL (qa-o1 profile)',
    );
  });

  test.afterAll(() => {
    flushJourneyReport();
  });

  test('Provider dashboard (shop)', async ({ page }) => {
    await journeyStep(PERSONA, 'Provider dashboard (shop)', page, async () => {
      await page.goto('/ProviderDashboard');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await assertHealthyPage(page);
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/dashboard|booking|revenue|provider|welcome/i);
    });
  });

  test('Staff schedule', async ({ page }) => {
    await journeyStep(PERSONA, 'Staff schedule', page, async () => {
      await page.goto('/StaffSchedule');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/schedule|staff|shift|hour|availability/i);
    });
  });

  test('Staff roster', async ({ page }) => {
    await journeyStep(PERSONA, 'Staff roster', page, async () => {
      await page.goto('/StaffRoster');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/staff|team|roster|barber/i);
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

  test('Forbidden seller dashboard redirect', async ({ page }) => {
    await journeyStep(PERSONA, 'Forbidden seller dashboard redirect', page, async () => {
      await page.goto('/SellerDashboard');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await expect(page).toHaveURL(/ProviderDashboard/i, { timeout: 30_000 });
    });
  });
});
