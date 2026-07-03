import { test, expect, devices } from '@playwright/test';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_UX_ROUTES } from './fixtures/ux-routes.js';
import { scanA11y, A11Y_STRICT } from './fixtures/a11y.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportDir = resolve(__dirname, '..', 'qa-reports');
const reportPath = resolve(reportDir, 'ux-audit-mobile-playwright.json');

test.use({ ...devices['iPhone 13'] });

function appendResult(entry) {
  mkdirSync(reportDir, { recursive: true });
  let data = { generatedAt: new Date().toISOString(), results: [] };
  if (existsSync(reportPath)) {
    try {
      data = JSON.parse(readFileSync(reportPath, 'utf8'));
    } catch {
      /* fresh report */
    }
  }
  data.results.push({ ...entry, at: new Date().toISOString() });
  writeFileSync(reportPath, JSON.stringify(data, null, 2));
}

for (const route of PUBLIC_UX_ROUTES.slice(0, 6)) {
  test(`${route.label} mobile smoke + a11y`, async ({ page }) => {
    await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const scan = await scanA11y(page, { label: `${route.label} (mobile)` });
    appendResult({ type: 'a11y', route: route.path, label: route.label, viewport: 'mobile', ...scan });

    if (A11Y_STRICT) expect(scan.violationCount, `${route.label} mobile a11y`).toBe(0);
  });
}

test('guest has no client bottom tab bar on Explore', async ({ page }) => {
  await page.goto('/Explore');
  await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);
  appendResult({ type: 'layout', route: '/Explore', check: 'no-client-bottom-nav', pass: true });
});
