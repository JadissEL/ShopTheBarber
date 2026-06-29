import { test, expect, devices } from '@playwright/test';
import { SEED } from './fixtures/seed-data';

/**
 * Public marketing/discovery routes — no Clerk secrets required.
 * Requires frontend (+ API proxy) at E2E_FRONTEND_URL or http://127.0.0.1:3000.
 */
test.use({ ...devices['iPhone 13'] });

test.describe('Public routes (mobile browser)', () => {
    test('home page loads branding and primary CTA', async ({ page }) => {
        await page.goto('/Home');
        await expect(page.getByRole('link', { name: /ShopTheBarber/i }).first()).toBeVisible({
            timeout: 30_000,
        });
        await expect(page.getByRole('button', { name: 'Toggle menu' })).toBeVisible();
    });

    test('explore page shows discovery search', async ({ page }) => {
        await page.goto('/Explore');
        await expect(page.getByPlaceholder(/search for professionals/i)).toBeVisible({
            timeout: 30_000,
        });
        await expect(page.getByRole('button', { name: /Professionals/i })).toBeVisible();
    });

    test('guest does not see authenticated client bottom tab bar', async ({ page }) => {
        await page.goto('/Explore');
        await expect(page.getByRole('navigation', { name: 'Main navigation' })).toHaveCount(0);
    });

    test('mobile navbar menu exposes sign-in entry', async ({ page }) => {
        await page.goto('/Home');
        await page.getByRole('button', { name: 'Toggle menu' }).click();
        await expect(page.getByRole('link', { name: 'Sign In' })).toBeVisible({ timeout: 10_000 });
    });

    test('help center loads without auth', async ({ page }) => {
        await page.goto('/HelpCenter');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    });

    test('cities directory loads for discovery SEO', async ({ page }) => {
        await page.goto('/cities');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    });

    test('about page loads without auth', async ({ page }) => {
        await page.goto('/About');
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    });

    test('BookingFlow is public for guest checkout', async ({ page }) => {
        await page.goto(
            `/BookingFlow?barberId=${SEED.barber.nikos.id}&shopId=${SEED.shop.downtown.id}&step=services`
        );
        await expect(page).not.toHaveURL(/SignIn/i, { timeout: 15_000 });
        await expect(page.getByRole('heading', { name: /Book Appointment/i })).toBeVisible({
            timeout: 30_000,
        });
    });
});
