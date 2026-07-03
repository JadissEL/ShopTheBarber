import { test, expect } from '@playwright/test';
import { hasClerkBrowserE2e, skipAuthenticatedJourneys } from '../fixtures/env';
import { signInClient } from '../fixtures/auth';
import { JOURNEY_PERSONAS, isJourneyReadonly } from '../fixtures/journey-matrix';
import { flushJourneyReport } from '../fixtures/journey-report';
import { assertHealthyPage, assertNotSignInRedirect, journeyStep } from '../fixtures/journey-helpers';
import { bookingFlowUrl, completeBookingStepsToConfirmation } from '../fixtures/booking-helpers';
import { SEED } from '../fixtures/seed-data';

const PERSONA = JOURNEY_PERSONAS.client;

test.describe.serial('Client user journey', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      skipAuthenticatedJourneys(),
      'Authenticated journeys require local dev servers (QA Clerk users are not on production)',
    );
    test.skip(!hasClerkBrowserE2e(), 'Set CLERK_SECRET_KEY, E2E_CLERK_USER_EMAIL, E2E_FRONTEND_URL');
    await signInClient(page);
  });

  test.afterAll(() => {
    flushJourneyReport();
  });

  test('Dashboard loads', async ({ page }) => {
    await journeyStep(PERSONA, 'Dashboard loads', page, async () => {
      await page.goto('/Dashboard');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await assertHealthyPage(page);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 30_000 });
    });
  });

  test('Explore shows professionals', async ({ page }) => {
    await journeyStep(PERSONA, 'Explore shows professionals', page, async () => {
      await page.goto('/Explore');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertHealthyPage(page);
      const text = await page.locator('body').innerText();
      expect(text).toMatch(/barber|professional|rating|Explore/i);
    });
  });

  test('My Bookings', async ({ page }) => {
    await journeyStep(PERSONA, 'My Bookings', page, async () => {
      await page.goto('/UserBookings');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await expect(page.getByRole('heading', { level: 1, name: 'My Bookings' })).toBeVisible({
        timeout: 30_000,
      });
    });
  });

  test('Wallet balance page', async ({ page }) => {
    await journeyStep(PERSONA, 'Wallet balance page', page, async () => {
      await page.goto('/ClientWallet');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await expect(page.getByRole('heading', { name: 'Wallet' })).toBeVisible({ timeout: 30_000 });
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

  test('Shopping bag page', async ({ page }) => {
    await journeyStep(PERSONA, 'Shopping bag page', page, async () => {
      await page.goto('/ShoppingBag');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await expect(page.getByRole('heading', { name: 'Shopping Bag' })).toBeVisible({
        timeout: 30_000,
      });
    });
  });

  test('Favorites', async ({ page }) => {
    await journeyStep(PERSONA, 'Favorites', page, async () => {
      await page.goto('/Favorites');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      const text = await page.locator('body').innerText();
      expect(text).not.toMatch(/Sign in for Favorites/i);
      expect(text).toMatch(/favorite|barber|shop|save/i);
    });
  });

  test('BookingFlow services step', async ({ page }) => {
    await journeyStep(PERSONA, 'BookingFlow services step', page, async () => {
      await page.goto(bookingFlowUrl(SEED.barber.nikos.id, SEED.shop.downtown.id));
      await assertNotSignInRedirect(page);
      await expect(page.getByRole('heading', { name: /Book Appointment/i })).toBeVisible({
        timeout: 30_000,
      });

      if (!isJourneyReadonly()) {
        await completeBookingStepsToConfirmation(page);
        await expect(page.getByRole('heading', { name: /Review & Confirm/i })).toBeVisible({
          timeout: 30_000,
        });
      }
    });
  });
});
