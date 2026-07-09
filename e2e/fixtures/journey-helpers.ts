import { expect, type Page } from '@playwright/test';
import { recordJourneyStep } from './journey-report';

export async function assertHealthyPage(page: Page): Promise<void> {
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/Something went wrong|ErrorBoundary|ReferenceError/i);
}

export async function assertNotSignInRedirect(page: Page): Promise<void> {
  await expect(page).not.toHaveURL(/SignIn|\/login(?:\?|$)/i, { timeout: 15_000 });
}

/** Backend sync failed — usually VITE_API_URL pointing at production while QA users are local. */
export async function assertNotSetupGuideRedirect(page: Page): Promise<void> {
  await expect(page).not.toHaveURL(/SetupGuide/i, { timeout: 15_000 });
}

export async function dismissOnboardingModal(page: Page): Promise<void> {
  const dialog = page.locator('[role="dialog"]');
  if (await dialog.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await page.keyboard.press('Escape').catch(() => {});
    await dialog.waitFor({ state: 'hidden', timeout: 5_000 }).catch(() => {});
  }
}

/** Navigate to a protected route after Clerk + backend user are ready. */
export async function gotoAuthenticated(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
  await assertNotSignInRedirect(page);
  await assertNotSetupGuideRedirect(page);
  await waitForAuthSync(page);
  await page.waitForURL(new RegExp(path.replace(/^\//, '').split('?')[0], 'i'), { timeout: 45_000 });
  await dismissOnboardingModal(page);
}

/** Visit a forbidden route after session is warm; assert RBAC redirect to home dashboard. */
export async function expectRbacRedirect(
  page: Page,
  personaLanding: string,
  forbiddenPath: string,
  expectedUrlPattern: RegExp,
): Promise<void> {
  await gotoAuthenticated(page, personaLanding);
  await page.goto(forbiddenPath);
  await page.waitForLoadState('domcontentloaded');
  await assertNotSignInRedirect(page);
  await page.waitForURL(expectedUrlPattern, { timeout: 45_000 });
}

export async function waitForAuthSync(page: Page, timeout = 90_000): Promise<void> {
  const deadline = Date.now() + timeout;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      await page.waitForFunction(
        async () => {
          const c = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } })
            .Clerk;
          if (!c?.session) return false;
          const token = await c.session.getToken();
          if (!token) return false;
          const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) return false;
          const body = await res.json();
          return !!body?.id;
        },
        { timeout: Math.min(20_000, deadline - Date.now()) },
      );
      return;
    } catch (err) {
      lastError = err;
      await page.waitForTimeout(1_000);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Auth sync timed out');
}

export async function journeyStep(
  persona: string,
  step: string,
  page: Page,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
    recordJourneyStep({ persona, step, status: 'pass', url: page.url() });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    recordJourneyStep({ persona, step, status: 'fail', error: message, url: page.url() });
    throw err;
  }
}

export function journeySkip(persona: string, step: string, reason: string): void {
  recordJourneyStep({ persona, step, status: 'skip', error: reason });
}
