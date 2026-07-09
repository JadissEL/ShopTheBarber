/**
 * RS1 — Create one Playwright storageState file per journey persona.
 * Run as Playwright project `setup-auth` before authenticated journey specs.
 */
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { test as setup } from '@playwright/test';
import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';
import { hydrateE2eEnv } from '../../scripts/qa-e2e-env.mjs';
import { loadClerkTestingEnv } from '../fixtures/clerk-env';
import { waitForAuthSync } from '../fixtures/journey-helpers';
import {
  JOURNEY_AUTH_PERSONAS,
  authStoragePath,
  protectedLandingPath,
} from '../fixtures/personas';

setup.beforeAll(() => {
  hydrateE2eEnv();
  loadClerkTestingEnv();
});

for (const persona of JOURNEY_AUTH_PERSONAS) {
  setup(`authenticate ${persona.label}`, async ({ page, context }) => {
    const storagePath = authStoragePath(persona.id);
    mkdirSync(dirname(storagePath), { recursive: true });

    await context.clearCookies();
    await page.goto('/');
    await setupClerkTestingToken({ page });

    await page.evaluate(async () => {
      const c = (window as unknown as { Clerk?: { signOut: () => Promise<void>; session?: unknown } })
        .Clerk;
      if (c?.session) await c.signOut();
    });

    await clerk.signIn({
      page,
      emailAddress: persona.email,
    });

    await waitForAuthSync(page);

    const me = await page.evaluate(async () => {
      const c = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } })
        .Clerk;
      const token = await c?.session?.getToken();
      if (!token) return null;
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      return res.json();
    });

    if (me?.needsProvision) {
      throw new Error(
        `${persona.email} needs DB provision — run npm run qa:provision && npm run qa:verify`,
      );
    }

    const landing = protectedLandingPath(persona.id);
    await page.goto(landing);
    await waitForAuthSync(page);
    await page.waitForURL(new RegExp(landing.replace(/^\//, ''), 'i'), { timeout: 45_000 });

    await page.waitForFunction(
      () => {
        const match = document.cookie.match(/__client_uat[^=]*=(\d+)/);
        return match != null && match[1] !== '0';
      },
      { timeout: 30_000 },
    );

    await page.context().storageState({ path: storagePath });
  });
}
