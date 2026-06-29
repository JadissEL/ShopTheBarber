/**
 * End-to-end sign-up + backend sync smoke test.
 * Creates a disposable Clerk user via Backend API, signs in with @clerk/testing,
 * then verifies /api/auth/me and /SetupGuide.
 *
 * Usage: node scripts/e2e-signup-flow.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClerkClient } from '@clerk/backend';
import { chromium } from '@playwright/test';
import { clerkSetup, clerk } from '@clerk/testing/playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv(relPath) {
  const p = resolve(root, relPath);
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = { ...loadEnv('server/.env'), ...loadEnv('.env.local'), ...process.env };
const secretKey = env.CLERK_SECRET_KEY;
const frontend = env.E2E_FRONTEND_URL || 'http://localhost:3000';
const apiBase = env.E2E_API_BASE_URL || 'http://localhost:3001';

if (!secretKey) {
  console.error('Missing CLERK_SECRET_KEY in server/.env');
  process.exit(1);
}

const clerkClient = createClerkClient({ secretKey });
const stamp = Date.now();
const email = `stbe2e.${stamp}@example.com`;
const password = `Stb!Test${stamp}`;

console.log('\n1. Creating Clerk test user…');
const user = await clerkClient.users.createUser({
  emailAddress: [email],
  password,
  skipPasswordChecks: true,
});

console.log('   User created:', user.id, email);

process.env.CLERK_SECRET_KEY = secretKey;
process.env.CLERK_PUBLISHABLE_KEY = env.VITE_CLERK_PUBLISHABLE_KEY;
await clerkSetup();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const failures = [];
page.on('pageerror', (err) => failures.push(`pageerror: ${err.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') failures.push(`console: ${msg.text()}`);
});

try {
  console.log('\n2. Signing in via Clerk testing helper…');
  await page.goto(`${frontend}/login?redirect=${encodeURIComponent('/SetupGuide')}`);
  await clerk.signIn({ page, emailAddress: email, password });

  await page.waitForFunction(
    () => typeof window.Clerk !== 'undefined' && window.Clerk.loaded && !!window.Clerk.user?.id,
    { timeout: 60_000 },
  );

  console.log('\n3. Navigating to SetupGuide…');
  await page.evaluate(() => {
    const redirect = new URLSearchParams(window.location.search).get('redirect') || '/SetupGuide';
    window.location.href = redirect.startsWith('/') ? redirect : '/SetupGuide';
  });
  await page.waitForURL(/SetupGuide/i, { timeout: 60_000 });
  await page.waitForFunction(
    () => typeof window.Clerk !== 'undefined' && window.Clerk.loaded,
    { timeout: 30_000 },
  );
  console.log('   URL:', page.url());

  console.log('\n4. Waiting for backend sync…');
  await page.waitForFunction(
    async () => {
      const clerkApi = window.Clerk;
      if (!clerkApi?.session) return false;
      const token = await clerkApi.session.getToken();
      if (!token) return false;
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return false;
      const body = await res.json();
      return !!body?.id;
    },
    { timeout: 90_000 },
  );

  const meResult = await page.evaluate(async () => {
    const clerkApi = window.Clerk;
    if (!clerkApi?.session) return { status: 0, body: { error: 'No Clerk session' } };
    const token = await clerkApi.session.getToken();
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body };
  });
  console.log('   /api/auth/me:', meResult.status, meResult.body?.email || meResult.body?.error);

  if (meResult.status !== 200) {
    failures.push(`auth/me returned ${meResult.status}`);
  }

  console.log('\n5. Checking SetupGuide UI…');
  const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
  const hasWizard = /Getting started|Step 1 of|Complete your profile|Welcome/i.test(bodyText);
  console.log('   Page snippet:', bodyText.replace(/\s+/g, ' ').slice(0, 120));
  if (!hasWizard && /Account setup could not finish/i.test(bodyText)) {
    failures.push('SetupGuide showed sync error');
  }

  const health = await fetch(`${apiBase}/api/health/live`).then((r) => r.status).catch(() => 0);
  console.log('\n6. API health:', health);
  if (health !== 200) failures.push(`API health ${health}`);
} finally {
  console.log('\n7. Cleaning up Clerk test user…');
  try {
    await clerkClient.users.deleteUser(user.id);
  } catch {
    /* ignore */
  }
  await browser.close();
}

if (failures.length) {
  console.error('\nFAILED:');
  for (const f of failures) console.error(' -', f);
  process.exit(1);
}

console.log('\nPASS: sign-up → sign-in → SetupGuide → /api/auth/me OK\n');
