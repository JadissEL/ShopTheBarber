import { test, expect } from '@playwright/test';
import { hasApiBaseUrl } from '../fixtures/env';
import { SEED } from '../fixtures/seed-data';
import { JOURNEY_PERSONAS, isJourneyReadonly } from '../fixtures/journey-matrix';
import { flushJourneyReport, resetJourneyReportFile } from '../fixtures/journey-report';
import { assertHealthyPage, journeyStep } from '../fixtures/journey-helpers';
import {
  bookingFlowUrl,
  completeGuestBookingToConfirmation,
  fillGuestContactAndConfirm,
} from '../fixtures/booking-helpers';

const PERSONA = JOURNEY_PERSONAS.guest;

test.describe.serial('Guest user journey', () => {
  test.beforeAll(() => {
    resetJourneyReportFile();
  });

  test.afterAll(() => {
    flushJourneyReport();
  });

  test('Home loads with primary CTA', async ({ page }) => {
    await journeyStep(PERSONA, 'Home loads with primary CTA', page, async () => {
      await page.goto('/Home');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertHealthyPage(page);
      await expect(page.getByRole('link', { name: /ShopTheBarber/i }).first()).toBeVisible({
        timeout: 30_000,
      });
    });
  });

  test('Explore discovery search', async ({ page }) => {
    await journeyStep(PERSONA, 'Explore discovery search', page, async () => {
      await page.goto('/Explore');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertHealthyPage(page);
      await expect(page.getByPlaceholder(/search barbers/i)).toBeVisible({ timeout: 30_000 });
    });
  });

  test('Guest BookingFlow entry (no Sign In redirect)', async ({ page, request }) => {
    test.skip(!hasApiBaseUrl(), 'Set E2E_API_BASE_URL for cash-availability check');

    const cashRes = await request.get(
      `/api/provider-wallet/cash-availability?barber_id=${SEED.barber.nikos.id}&shop_id=${SEED.shop.downtown.id}`,
    );
    test.skip(!cashRes.ok(), 'API unavailable for guest booking precheck');

    await journeyStep(PERSONA, 'Guest BookingFlow entry (no Sign In redirect)', page, async () => {
      await page.goto(bookingFlowUrl(SEED.barber.nikos.id, SEED.shop.downtown.id));
      await expect(page).not.toHaveURL(/SignIn/i, { timeout: 15_000 });
      await expect(page.getByRole('heading', { name: /Book Appointment/i })).toBeVisible({
        timeout: 30_000,
      });

      if (!isJourneyReadonly()) {
        await completeGuestBookingToConfirmation(page);
        await fillGuestContactAndConfirm(page, {
          name: 'Journey Guest',
          phone: '+33687654321',
        });
        await expect(page.getByRole('link', { name: /View your booking/i })).toBeVisible({
          timeout: 15_000,
        });
      }
    });
  });

  test('Marketplace browse', async ({ page }) => {
    await journeyStep(PERSONA, 'Marketplace browse', page, async () => {
      await page.goto('/Marketplace');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertHealthyPage(page);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    });
  });

  test('Help Center', async ({ page }) => {
    await journeyStep(PERSONA, 'Help Center', page, async () => {
      await page.goto('/HelpCenter');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertHealthyPage(page);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 30_000 });
    });
  });
});
