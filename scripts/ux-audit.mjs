#!/usr/bin/env node
/**
 * Full UX audit orchestrator (free / local / CI).
 *
 * 1. Design-token drift lint (src/)
 * 2. Playwright layout guards + axe a11y on public routes
 * 3. Merged report in qa-reports/
 *
 * Env:
 *   E2E_FRONTEND_URL — target (default http://127.0.0.1:3000)
 *   E2E_START_SERVERS=1 — boot vite + api before browser tests
 *
 * Usage:
 *   npm run qa:audit
 *   E2E_FRONTEND_URL=https://shop-the-barber.vercel.app npm run qa:audit:prod
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

let code = 0;

code |= run('node', ['scripts/design-lint.mjs']);

const pwEnv = {
  E2E_START_SERVERS: process.env.E2E_START_SERVERS ?? '1',
  E2E_FRONTEND_URL: process.env.E2E_FRONTEND_URL ?? 'http://127.0.0.1:3000',
};

code |= run('npx', ['playwright', 'test', 'e2e/ux-audit.browser.spec.ts', 'e2e/ux-audit-mobile.browser.spec.ts', 'e2e/layout-guards.browser.spec.ts', 'e2e/layout-guards-mobile.browser.spec.ts', '--project=clerk-browser', '--workers=1'], pwEnv);

// Merge always runs; exit code reflects report (design + a11y discrepancies)
const mergeCode = run('node', ['scripts/merge-ux-report.mjs']);
process.exit(mergeCode);
