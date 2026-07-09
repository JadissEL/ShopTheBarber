/**
 * Playwright test extended with Clerk testing token on each page (required with storageState).
 * @see https://clerk.com/docs/guides/development/testing/playwright/test-authenticated-flows
 */
import { test as base, expect, devices } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { loadClerkTestingEnv } from './clerk-env';
import { waitForAuthSync } from './journey-helpers';

export const test = base.extend({
  page: async ({ page }, use) => {
    loadClerkTestingEnv();
    await page.goto('/');
    if (process.env.CLERK_FAPI && process.env.CLERK_TESTING_TOKEN) {
      await setupClerkTestingToken({ page });
    }
    await waitForAuthSync(page);
    await use(page);
  },
});

export { expect, devices };
