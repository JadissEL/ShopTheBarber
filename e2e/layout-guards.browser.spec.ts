import { test, expect } from '@playwright/test';
import { NO_CLIENT_SIDEBAR_ROUTES } from './fixtures/ux-routes.js';

/**
 * Layout shell guards — catch regressions like client sidebar on public pages.
 * Desktop Chrome — inherited from clerk-browser project config.
 */

for (const path of NO_CLIENT_SIDEBAR_ROUTES) {
  test(`guest ${path} has no client desktop sidebar`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});

    const clientSidebar = page.locator('aside').filter({
      has: page.getByRole('link', { name: 'Dashboard' }),
    }).filter({
      has: page.getByRole('link', { name: 'Bookings' }),
    });

    await expect(clientSidebar, 'Client sidebar must not appear on public marketing pages').toHaveCount(0);
  });
}

test('Home has top navbar and main content', async ({ page }) => {
  await page.goto('/Home');
  await expect(page.getByRole('link', { name: /ShopTheBarber/i }).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('#main-content')).toBeVisible();
});

test('Explore shows search field', async ({ page }) => {
  await page.goto('/Explore');
  await expect(page.getByPlaceholder(/search barbers/i)).toBeVisible({ timeout: 30_000 });
});
