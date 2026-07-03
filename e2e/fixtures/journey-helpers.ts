import { expect, type Page } from '@playwright/test';
import { recordJourneyStep } from './journey-report';

export async function assertHealthyPage(page: Page): Promise<void> {
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/Something went wrong|ErrorBoundary|ReferenceError/i);
}

export async function assertNotSignInRedirect(page: Page): Promise<void> {
  await expect(page).not.toHaveURL(/SignIn/i, { timeout: 15_000 });
}

export async function waitForAuthSync(page: Page, timeout = 90_000): Promise<void> {
  await page.waitForFunction(
    async () => {
      const c = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } }).Clerk;
      if (!c?.session) return false;
      const token = await c.session.getToken();
      if (!token) return false;
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return false;
      const body = await res.json();
      return !!body?.id;
    },
    { timeout },
  );
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
