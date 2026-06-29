import { defineConfig, devices } from '@playwright/test';

/**
 * **api** — HTTP `request` against backend (port 3001 by default).
 * **clerk-browser** — Chromium + frontend (port 3000) with `@clerk/testing`.
 *
 * See AGENTS.md for env vars. Never commit secrets.
 */
export default defineConfig({
    testDir: 'e2e',
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
                      reuseExistingServer: !process.env.CI,
                      timeout: 120_000,
                  },
                  {
                      command: 'npm run dev:server',
                      url: `${process.env.E2E_API_BASE_URL || 'http://127.0.0.1:3001'}/api/health/live`,
                      reuseExistingServer: !process.env.CI,
                      timeout: 120_000,
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
            ],
            use: {
                ...devices['Desktop Chrome'],
                baseURL: process.env.E2E_FRONTEND_URL || 'http://127.0.0.1:3000',
            },
            timeout: 90_000,
        },
    ],
});
