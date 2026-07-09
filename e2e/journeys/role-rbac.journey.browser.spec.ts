import { test, expect } from '../fixtures/test-with-auth';
import { authStoragePath, PERSONA_IDS, protectedLandingPath } from '../fixtures/personas';
import {
  hasClerkBloggerBrowser,
  hasClerkCompanyBrowser,
  hasClerkSellerBrowser,
  skipAuthenticatedJourneys,
} from '../fixtures/env';
import { JOURNEY_PERSONAS } from '../fixtures/journey-matrix';
import { flushJourneyReport } from '../fixtures/journey-report';
import { expectRbacRedirect, journeyStep } from '../fixtures/journey-helpers';

const PERSONA = JOURNEY_PERSONAS.roleRbac;

test.describe('V2 role RBAC redirects', () => {
  test.beforeAll(() => {
    test.skip(
      skipAuthenticatedJourneys(),
      'Authenticated journeys require local dev servers (QA Clerk users are not on production)',
    );
  });

  test.afterAll(() => {
    flushJourneyReport();
  });

  test.describe('Seller persona', () => {
    test.use({ storageState: authStoragePath(PERSONA_IDS.seller) });

    test('Seller blocked from provider settings', async ({ page }) => {
      test.skip(!hasClerkSellerBrowser(), 'Set CLERK_SECRET_KEY, E2E_FRONTEND_URL');
      await journeyStep(PERSONA, 'Seller blocked from provider settings', page, async () => {
        await expectRbacRedirect(
          page,
          protectedLandingPath(PERSONA_IDS.seller),
          '/ProviderSettings?tab=services',
          /SellerDashboard/i,
        );
      });
    });
  });

  test.describe('Company persona', () => {
    test.use({ storageState: authStoragePath(PERSONA_IDS.company) });

    test('Company blocked from provider dashboard', async ({ page }) => {
      test.skip(!hasClerkCompanyBrowser(), 'Set CLERK_SECRET_KEY, E2E_FRONTEND_URL');
      await journeyStep(PERSONA, 'Company blocked from provider dashboard', page, async () => {
        await expectRbacRedirect(
          page,
          protectedLandingPath(PERSONA_IDS.company),
          '/ProviderDashboard',
          /CompanyDashboard/i,
        );
      });
    });
  });

  test.describe('Blogger persona', () => {
    test.use({ storageState: authStoragePath(PERSONA_IDS.blogger) });

    test('Blogger blocked from provider settings', async ({ page }) => {
      test.skip(!hasClerkBloggerBrowser(), 'Set CLERK_SECRET_KEY, E2E_FRONTEND_URL');
      await journeyStep(PERSONA, 'Blogger blocked from provider settings', page, async () => {
        await expectRbacRedirect(
          page,
          protectedLandingPath(PERSONA_IDS.blogger),
          '/ProviderSettings?tab=services',
          /BloggerDashboard/i,
        );
      });
    });
  });
});
