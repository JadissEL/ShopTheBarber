/**
 * Shared env loader for QA / Playwright scripts (never logs secret values).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

/** Keys loaded from disk override stale shell env when not running in CI. */
const LOCAL_FORCE_KEYS = new Set([
  'CLERK_SECRET_KEY',
  'CLERK_PUBLISHABLE_KEY',
  'VITE_CLERK_PUBLISHABLE_KEY',
  'VITE_API_URL',
  'DATABASE_URL',
  'TEST_DATABASE_URL',
]);

export function loadEnvFile(relPath) {
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
    if (val) out[key] = val;
  }
  return out;
}

/** Merge .env.local + server/.env into process.env for E2E runs. */
export function hydrateE2eEnv() {
  const fileEnv = { ...loadEnvFile('.env.local'), ...loadEnvFile('server/.env') };
  const inCi = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

  for (const [key, val] of Object.entries(fileEnv)) {
    if (!inCi && LOCAL_FORCE_KEYS.has(key)) {
      process.env[key] = val;
      continue;
    }
    if (!process.env[key]) process.env[key] = val;
  }

  process.env.CLERK_PUBLISHABLE_KEY =
    process.env.CLERK_PUBLISHABLE_KEY ?? process.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (process.env.E2E_START_SERVERS === '1' && !process.env.VITE_API_URL) {
    process.env.VITE_API_URL = process.env.E2E_API_BASE_URL || 'http://127.0.0.1:3001';
  }

  return fileEnv;
}

export { root };
