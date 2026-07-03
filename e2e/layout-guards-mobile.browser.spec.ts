import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 13'] });

test('Home mobile menu exposes Sign In for guests', async ({ page }) => {
  await page.goto('/Home');
  await page.getByRole('button', { name: 'Toggle menu' }).click();
  await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible({ timeout: 10_000 });
});
