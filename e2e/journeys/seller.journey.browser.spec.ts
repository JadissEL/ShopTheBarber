import { test, expect } from '../fixtures/test-with-auth';
import { authStoragePath, PERSONA_IDS, protectedLandingPath } from '../fixtures/personas';
import { hasClerkSellerBrowser, skipAuthenticatedJourneys } from '../fixtures/env';
import { JOURNEY_PERSONAS } from '../fixtures/journey-matrix';
import { flushJourneyReport } from '../fixtures/journey-report';
import {
  assertHealthyPage,
  assertNotSignInRedirect,
  expectRbacRedirect,
  gotoAuthenticated,
  journeyStep,
} from '../fixtures/journey-helpers';

const PERSONA = JOURNEY_PERSONAS.seller;

test.use({ storageState: authStoragePath(PERSONA_IDS.seller) });

test.describe('Seller user journey', () => {
  test.beforeAll(() => {
    test.skip(
      skipAuthenticatedJourneys(),
      'Authenticated journeys require local dev servers (QA Clerk users are not on production)',
    );
    test.skip(!hasClerkSellerBrowser(), 'Set CLERK_SECRET_KEY, E2E_FRONTEND_URL (qa-seller profile)');
  });

  test.afterAll(() => {
    flushJourneyReport();
  });

  test('Seller dashboard', async ({ page }) => {
    await journeyStep(PERSONA, 'Seller dashboard', page, async () => {
      await gotoAuthenticated(page, '/SellerDashboard');
      await assertHealthyPage(page);
      await expect(page.getByRole('heading', { name: 'Sales overview' })).toBeVisible({ timeout: 30_000 });
    });
  });

  test('Seller products', async ({ page }) => {
    await journeyStep(PERSONA, 'Seller products', page, async () => {
      await gotoAuthenticated(page, '/ProviderMarketplaceProducts');
      await assertHealthyPage(page);
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/product|marketplace|inventory|listing/i);
    });
  });

  test('Seller orders', async ({ page }) => {
    await journeyStep(PERSONA, 'Seller orders', page, async () => {
      await gotoAuthenticated(page, '/SellerOrders');
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/order|fulfillment|shipment|seller/i);
    });
  });

  test('Seller settings', async ({ page }) => {
    await journeyStep(PERSONA, 'Seller settings', page, async () => {
      await gotoAuthenticated(page, '/SellerSettings');
      await assertHealthyPage(page);
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 30_000 });
    });
  });

  test('Forbidden provider settings redirect', async ({ page }) => {
    await journeyStep(PERSONA, 'Forbidden provider settings redirect', page, async () => {
      await expectRbacRedirect(
        page,
        protectedLandingPath(PERSONA_IDS.seller),
        '/ProviderSettings?tab=services',
        /SellerDashboard/i,
      );
    });
  });
});
