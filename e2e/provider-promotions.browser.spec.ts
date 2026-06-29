import { test, expect } from '@playwright/test';
import { hasClerkProviderBrowser } from './fixtures/env';
import { signInProvider } from './fixtures/auth';
import { SEED, uniquePromoCode } from './fixtures/seed-data';
import {
    bookingFlowUrl,
    completeBookingStepsToConfirmation,
    applyPromoOnConfirmation,
} from './fixtures/booking-helpers';

/**
 * Provider user journey: create shop promo in Console Settings → verify it works at checkout.
 * Requires E2E_CLERK_PROVIDER_EMAIL linked to a barber/shop owner at seeded shop s1.
 */
test.describe('Provider promotions (browser user journey)', () => {
    test('provider creates promo in Pricing tab and applies it when booking', async ({ page }) => {
        test.skip(
            !hasClerkProviderBrowser(),
            'Set CLERK_SECRET_KEY, E2E_CLERK_PROVIDER_EMAIL, E2E_FRONTEND_URL — provider must belong to shop s1'
        );

        const promoCode = uniquePromoCode('E2EPROV');

        await signInProvider(page);
        await page.goto('/ProviderSettings');
        await expect(page.getByRole('heading', { name: /Console Settings/i })).toBeVisible({ timeout: 30_000 });

        await page.getByRole('tab', { name: 'Pricing' }).click();
        await expect(page.getByText('Promotions')).toBeVisible({ timeout: 15_000 });

        const codeInput = page.getByLabel('Code');
        await codeInput.fill(promoCode);
        await page.getByRole('button', { name: /Add promo/i }).click();

        await expect(page.getByText(promoCode)).toBeVisible({ timeout: 20_000 });
        await expect(page.getByText('Promotion created')).toBeVisible({ timeout: 10_000 });

        await page.goto(bookingFlowUrl(SEED.barber.nikos.id, SEED.shop.downtown.id));
        await completeBookingStepsToConfirmation(page);
        await applyPromoOnConfirmation(page, promoCode);
        await expect(page.getByText(/-\$\d+\.\d{2}/)).toBeVisible({ timeout: 15_000 });
    });

    test('provider can deactivate a promo from the list', async ({ page }) => {
        test.skip(!hasClerkProviderBrowser(), 'Set CLERK_SECRET_KEY, E2E_CLERK_PROVIDER_EMAIL, E2E_FRONTEND_URL');

        const promoCode = uniquePromoCode('E2EOFF');

        await signInProvider(page);
        await page.goto('/ProviderSettings');
        await page.getByRole('tab', { name: 'Pricing' }).click();

        await page.getByLabel('Code').fill(promoCode);
        await page.getByRole('button', { name: /Add promo/i }).click();
        await expect(page.getByText(promoCode)).toBeVisible({ timeout: 20_000 });

        const row = page.locator('li').filter({ hasText: promoCode });
        await row.getByRole('button').click();
        await expect(page.getByText('Promotion deactivated')).toBeVisible({ timeout: 15_000 });
        await expect(page.getByText(promoCode)).not.toBeVisible({ timeout: 10_000 });
    });
});
