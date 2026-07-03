#!/usr/bin/env node
/**
 * Full QA audit: design lint + UX/a11y + user journeys + unified report.
 *
 * Usage:
 *   npm run qa:audit:full
 *   E2E_FRONTEND_URL=https://shop-the-barber.vercel.app JOURNEY_READONLY=1 npm run qa:audit:full:prod
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function run(cmd, args, env = {}) {
  console.log(`\n> ${cmd} ${args.join(' ')}`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...env },
  });
  return r.status ?? 1;
}

const isProd = process.env.QA_AUDIT_PROD === '1';
const prodFrontend = process.env.E2E_JOURNEY_FRONTEND_URL || 'https://shop-the-barber.vercel.app';
const frontend = process.env.E2E_FRONTEND_URL ?? (isProd ? prodFrontend : 'http://127.0.0.1:3000');
const authJourneys = process.env.QA_AUTH_JOURNEYS === '1' || process.env.E2E_START_SERVERS === '1';

const env = {
  E2E_FRONTEND_URL: frontend,
  E2E_START_SERVERS: isProd && !authJourneys ? '0' : (process.env.E2E_START_SERVERS ?? '1'),
  E2E_API_BASE_URL: process.env.E2E_API_BASE_URL ?? (isProd ? process.env.PRODUCTION_API_URL : 'http://127.0.0.1:3001'),
  JOURNEY_READONLY: isProd && !authJourneys ? '1' : (process.env.JOURNEY_READONLY ?? '0'),
  QA_AUTH_JOURNEYS: authJourneys ? '1' : '0',
  QA_SKIP_AUTH_JOURNEYS: isProd && !authJourneys ? '1' : '0',
};

const journeyEnv = {
  ...env,
  E2E_FRONTEND_URL: isProd && !authJourneys ? prodFrontend : frontend,
};

let code = 0;
code |= run('node', ['scripts/design-lint.mjs']);

code |= run(
  'npx',
  [
    'playwright',
    'test',
    'e2e/ux-audit.browser.spec.ts',
    'e2e/ux-audit-mobile.browser.spec.ts',
    'e2e/layout-guards.browser.spec.ts',
    'e2e/layout-guards-mobile.browser.spec.ts',
    '--project=clerk-browser',
    '--workers=1',
  ],
  env,
);

code |= run('npx', ['playwright', 'test', 'e2e/journeys', '--project=clerk-browser', '--workers=1'], journeyEnv);

if (process.env.RUN_LEGACY_JOURNEYS === '1' && process.env.CLERK_SECRET_KEY) {
  code |= run('node', ['scripts/qa-journey-runner.mjs'], env);
}

const mergeCode = run('node', ['scripts/merge-qa-report.mjs']);
process.exit(mergeCode);
