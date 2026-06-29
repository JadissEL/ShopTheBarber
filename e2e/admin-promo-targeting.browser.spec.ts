import { test, expect } from '@playwright/test';
import { hasClerkAdminBrowser } from './fixtures/env';
import { signInAdmin } from './fixtures/auth';
import { SEED, uniquePromoCode } from './fixtures/seed-data';
import {
    bookingFlowUrl,
    completeBookingStepsToConfirmation,
    applyPromoOnConfirmation,
} from './fixtures/booking-helpers';

/**
 * Admin user journey: create audience-targeted platform promo → verify at client checkout.
 * Requires E2E_CLERK_ADMIN_EMAIL with admin role in Clerk/DB.
 */
test.describe('Admin promo targeting (browser user journey)', () => {
    test('admin creates shop-targeted promo and it applies for Downtown Cuts bookings', async ({ page }) => {
        test.skip(
            !hasClerkAdminBrowser(),
            'Set CLERK_SECRET_KEY, E2E_CLERK_ADMIN_EMAIL, E2E_FRONTEND_URL — user must have admin role'
        );

        const promoCode = uniquePromoCode('E2EADM');

        await signInAdmin(page);
        await page.goto('/GlobalFinancials');
        await expect(page.getByRole('heading', { name: /Financial Command/i })).toBeVisible({
            timeout: 45_000,
        });

        await page.getByRole('tab', { name: 'Promotions' }).click();
        await expect(page.getByText('Platform promotions')).toBeVisible({ timeout: 20_000 });

        await page.getByRole('button', { name: /New promo/i }).click();
        await expect(page.getByRole('dialog')).toBeVisible();

        await page.getByLabel('Promo code').fill(promoCode);

        const audienceTrigger = page.locator('label', { hasText: 'Audience' }).locator('..').getByRole('combobox');
        await audienceTrigger.click();
        await page.getByRole('option', { name: /Specific barbershops only/i }).click();

        const shopCheckbox = page.getByRole('checkbox', { name: new RegExp(SEED.shop.downtown.name, 'i') });
        await expect(shopCheckbox).toBeVisible({ timeout: 15_000 });
        await shopCheckbox.check();

        await page.getByRole('button', { name: /Create promo/i }).click();
        await expect(page.getByText('Promotion created')).toBeVisible({ timeout: 20_000 });
        await expect(page.getByText(promoCode)).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(/Specific barbershops only/i)).toBeVisible();

        await page.goto(bookingFlowUrl(SEED.barber.nikos.id, SEED.shop.downtown.id));
        await completeBookingStepsToConfirmation(page);
        await applyPromoOnConfirmation(page, promoCode);
        await expect(page.getByText(new RegExp(`Promo \\(.*${promoCode}`, 'i'))).toBeVisible({
            timeout: 15_000,
        });
    });

    test('non-admin cannot access Global Financials admin zone', async ({ page }) => {
        test.skip(!process.env.E2E_CLERK_USER_EMAIL || !process.env.CLERK_SECRET_KEY || !process.env.E2E_FRONTEND_URL);

        await page.goto('/');
        const { clerk } = await import('@clerk/testing/playwright');
        await clerk.signIn({ page, emailAddress: process.env.E2E_CLERK_USER_EMAIL! });

        await page.goto('/GlobalFinancials');
        await expect(page).not.toHaveURL(/GlobalFinancials/i, { timeout: 15_000 });
    });
});
