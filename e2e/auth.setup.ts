import { test as setup } from '@playwright/test';
import { clerkSetup } from '@clerk/testing/playwright';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile(relPath: string): void {
  const p = resolve(process.cwd(), relPath);
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    if (process.env[key]) continue;
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

setup.describe.configure({ mode: 'serial' });

setup('initialize Clerk testing tokens', async () => {
  if (process.env.QA_SKIP_AUTH_JOURNEYS === '1') {
    console.warn('[e2e] QA_SKIP_AUTH_JOURNEYS=1 — skipping clerkSetup (guest-only run)');
    return;
  }

  loadEnvFile('.env.local');
  loadEnvFile('server/.env');

  process.env.CLERK_PUBLISHABLE_KEY =
    process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (process.env.E2E_START_SERVERS === '1' && !process.env.VITE_API_URL) {
    process.env.VITE_API_URL = process.env.E2E_API_BASE_URL || 'http://127.0.0.1:3001';
  }

  if (!process.env.CLERK_SECRET_KEY) {
    console.warn('[e2e] CLERK_SECRET_KEY unset — skipping clerkSetup (guest specs only)');
    return;
  }

  try {
    await clerkSetup({ dotenv: false });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[e2e] clerkSetup failed — authenticated specs will skip: ${msg}`);
  }
});
