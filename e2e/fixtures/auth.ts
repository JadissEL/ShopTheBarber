import type { Page } from '@playwright/test';
import { setupClerkTestingToken } from '@clerk/testing/playwright';
import { passwordForEmail, emailForProfile } from './qa-profiles';
import { hydrateE2eEnv } from '../../scripts/qa-e2e-env.mjs';
import { waitForAuthSync } from './journey-helpers';
import { loadClerkTestingEnv } from './clerk-env';
async function signOutIfNeeded(page: Page): Promise<void> {
  try {
    await page.goto('/');
    await page
      .waitForFunction(
        () =>
          typeof (window as unknown as { Clerk?: { loaded?: boolean } }).Clerk !== 'undefined' &&
          (window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded,
        { timeout: 15_000 },
      )
      .catch(() => {});

    await page
      .evaluate(async () => {
        const c = (window as unknown as { Clerk?: { session?: unknown; signOut: () => Promise<void> } }).Clerk;
        if (c?.session) await c.signOut();
      })
      .catch(() => {});
  } catch {
    /* page may already be closed between serial tests */
  }
}

async function waitForClerkUser(page: Page, timeout = 60_000): Promise<void> {
  await page.waitForFunction(
    () => {
      const c = (window as unknown as { Clerk?: { loaded?: boolean; user?: { id?: string } } }).Clerk;
      return !!c?.loaded && !!c.user?.id;
    },
    { timeout },
  );
}

async function ensureClerkTesting(page: Page): Promise<void> {
  loadClerkTestingEnv();
  if (process.env.CLERK_FAPI && process.env.CLERK_TESTING_TOKEN) {
    await setupClerkTestingToken({ page });
  }
}

export async function signInClerkUser(page: Page, email: string): Promise<void> {
  hydrateE2eEnv();
  await signOutIfNeeded(page);
  await ensureClerkTesting(page);

  const password = passwordForEmail(email);
  if (!password) {
    throw new Error(`No QA password for ${email} (scripts/qa-profiles.json or E2E_CLERK_*_PASSWORD)`);
  }

  await page.goto('/SignIn');
  await page.waitForFunction(
    () => (window as unknown as { Clerk?: { loaded?: boolean } }).Clerk?.loaded,
    { timeout: 30_000 },
  );

  const submit = () => page.locator('button.cl-formButtonPrimary').first();

  const identifier = page.locator('input[name="identifier"], input[type="email"]').first();
  await identifier.waitFor({ state: 'visible', timeout: 30_000 });
  await identifier.fill(email);
  await submit().click();

  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: 30_000 });
  await passwordInput.fill(password);
  await submit().click();
  await waitForAuthSync(page);
}

export async function signInClient(page: Page): Promise<void> {
  const email = process.env.E2E_CLERK_USER_EMAIL || emailForProfile('qa-c1');
  if (!email) throw new Error('E2E_CLERK_USER_EMAIL is required');
  await signInClerkAndSync(page, email);
}

export async function signInProvider(page: Page): Promise<void> {
  const email = process.env.E2E_CLERK_PROVIDER_EMAIL || emailForProfile('qa-b1');
  if (!email) throw new Error('E2E_CLERK_PROVIDER_EMAIL is required');
  await signInClerkAndSync(page, email);
}

export async function signInAdmin(page: Page): Promise<void> {
  const email = process.env.E2E_CLERK_ADMIN_EMAIL || emailForProfile('qa-admin');
  if (!email) throw new Error('E2E_CLERK_ADMIN_EMAIL is required');
  await signInClerkAndSync(page, email);
}

/** Sign in via Clerk UI and wait until /api/auth/me succeeds. */
export async function signInClerkAndSync(page: Page, email: string): Promise<void> {
  await signInClerkUser(page, email);
}
