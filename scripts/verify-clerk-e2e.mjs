#!/usr/bin/env node
/**
 * Validate Clerk keys for Playwright E2E (never prints secret values).
 * Usage: node scripts/verify-clerk-e2e.mjs
 */
import { createClerkClient } from '@clerk/backend';
import { parsePublishableKey } from '@clerk/shared/keys';
import { hydrateE2eEnv } from './qa-e2e-env.mjs';

const env = hydrateE2eEnv();
const secretKey = env.CLERK_SECRET_KEY?.trim() || process.env.CLERK_SECRET_KEY?.trim();
const publishableKey = (
  env.CLERK_PUBLISHABLE_KEY ||
  env.VITE_CLERK_PUBLISHABLE_KEY ||
  process.env.CLERK_PUBLISHABLE_KEY ||
  process.env.VITE_CLERK_PUBLISHABLE_KEY
)?.trim();

const lines = ['# Clerk E2E verification', ''];

if (!secretKey) {
  lines.push('- CLERK_SECRET_KEY: **missing** (server/.env)');
  console.log(lines.join('\n'));
  process.exit(1);
}

lines.push(
  `- CLERK_SECRET_KEY: present (${secretKey.startsWith('sk_test_') ? 'test' : secretKey.startsWith('sk_live_') ? 'live' : 'unknown prefix'})`,
);

if (!publishableKey) {
  lines.push('- CLERK_PUBLISHABLE_KEY: **missing**');
} else {
  const parsed = parsePublishableKey(publishableKey);
  lines.push(`- CLERK_PUBLISHABLE_KEY: present (${publishableKey.startsWith('pk_test_') ? 'test' : 'live'})`);
  lines.push(`- Frontend API (from pk): ${parsed?.frontendApi ?? '**failed to parse**'}`);
  if (secretKey.startsWith('sk_test_') !== publishableKey.startsWith('pk_test_')) {
    lines.push('- **WARN**: secret/publishable key environment mismatch (test vs live)');
  }
}

try {
  const clerk = createClerkClient({ secretKey });
  const { token } = await clerk.testingTokens.createTestingToken();
  lines.push('- testingTokens.createTestingToken: **OK**');
  lines.push(`- Testing token length: ${token?.length ?? 0} chars`);
  lines.push('');
  lines.push('Clerk E2E keys are valid for @clerk/testing playwright setup.');
  console.log(lines.join('\n'));
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  lines.push(`- testingTokens.createTestingToken: **FAILED** (${msg})`);
  lines.push('');
  lines.push(
    'Fix: regenerate the Secret key in Clerk Dashboard for the same app as VITE_CLERK_PUBLISHABLE_KEY, update server/.env, then run npm run qa:autopilot:setup',
  );
  console.log(lines.join('\n'));
  process.exit(1);
}
