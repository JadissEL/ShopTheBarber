import { test, expect } from '@playwright/test';
import {
  hasClerkBloggerBrowser,
  hasClerkCompanyBrowser,
  hasClerkSellerBrowser,
  skipAuthenticatedJourneys,
} from '../fixtures/env';
import { signInBlogger, signInCompany, signInSeller } from '../fixtures/auth';
import { JOURNEY_PERSONAS } from '../fixtures/journey-matrix';
import { flushJourneyReport } from '../fixtures/journey-report';
import { assertNotSignInRedirect, journeyStep } from '../fixtures/journey-helpers';

const PERSONA = JOURNEY_PERSONAS.roleRbac;

test.describe.serial('V2 role RBAC redirects', () => {
  test.beforeAll(() => {
    test.skip(
      skipAuthenticatedJourneys(),
      'Authenticated journeys require local dev servers (QA Clerk users are not on production)',
    );
  });

  test.afterAll(() => {
    flushJourneyReport();
  });

  test('Seller blocked from provider settings', async ({ page }) => {
    test.skip(!hasClerkSellerBrowser(), 'Set CLERK_SECRET_KEY, E2E_CLERK_SELLER_EMAIL, E2E_FRONTEND_URL');
    await signInSeller(page);
    await journeyStep(PERSONA, 'Seller blocked from provider settings', page, async () => {
      await page.goto('/ProviderSettings?tab=services');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await expect(page).toHaveURL(/SellerDashboard/i, { timeout: 30_000 });
    });
  });

  test('Company blocked from provider dashboard', async ({ page }) => {
    test.skip(!hasClerkCompanyBrowser(), 'Set CLERK_SECRET_KEY, E2E_CLERK_COMPANY_EMAIL, E2E_FRONTEND_URL');
    await signInCompany(page);
    await journeyStep(PERSONA, 'Company blocked from provider dashboard', page, async () => {
      await page.goto('/ProviderDashboard');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await expect(page).toHaveURL(/CompanyDashboard/i, { timeout: 30_000 });
    });
  });

  test('Blogger blocked from provider settings', async ({ page }) => {
    test.skip(!hasClerkBloggerBrowser(), 'Set CLERK_SECRET_KEY, E2E_CLERK_BLOGGER_EMAIL, E2E_FRONTEND_URL');
    await signInBlogger(page);
    await journeyStep(PERSONA, 'Blogger blocked from provider settings', page, async () => {
      await page.goto('/ProviderSettings?tab=services');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await expect(page).toHaveURL(/BloggerDashboard/i, { timeout: 30_000 });
    });
  });
});
