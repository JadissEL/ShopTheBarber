import { clerkSetup } from '@clerk/testing/playwright';

/**
 * Initializes Clerk testing tokens for browser specs that call clerk.signIn().
 * Skipped for guest-only audits (QA_SKIP_AUTH_JOURNEYS) or when CLERK_SECRET_KEY is unset.
 */
export default async function globalSetup() {
  if (process.env.QA_SKIP_AUTH_JOURNEYS === '1') {
    console.warn('[e2e] QA_SKIP_AUTH_JOURNEYS=1 — skipping clerkSetup (guest-only run)');
    return;
  }

  if (!process.env.CLERK_SECRET_KEY) {
    console.warn('[e2e] CLERK_SECRET_KEY unset — skipping clerkSetup (guest specs only)');
    return;
  }

  process.env.CLERK_PUBLISHABLE_KEY =
    process.env.VITE_CLERK_PUBLISHABLE_KEY ?? process.env.CLERK_PUBLISHABLE_KEY;

  if (!process.env.CLERK_PUBLISHABLE_KEY) {
    console.warn('[e2e] CLERK_PUBLISHABLE_KEY unset — clerk sign-in specs may fail');
  }

  await clerkSetup();
}
