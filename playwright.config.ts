import { defineConfig, devices } from '@playwright/test';
import { hydrateE2eEnv } from './scripts/qa-e2e-env.mjs';

if (process.env.E2E_START_SERVERS === '1') {
    hydrateE2eEnv();
}

const localApi = process.env.E2E_API_BASE_URL || 'http://127.0.0.1:3001';
const localWebEnv = {
    VITE_API_URL: process.env.VITE_API_URL || localApi,
    VITE_CLERK_PUBLISHABLE_KEY:
        process.env.VITE_CLERK_PUBLISHABLE_KEY || process.env.CLERK_PUBLISHABLE_KEY || '',
};
const localServerEnv = {
    DATABASE_URL: process.env.DATABASE_URL || process.env.TEST_DATABASE_URL || '',
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
};

/**
 * **api** — HTTP `request` against backend (port 3001 by default).
 * **clerk-browser** — Chromium + frontend (port 3000) with `@clerk/testing`.
 *
 * See AGENTS.md for env vars. Never commit secrets.
 */
export default defineConfig({
    testDir: 'e2e',
    globalSetup: './e2e/global-setup.ts',
    forbidOnly: !!process.env.CI,
    fullyParallel: true,
    retries: process.env.CI ? 1 : 0,
    timeout: 60_000,
    ...(process.env.E2E_START_SERVERS === '1'
        ? {
              webServer: [
                  {
                      command: 'npm run dev',
                      url: process.env.E2E_FRONTEND_URL || 'http://127.0.0.1:3000',
                      reuseExistingServer: process.env.E2E_REUSE_SERVERS === '1',
                      timeout: 120_000,
                      env: { ...process.env, ...localWebEnv },
                  },
                  {
                      command: 'npm run dev:server',
                      url: `${localApi}/api/health/live`,
                      reuseExistingServer: process.env.E2E_REUSE_SERVERS === '1',
                      timeout: 120_000,
                      env: { ...process.env, ...localServerEnv },
                  },
              ],
          }
        : {}),
    projects: [
        {
            name: 'api',
            testMatch: [
                '**/health-public.spec.ts',
                '**/clerk-bearer-api.spec.ts',
                '**/booking-checkout-api.spec.ts',
                '**/promotions-api.spec.ts',
            ],
            use: {
                baseURL: process.env.E2E_API_BASE_URL || 'http://127.0.0.1:3001',
            },
        },
        {
            name: 'clerk-browser',
            testMatch: [
                '**/clerk-browser-signin.spec.ts',
                '**/*.browser.spec.ts',
                '**/*.journey.browser.spec.ts',
            ],
            use: {
                ...devices['Desktop Chrome'],
                baseURL: process.env.E2E_FRONTEND_URL || 'http://127.0.0.1:3000',
            },
            timeout: 90_000,
        },
    ],
});
