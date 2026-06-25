import { defineConfig, devices } from '@playwright/test';

/**
 * **API project** — `request` + backend `baseURL` (port 3001 by default).
 * **clerk-browser** — real Chromium + frontend `baseURL` (port 3000 by default).
 *
 * See AGENTS.md for env vars. Never commit secrets.
 */
export default defineConfig({
    testDir: 'e2e',
    forbidOnly: !!process.env.CI,
    fullyParallel: true,
    retries: 0,
    timeout: 45_000,
    projects: [
        {
            name: 'api',
            testMatch: ['**/health-public.spec.ts', '**/clerk-bearer-api.spec.ts'],
            use: {
                baseURL: process.env.E2E_API_BASE_URL || 'http://127.0.0.1:3001',
            },
        },
        {
            name: 'clerk-browser',
            testMatch: ['**/clerk-browser-signin.spec.ts'],
            use: {
                ...devices['Desktop Chrome'],
                baseURL: process.env.E2E_FRONTEND_URL || 'http://127.0.0.1:3000',
            },
        },
    ],
});
