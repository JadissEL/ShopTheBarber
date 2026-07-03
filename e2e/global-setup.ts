import { clerkSetup } from '@clerk/testing/playwright';

/**
 * Initializes Clerk testing tokens for browser specs that call clerk.signIn().
 * Skipped when CLERK_SECRET_KEY is unset (guest-only runs).
 */
export default async function globalSetup() {
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
