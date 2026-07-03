#!/usr/bin/env node
/**
 * QA Autopilot — run full test matrix, write status report, exit non-zero on failure.
 *
 * Usage:
 *   node scripts/qa-autopilot.mjs              # local prod read-only
 *   node scripts/qa-autopilot.mjs --local    # start dev servers + full mutations
 *   node scripts/qa-autopilot.mjs --setup-gh   # push Clerk secrets to GitHub first
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'qa-reports');
const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const setupGh = args.includes('--setup-gh');

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

const fileEnv = { ...loadEnv('.env.local'), ...loadEnv('server/.env') };
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
console.log(`\nAutopilot: ${summary.status.toUpperCase()} — qa-reports/qa-autopilot-status.json`);
process.exit(exitCode);
