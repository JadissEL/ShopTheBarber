#!/usr/bin/env node
/**
 * User-journey audit orchestrator.
 *
 * 1. Playwright journey specs (e2e/journeys/)
 * 2. Optional legacy script runner (qa-journey-runner.mjs) when RUN_LEGACY_JOURNEYS=1
 * 3. Unified QA report merge
 *
 * Env:
 *   E2E_FRONTEND_URL, E2E_START_SERVERS=1 (local)
 *   CLERK_SECRET_KEY + E2E_CLERK_*_EMAIL for authenticated personas
 *   JOURNEY_READONLY=1 — skip booking confirm (production smoke)
 *   RUN_LEGACY_JOURNEYS=1 — also run scripts/qa-journey-runner.mjs
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'qa-reports');

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

mkdirSync(outDir, { recursive: true });
writeFileSync(
  resolve(outDir, 'journey-playwright.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), results: [] }, null, 2),
);

const frontend = process.env.E2E_FRONTEND_URL ?? 'http://127.0.0.1:3000';
const localServers = process.env.E2E_START_SERVERS === '1';
const prodReadonly = !localServers || process.env.JOURNEY_READONLY === '1';

const pwEnv = {
  E2E_START_SERVERS: process.env.E2E_START_SERVERS ?? '1',
  E2E_FRONTEND_URL: frontend,
  E2E_API_BASE_URL: process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:3001',
  JOURNEY_READONLY: prodReadonly ? '1' : '0',
  QA_SKIP_AUTH_JOURNEYS:
    process.env.QA_SKIP_AUTH_JOURNEYS ??
    (localServers || process.env.QA_AUTH_JOURNEYS === '1' ? '0' : '1'),
};

const skipAuth = pwEnv.QA_SKIP_AUTH_JOURNEYS === '1';
const journeySpec = skipAuth ? 'e2e/journeys/guest.journey.browser.spec.ts' : 'e2e/journeys';
const playwrightEnv = skipAuth
  ? { ...pwEnv, CLERK_SECRET_KEY: '', CLERK_PUBLISHABLE_KEY: '' }
  : pwEnv;

let code = run(
  'npx',
  ['playwright', 'test', journeySpec, '--project=clerk-browser', '--workers=1'],
  playwrightEnv,
);

if (process.env.RUN_LEGACY_JOURNEYS === '1' && process.env.CLERK_SECRET_KEY) {
  code |= run('node', ['scripts/qa-journey-runner.mjs'], pwEnv);
}

const mergeCode = run('node', ['scripts/merge-qa-report.mjs'], { QA_JOURNEY_ONLY: '1' });
process.exit(code || mergeCode);
