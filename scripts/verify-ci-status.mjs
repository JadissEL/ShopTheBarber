#!/usr/bin/env node
/**
 * Poll GitHub Actions for CI / UX Audit / Journey Audit on the current HEAD (or --sha).
 *
 * Usage:
 *   node scripts/verify-ci-status.mjs
 *   node scripts/verify-ci-status.mjs --sha abc123 --timeout 900
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'qa-reports');

const args = process.argv.slice(2);
const shaArg = args.find((a) => a.startsWith('--sha='))?.slice(6) ?? (args.includes('--sha') ? args[args.indexOf('--sha') + 1] : null);
const timeoutSec = Number(args.find((a) => a.startsWith('--timeout='))?.slice(10) ?? 900);
const repo = process.env.GITHUB_REPOSITORY || 'JadissEL/ShopTheBarber';
const token = process.env.GITHUB_TOKEN;

const WORKFLOWS = ['CI', 'UX Audit', 'Journey Audit'];

function gitHead() {
  const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) throw new Error('git rev-parse HEAD failed');
  return r.stdout.trim();
}

async function fetchRuns(sha) {
  const url = `https://api.github.com/repos/${repo}/actions/runs?head_sha=${sha}&per_page=20`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.workflow_runs ?? [];
}

function summarize(runs) {
  const byName = {};
  for (const run of runs) {
    if (!WORKFLOWS.includes(run.name)) continue;
    const prev = byName[run.name];
    if (!prev || new Date(run.created_at) > new Date(prev.created_at)) {
      byName[run.name] = run;
    }
  }
  return byName;
}

function allDone(byName) {
  return WORKFLOWS.every((name) => {
    const run = byName[name];
    return run && run.status === 'completed';
  });
}

function allPass(byName) {
  return WORKFLOWS.every((name) => byName[name]?.conclusion === 'success');
}

async function main() {
  if (!token) {
    console.error('GITHUB_TOKEN is required for CI verification');
    process.exit(1);
  }

  const sha = shaArg || gitHead();
  console.log(`\nVerifying CI for ${repo} @ ${sha.slice(0, 7)} (timeout ${timeoutSec}s)\n`);

  const started = Date.now();
  let lastByName = {};

  while (Date.now() - started < timeoutSec * 1000) {
    const runs = await fetchRuns(sha);
    lastByName = summarize(runs);

    for (const name of WORKFLOWS) {
      const run = lastByName[name];
      const status = run ? `${run.status}${run.conclusion ? ` (${run.conclusion})` : ''}` : 'pending';
      console.log(`  ${name}: ${status}`);
    }

    if (allDone(lastByName)) break;
    await new Promise((r) => setTimeout(r, 15_000));
  }

  mkdirSync(outDir, { recursive: true });
  const report = {
    sha,
    repo,
    checkedAt: new Date().toISOString(),
    workflows: WORKFLOWS.map((name) => {
      const run = lastByName[name];
      return {
        name,
        id: run?.id ?? null,
        status: run?.status ?? 'missing',
        conclusion: run?.conclusion ?? null,
        url: run?.html_url ?? null,
      };
    }),
    pass: allPass(lastByName),
  };

  writeFileSync(resolve(outDir, 'qa-ci-status.json'), JSON.stringify(report, null, 2));

  if (!allDone(lastByName)) {
    console.error('\nCI verification timed out before all workflows completed.');
    process.exit(1);
  }

  if (!allPass(lastByName)) {
    console.error('\nCI verification FAILED — one or more workflows did not succeed.');
    for (const w of report.workflows) {
      if (w.conclusion !== 'success') console.error(`  ${w.name}: ${w.conclusion ?? w.status} ${w.url ?? ''}`);
    }
    process.exit(1);
  }

  console.log('\nCI verification PASS — CI, UX Audit, and Journey Audit all succeeded.');
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
