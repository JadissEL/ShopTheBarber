import { test, expect } from '../fixtures/test-with-auth';
import { authStoragePath, PERSONA_IDS, protectedLandingPath } from '../fixtures/personas';
import { hasClerkCompanyBrowser, skipAuthenticatedJourneys } from '../fixtures/env';
import { JOURNEY_PERSONAS } from '../fixtures/journey-matrix';
import { flushJourneyReport } from '../fixtures/journey-report';
import {
  assertHealthyPage,
  expectRbacRedirect,
  gotoAuthenticated,
  journeyStep,
} from '../fixtures/journey-helpers';

const PERSONA = JOURNEY_PERSONAS.company;

test.use({ storageState: authStoragePath(PERSONA_IDS.company) });

test.describe('Company user journey', () => {
  test.beforeAll(() => {
    test.skip(
      skipAuthenticatedJourneys(),
      'Authenticated journeys require local dev servers (QA Clerk users are not on production)',
    );
    test.skip(!hasClerkCompanyBrowser(), 'Set CLERK_SECRET_KEY, E2E_FRONTEND_URL (qa-company profile)');
  });

  test.afterAll(() => {
    flushJourneyReport();
  });

  test('Company hub dashboard', async ({ page }) => {
    await journeyStep(PERSONA, 'Company hub dashboard', page, async () => {
      await gotoAuthenticated(page, '/CompanyDashboard');
      await assertHealthyPage(page);
      await expect(page.getByRole('heading', { name: 'Company hub' })).toBeVisible({ timeout: 30_000 });
    });
  });

  test('Company jobs', async ({ page }) => {
    await journeyStep(PERSONA, 'Company jobs', page, async () => {
      await gotoAuthenticated(page, '/MyJobs');
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/job|role|posting|recruit/i);
    });
  });

  test('Company applicants', async ({ page }) => {
    await journeyStep(PERSONA, 'Company applicants', page, async () => {
      await gotoAuthenticated(page, '/ApplicantReview');
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/applicant|candidate|review|pipeline/i);
    });
  });

  test('Forbidden provider dashboard redirect', async ({ page }) => {
    await journeyStep(PERSONA, 'Forbidden provider dashboard redirect', page, async () => {
      await expectRbacRedirect(
        page,
        protectedLandingPath(PERSONA_IDS.company),
        '/ProviderDashboard',
        /CompanyDashboard/i,
      );
    });
  });
});
