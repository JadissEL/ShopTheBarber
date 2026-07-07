import { test, expect } from '@playwright/test';
import { hasClerkBloggerBrowser, skipAuthenticatedJourneys } from '../fixtures/env';
import { signInBlogger } from '../fixtures/auth';
import { JOURNEY_PERSONAS } from '../fixtures/journey-matrix';
import { flushJourneyReport } from '../fixtures/journey-report';
import { assertHealthyPage, assertNotSignInRedirect, journeyStep } from '../fixtures/journey-helpers';

const PERSONA = JOURNEY_PERSONAS.blogger;

test.describe.serial('Blogger user journey', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      skipAuthenticatedJourneys(),
      'Authenticated journeys require local dev servers (QA Clerk users are not on production)',
    );
    test.skip(
      !hasClerkBloggerBrowser(),
      'Set CLERK_SECRET_KEY, E2E_CLERK_BLOGGER_EMAIL, E2E_FRONTEND_URL',
    );
    await signInBlogger(page);
  });

  test.afterAll(() => {
    flushJourneyReport();
  });

  test('Blogger dashboard', async ({ page }) => {
    await journeyStep(PERSONA, 'Blogger dashboard', page, async () => {
      await page.goto('/BloggerDashboard');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await assertHealthyPage(page);
      await expect(page.getByRole('heading', { name: 'Creator studio' })).toBeVisible({ timeout: 30_000 });
    });
  });

  test('Blogger articles', async ({ page }) => {
    await journeyStep(PERSONA, 'Blogger articles', page, async () => {
      await page.goto('/ProviderBlogArticles');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/article|draft|publish|story/i);
    });
  });

  test('Blogger marketplace products', async ({ page }) => {
    await journeyStep(PERSONA, 'Blogger marketplace products', page, async () => {
      await page.goto('/ProviderMarketplaceProducts');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await assertHealthyPage(page);
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/product|marketplace|listing/i);
    });
  });
});
