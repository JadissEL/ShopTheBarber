#!/usr/bin/env node
/**
 * QA Autopilot — run full test matrix, write status report, exit non-zero on failure.
 *
 * Usage:
 *   node scripts/qa-autopilot.mjs              # local prod read-only
 *   node scripts/qa-autopilot.mjs --local    # start dev servers + full mutations
 *   node scripts/qa-autopilot.mjs --verify-ci  # after push, poll GitHub Actions
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hydrateE2eEnv, loadEnvFile, root } from './qa-e2e-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(root, 'qa-reports');
const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const setupGh = args.includes('--setup-gh');
const verifyCi = args.includes('--verify-ci');

hydrateE2eEnv();
const fileEnv = { ...loadEnvFile('.env.local'), ...loadEnvFile('server/.env') };
const profiles = JSON.parse(readFileSync(resolve(__dirname, 'qa-profiles.json'), 'utf8'));
const profileEmail = (id) => profiles.find((p) => p.id === id)?.email ?? '';

const baseEnv = {
  ...process.env,
  ...fileEnv,
  CLERK_PUBLISHABLE_KEY:
    process.env.CLERK_PUBLISHABLE_KEY ||
    fileEnv.CLERK_PUBLISHABLE_KEY ||
    fileEnv.VITE_CLERK_PUBLISHABLE_KEY,
  E2E_CLERK_USER_EMAIL: process.env.E2E_CLERK_USER_EMAIL || profileEmail('qa-c1'),
  E2E_CLERK_PROVIDER_EMAIL: process.env.E2E_CLERK_PROVIDER_EMAIL || profileEmail('qa-b1'),
  E2E_CLERK_ADMIN_EMAIL: process.env.E2E_CLERK_ADMIN_EMAIL || profileEmail('qa-admin'),
  E2E_FRONTEND_URL: isLocal
    ? (process.env.E2E_FRONTEND_URL || 'http://127.0.0.1:3000')
    : (process.env.E2E_FRONTEND_URL || fileEnv.VITE_SITE_URL || 'https://shop-the-barber.vercel.app'),
  E2E_API_BASE_URL: isLocal
    ? (process.env.E2E_API_BASE_URL || 'http://127.0.0.1:3001')
    : (process.env.E2E_API_BASE_URL || fileEnv.PRODUCTION_API_URL || fileEnv.VITE_API_URL || 'https://shopthebarber.onrender.com'),
  E2E_START_SERVERS: isLocal ? '1' : '0',
  JOURNEY_READONLY: isLocal ? '0' : '1',
  QA_AUDIT_PROD: isLocal ? '0' : '1',
  ...(isLocal
    ? {
        VITE_API_URL: process.env.VITE_API_URL || process.env.E2E_API_BASE_URL || 'http://127.0.0.1:3001',
        QA_AUTH_JOURNEYS: '1',
        QA_SKIP_AUTH_JOURNEYS: '0',
        DATABASE_URL: fileEnv.TEST_DATABASE_URL || fileEnv.DATABASE_URL,
      }
    : { QA_SKIP_AUTH_JOURNEYS: '1' }),
};

const steps = [];
function run(name, cmd, cmdArgs) {
  console.log(`\n========== ${name} ==========`);
  const t0 = Date.now();
  const r = spawnSync(cmd, cmdArgs, { cwd: root, stdio: 'inherit', shell: true, env: baseEnv });
  const status = r.status === 0 ? 'pass' : 'fail';
  steps.push({ name, status, durationMs: Date.now() - t0, exitCode: r.status ?? 1 });
  return r.status ?? 1;
}

if (setupGh && process.env.GITHUB_TOKEN) {
  run('Setup GitHub QA secrets', 'node', ['scripts/setup-github-qa-secrets.mjs']);
}

mkdirSync(outDir, { recursive: true });
const startedAt = new Date().toISOString();
let exitCode = 0;

exitCode |= run('Unit tests (vitest)', 'npm', ['run', 'test']);
exitCode |= run('ESLint', 'npm', ['run', 'lint']);
exitCode |= run('Design lint', 'npm', ['run', 'qa:design-lint']);
exitCode |= run('Production build', 'npm', ['run', 'build']);

if (isLocal) {
  exitCode |= run('Verify Clerk E2E keys', 'node', ['scripts/verify-clerk-e2e.mjs']);
  exitCode |= run('Provision QA profiles', 'node', ['scripts/provision-qa-profiles.mjs']);
  exitCode |= run('Full QA audit (local)', 'node', ['scripts/qa-audit.mjs']);
} else {
  exitCode |= run('Full QA audit (production read-only)', 'node', ['scripts/qa-audit-prod.mjs']);
}

const summary = {
  startedAt,
  finishedAt: new Date().toISOString(),
  mode: isLocal ? 'local' : 'production-readonly',
  status: exitCode === 0 ? 'pass' : 'fail',
  steps,
};

writeFileSync(resolve(outDir, 'qa-autopilot-status.json'), JSON.stringify(summary, null, 2));

const md = [
  '# QA Autopilot Run',
  '',
  `**Status:** ${summary.status.toUpperCase()}`,
  `**Mode:** ${summary.mode}`,
  `**Finished:** ${summary.finishedAt}`,
  '',
  '| Step | Result | Duration |',
  '|------|--------|----------|',
  ...steps.map((s) => `| ${s.name} | ${s.status} | ${(s.durationMs / 1000).toFixed(1)}s |`),
  '',
  'See also: `qa-reports/QA-AUDIT-REPORT.md`',
].join('\n');

writeFileSync(resolve(outDir, 'QA-AUTOPILOT-RUN.md'), md);

if (verifyCi && process.env.GITHUB_TOKEN) {
  exitCode |= run('Verify GitHub CI', 'node', ['scripts/verify-ci-status.mjs']);
} else if (verifyCi) {
  console.warn('\nSkipping CI verification — GITHUB_TOKEN not set');
}

console.log(`\nAutopilot: ${summary.status.toUpperCase()} — qa-reports/qa-autopilot-status.json`);
process.exit(exitCode);
