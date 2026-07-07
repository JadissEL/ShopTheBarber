import { test, expect } from '@playwright/test';
import { hasClerkSellerBrowser, skipAuthenticatedJourneys } from '../fixtures/env';
import { signInSeller } from '../fixtures/auth';
import { JOURNEY_PERSONAS } from '../fixtures/journey-matrix';
import { flushJourneyReport } from '../fixtures/journey-report';
import { assertHealthyPage, assertNotSignInRedirect, journeyStep } from '../fixtures/journey-helpers';

const PERSONA = JOURNEY_PERSONAS.seller;

test.describe.serial('Seller user journey', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      skipAuthenticatedJourneys(),
      'Authenticated journeys require local dev servers (QA Clerk users are not on production)',
    );
    test.skip(
      !hasClerkSellerBrowser(),
      'Set CLERK_SECRET_KEY, E2E_CLERK_SELLER_EMAIL, E2E_FRONTEND_URL',
    );
    await signInSeller(page);
  });

  test.afterAll(() => {
    flushJourneyReport();
  });

  test('Seller dashboard', async ({ page }) => {
    await journeyStep(PERSONA, 'Seller dashboard', page, async () => {
      await page.goto('/SellerDashboard');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await assertHealthyPage(page);
      await expect(page.getByRole('heading', { name: 'Sales overview' })).toBeVisible({ timeout: 30_000 });
    });
  });

  test('Seller products', async ({ page }) => {
    await journeyStep(PERSONA, 'Seller products', page, async () => {
      await page.goto('/ProviderMarketplaceProducts');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await assertHealthyPage(page);
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/product|marketplace|inventory|listing/i);
    });
  });

  test('Seller orders', async ({ page }) => {
    await journeyStep(PERSONA, 'Seller orders', page, async () => {
      await page.goto('/SellerOrders');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/order|fulfillment|shipment|seller/i);
    });
  });

  test('Seller settings', async ({ page }) => {
    await journeyStep(PERSONA, 'Seller settings', page, async () => {
      await page.goto('/SellerSettings');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await assertHealthyPage(page);
      await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible({ timeout: 30_000 });
    });
  });
});
