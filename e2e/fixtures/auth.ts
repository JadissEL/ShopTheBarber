import type { Page } from '@playwright/test';
import { clerk } from '@clerk/testing/playwright';
import { passwordForEmail } from './qa-profiles';
import { waitForAuthSync } from './journey-helpers';

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

export async function signInClerkUser(page: Page, email: string): Promise<void> {
  const password = passwordForEmail(email);
  if (!password) {
    throw new Error(`No QA password for ${email} (scripts/qa-profiles.json or E2E_CLERK_*_PASSWORD)`);
  }

  await signOutIfNeeded(page);
  await page.goto('/SignIn');
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: email,
      password,
    },
  });
  await waitForClerkUser(page);
}

export async function signInClient(page: Page): Promise<void> {
  const email = process.env.E2E_CLERK_USER_EMAIL;
  if (!email) throw new Error('E2E_CLERK_USER_EMAIL is required');
  await signInClerkAndSync(page, email);
}

export async function signInProvider(page: Page): Promise<void> {
  const email = process.env.E2E_CLERK_PROVIDER_EMAIL;
  if (!email) throw new Error('E2E_CLERK_PROVIDER_EMAIL is required');
  await signInClerkAndSync(page, email);
}

export async function signInAdmin(page: Page): Promise<void> {
  const email = process.env.E2E_CLERK_ADMIN_EMAIL;
  if (!email) throw new Error('E2E_CLERK_ADMIN_EMAIL is required');
  await signInClerkAndSync(page, email);
}

/** Sign in via Clerk testing helpers and wait until /api/auth/me succeeds. */
export async function signInClerkAndSync(page: Page, email: string): Promise<void> {
  await signInClerkUser(page, email);
  await waitForAuthSync(page);
}
