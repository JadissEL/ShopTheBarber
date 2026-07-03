import { clerkSetup } from '@clerk/testing/playwright';
import { hydrateE2eEnv } from '../scripts/qa-e2e-env.mjs';
import { persistClerkTestingEnv } from './fixtures/clerk-env';

/**
 * Runs once before workers — writes CLERK_FAPI + testing token for test workers.
 */
export default async function globalSetup() {
  if (process.env.QA_SKIP_AUTH_JOURNEYS === '1') {
    console.warn('[e2e] QA_SKIP_AUTH_JOURNEYS=1 — skipping clerkSetup (guest-only run)');
    return;
  }

  hydrateE2eEnv();

  if (!process.env.CLERK_SECRET_KEY) {
    console.warn('[e2e] CLERK_SECRET_KEY unset — skipping clerkSetup (guest specs only)');
    return;
  }

  try {
    await clerkSetup({ dotenv: false });
    persistClerkTestingEnv();
    console.warn('[e2e] clerkSetup OK — persisted testing env for workers');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[e2e] clerkSetup failed — authenticated specs will skip: ${msg}`);
  }
}
