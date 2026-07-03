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

const pwEnv = {
  E2E_START_SERVERS: process.env.E2E_START_SERVERS ?? '1',
  E2E_FRONTEND_URL: process.env.E2E_FRONTEND_URL ?? 'http://127.0.0.1:3000',
  E2E_API_BASE_URL: process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:3001',
};

let code = run(
  'npx',
  ['playwright', 'test', 'e2e/journeys', '--project=clerk-browser', '--workers=1'],
  pwEnv,
);

if (process.env.RUN_LEGACY_JOURNEYS === '1' && process.env.CLERK_SECRET_KEY) {
  code |= run('node', ['scripts/qa-journey-runner.mjs'], pwEnv);
}

const mergeCode = run('node', ['scripts/merge-qa-report.mjs']);
process.exit(mergeCode || code);
