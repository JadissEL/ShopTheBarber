import { test, expect } from '../fixtures/test-with-auth';
import { authStoragePath, PERSONA_IDS } from '../fixtures/personas';
import { hasClerkBrowserE2e, skipAuthenticatedJourneys } from '../fixtures/env';
import { JOURNEY_PERSONAS, isJourneyReadonly } from '../fixtures/journey-matrix';
import { flushJourneyReport } from '../fixtures/journey-report';
import { assertHealthyPage, assertNotSignInRedirect, gotoAuthenticated, journeyStep } from '../fixtures/journey-helpers';
import { bookingFlowUrl, completeBookingStepsToConfirmation } from '../fixtures/booking-helpers';
import { SEED } from '../fixtures/seed-data';

const PERSONA = JOURNEY_PERSONAS.client;

test.use({ storageState: authStoragePath(PERSONA_IDS.client) });

test.describe('Client user journey', () => {
  test.beforeAll(() => {
    test.skip(
      skipAuthenticatedJourneys(),
      'Authenticated journeys require local dev servers (QA Clerk users are not on production)',
    );
    test.skip(!hasClerkBrowserE2e(), 'Set CLERK_SECRET_KEY, E2E_FRONTEND_URL, Clerk testing token');
  });

  test.afterAll(() => {
    flushJourneyReport();
  });

  test('Dashboard loads', async ({ page }) => {
    await journeyStep(PERSONA, 'Dashboard loads', page, async () => {
      await gotoAuthenticated(page, '/Dashboard');
      await page.waitForLoadState('networkidle').catch(() => {});
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
      await gotoAuthenticated(page, '/UserBookings');
      await expect(page.getByRole('heading', { level: 1, name: 'My Bookings' })).toBeVisible({
        timeout: 30_000,
      });
    });
  });

  test('Wallet balance page', async ({ page }) => {
    await journeyStep(PERSONA, 'Wallet balance page', page, async () => {
      await gotoAuthenticated(page, '/ClientWallet');
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
      await gotoAuthenticated(page, '/ShoppingBag');
      await expect(page.getByRole('heading', { name: 'Shopping Bag' })).toBeVisible({
        timeout: 30_000,
      });
    });
  });

  test('Favorites', async ({ page }) => {
    await journeyStep(PERSONA, 'Favorites', page, async () => {
      await gotoAuthenticated(page, '/Favorites');
      await expect(page.getByRole('heading', { name: 'Favorites' })).toBeVisible({ timeout: 30_000 });
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

  test('Session persists across navigation', async ({ page }) => {
    await journeyStep(PERSONA, 'Session persists across navigation', page, async () => {
      await page.goto('/Dashboard');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
      await page.goto('/Explore');
      await page.waitForLoadState('networkidle').catch(() => {});
      await assertNotSignInRedirect(page);
    });
  });
});
