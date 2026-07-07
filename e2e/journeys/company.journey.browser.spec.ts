import { test, expect } from '@playwright/test';
import { hasClerkCompanyBrowser, skipAuthenticatedJourneys } from '../fixtures/env';
import { signInCompany } from '../fixtures/auth';
import { JOURNEY_PERSONAS } from '../fixtures/journey-matrix';
import { flushJourneyReport } from '../fixtures/journey-report';
import { assertHealthyPage, assertNotSignInRedirect, journeyStep } from '../fixtures/journey-helpers';

const PERSONA = JOURNEY_PERSONAS.company;

test.describe.serial('Company user journey', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      skipAuthenticatedJourneys(),
      'Authenticated journeys require local dev servers (QA Clerk users are not on production)',
    );
    test.skip(
      !hasClerkCompanyBrowser(),
      'Set CLERK_SECRET_KEY, E2E_CLERK_COMPANY_EMAIL, E2E_FRONTEND_URL',
    );
    await signInCompany(page);
  });

  test.afterAll(() => {
    flushJourneyReport();
  });

  test('Company hub dashboard', async ({ page }) => {
    await journeyStep(PERSONA, 'Company hub dashboard', page, async () => {
      await page.goto('/CompanyDashboard');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await assertHealthyPage(page);
      await expect(page.getByRole('heading', { name: 'Company hub' })).toBeVisible({ timeout: 30_000 });
    });
  });

  test('Company jobs', async ({ page }) => {
    await journeyStep(PERSONA, 'Company jobs', page, async () => {
      await page.goto('/MyJobs');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/job|role|posting|recruit/i);
    });
  });

  test('Company applicants', async ({ page }) => {
    await journeyStep(PERSONA, 'Company applicants', page, async () => {
      await page.goto('/ApplicantReview');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/applicant|candidate|review|pipeline/i);
    });
  });
});
