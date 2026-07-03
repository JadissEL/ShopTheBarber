import { test, expect } from '@playwright/test';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PUBLIC_UX_ROUTES } from './fixtures/ux-routes.js';
import { scanA11y, A11Y_STRICT } from './fixtures/a11y.js';
import { SEED } from './fixtures/seed-data';

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportDir = resolve(__dirname, '..', 'qa-reports');
const auditResults = [];

function record(entry) {
  auditResults.push({ ...entry, at: new Date().toISOString() });
}

test.afterAll(() => {
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(
    resolve(reportDir, 'ux-audit-playwright.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), results: auditResults }, null, 2),
  );
});

/** Desktop Chrome — inherited from clerk-browser project config */

for (const route of PUBLIC_UX_ROUTES) {
  test(`${route.label} loads and passes a11y scan`, async ({ page }) => {
    const res = await page.goto(route.path, { waitUntil: 'domcontentloaded' });
    expect(res?.status(), `${route.path} HTTP status`).toBeLessThan(400);
    await page.waitForLoadState('networkidle').catch(() => {});

    if (route.expectHeading) {
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 30_000 });
    }

    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/Something went wrong|ErrorBoundary/i);

    const scan = await scanA11y(page, { label: route.label });
    record({ type: 'a11y', route: route.path, label: route.label, viewport: 'desktop', ...scan });

    if (A11Y_STRICT && scan.violationCount > 0) {
      throw new Error(
        `${route.label}: ${scan.violationCount} a11y violation(s)\n${JSON.stringify(scan.violations, null, 2)}`,
      );
    }
  });
}

test('Home trust spotlight — readable text contrast spot-check', async ({ page }) => {
  await page.goto('/Home');
  await page.waitForLoadState('networkidle').catch(() => {});

  const section = page.locator('#trust-ecosystem');
  await expect(section).toBeVisible({ timeout: 30_000 });

  const heading = section.getByRole('heading', { name: /champion barbers/i });
  await expect(heading).toBeVisible();

  const color = await heading.evaluate((el) => window.getComputedStyle(el).color);
  const bg = await heading.evaluate((el) => {
    let node = el;
    while (node) {
      const bgc = window.getComputedStyle(node).backgroundColor;
      if (bgc && bgc !== 'rgba(0, 0, 0, 0)' && bgc !== 'transparent') return bgc;
      node = node.parentElement;
    }
    return 'rgb(255, 255, 255)';
  });

  record({
    type: 'contrast-spot',
    route: '/Home#trust-ecosystem',
    headingColor: color,
    backgroundColor: bg,
  });

  const parse = (s) => {
    const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [255, 255, 255];
  };
  const [tr, tg, tb] = parse(color);
  const [br, bgG, bb] = parse(bg);
  const lum = (r, g, b) => {
    const f = (c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const l1 = lum(tr, tg, tb);
  const l2 = lum(br, bgG, bb);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  record({ type: 'contrast-ratio', route: '/Home#trust-ecosystem', ratio: Math.round(ratio * 100) / 100 });

  expect(ratio, 'Champion barbers heading contrast on warm card').toBeGreaterThanOrEqual(4.5);
});

test('BookingFlow guest path — services step', async ({ page }) => {
  await page.goto(
    `/BookingFlow?barberId=${SEED.barber.nikos.id}&shopId=${SEED.shop.downtown.id}&step=services`,
  );
  await expect(page).not.toHaveURL(/SignIn/i, { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: /Book Appointment/i })).toBeVisible({ timeout: 30_000 });
  await page.waitForLoadState('networkidle').catch(() => {});

  const scan = await scanA11y(page, { label: 'BookingFlow services' });
  record({ type: 'a11y', route: '/BookingFlow', label: 'BookingFlow', viewport: 'desktop', ...scan });
  if (A11Y_STRICT) expect(scan.violationCount, 'BookingFlow a11y').toBe(0);
});
