import { test, expect } from '../fixtures/test-with-auth';
import { authStoragePath, PERSONA_IDS, protectedLandingPath } from '../fixtures/personas';
import { hasClerkBloggerBrowser, skipAuthenticatedJourneys } from '../fixtures/env';
import { JOURNEY_PERSONAS } from '../fixtures/journey-matrix';
import { flushJourneyReport } from '../fixtures/journey-report';
import {
  assertHealthyPage,
  expectRbacRedirect,
  gotoAuthenticated,
  journeyStep,
} from '../fixtures/journey-helpers';

const PERSONA = JOURNEY_PERSONAS.blogger;

test.use({ storageState: authStoragePath(PERSONA_IDS.blogger) });

test.describe('Blogger user journey', () => {
  test.beforeAll(() => {
    test.skip(
      skipAuthenticatedJourneys(),
      'Authenticated journeys require local dev servers (QA Clerk users are not on production)',
    );
    test.skip(!hasClerkBloggerBrowser(), 'Set CLERK_SECRET_KEY, E2E_FRONTEND_URL (qa-blogger profile)');
  });

  test.afterAll(() => {
    flushJourneyReport();
  });

  test('Blogger dashboard', async ({ page }) => {
    await journeyStep(PERSONA, 'Blogger dashboard', page, async () => {
      await gotoAuthenticated(page, '/BloggerDashboard');
      await assertHealthyPage(page);
      await expect(page.getByRole('heading', { name: 'Creator studio' })).toBeVisible({ timeout: 30_000 });
    });
  });

  test('Blogger articles', async ({ page }) => {
    await journeyStep(PERSONA, 'Blogger articles', page, async () => {
      await gotoAuthenticated(page, '/ProviderBlogArticles');
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/article|draft|publish|story/i);
    });
  });

  test('Blogger marketplace products', async ({ page }) => {
    await journeyStep(PERSONA, 'Blogger marketplace products', page, async () => {
      await gotoAuthenticated(page, '/ProviderMarketplaceProducts');
      await assertHealthyPage(page);
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/product|marketplace|listing/i);
    });
  });

  test('Forbidden provider settings redirect', async ({ page }) => {
    await journeyStep(PERSONA, 'Forbidden provider settings redirect', page, async () => {
      await expectRbacRedirect(
        page,
        protectedLandingPath(PERSONA_IDS.blogger),
        '/ProviderSettings?tab=services',
        /BloggerDashboard/i,
      );
    });
  });
});
