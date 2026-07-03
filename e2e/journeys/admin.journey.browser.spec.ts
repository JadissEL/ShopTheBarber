import { test, expect } from '@playwright/test';
import { hasClerkAdminBrowser, skipAuthenticatedJourneys } from '../fixtures/env';
import { signInAdmin } from '../fixtures/auth';
import { JOURNEY_PERSONAS } from '../fixtures/journey-matrix';
import { flushJourneyReport } from '../fixtures/journey-report';
import { assertHealthyPage, assertNotSignInRedirect, journeyStep } from '../fixtures/journey-helpers';

const PERSONA = JOURNEY_PERSONAS.admin;

test.describe.serial('Admin user journey', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      skipAuthenticatedJourneys(),
      'Authenticated journeys require local dev servers (QA Clerk users are not on production)',
    );
    test.skip(
      !hasClerkAdminBrowser(),
      'Set CLERK_SECRET_KEY, E2E_CLERK_ADMIN_EMAIL, E2E_FRONTEND_URL',
    );
    await signInAdmin(page);
  });

  test.afterAll(() => {
    flushJourneyReport();
  });

  test('Global financials', async ({ page }) => {
    await journeyStep(PERSONA, 'Global financials', page, async () => {
      await page.goto('/GlobalFinancials');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await assertHealthyPage(page);
      const text = await page.locator('body').innerText();
      expect(text).not.toMatch(/Access denied|not authorized/i);
      expect(text).toMatch(/financial|revenue|promo|platform|admin/i);
    });
  });

  test('Dispute resolution', async ({ page }) => {
    await journeyStep(PERSONA, 'Dispute resolution', page, async () => {
      await page.goto('/AdminDisputes');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await expect(page.getByRole('heading', { name: /Dispute resolution/i })).toBeVisible({
        timeout: 30_000,
      });
    });
  });

  test('User moderation', async ({ page }) => {
    await journeyStep(PERSONA, 'User moderation', page, async () => {
      await page.goto('/AdminUserModeration');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await assertHealthyPage(page);
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/user|moderat|admin|role/i);
    });
  });
});
