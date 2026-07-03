#!/usr/bin/env node
/**
 * Unified QA report: design lint + UX/a11y + user journeys.
 *
 * Usage: node scripts/merge-qa-report.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'qa-reports');

function readJson(name) {
  const p = resolve(outDir, name);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

// Refresh UX sections if playwright UX artifacts exist
if (existsSync(resolve(outDir, 'ux-audit-playwright.json'))) {
  spawnSync('node', ['scripts/merge-ux-report.mjs'], {
    cwd: root,
    stdio: 'pipe',
    shell: true,
  });
}

const designLint = readJson('design-lint.json');
const uxSummary = readJson('ux-audit-summary.json');
const journeyPlaywright = readJson('journey-playwright.json');
const journeyScript = readJson('qa-journey-results.json');

const designErrors = designLint?.violations?.filter((v) => v.severity === 'error') ?? [];
const designWarnings = designLint?.violations?.filter((v) => v.severity === 'warn') ?? [];

const uxStatus = uxSummary?.summary?.status ?? 'unknown';
const a11yFails = uxSummary?.playwright?.results?.filter((r) => r.type === 'a11y' && r.violationCount > 0) ?? [];

const playwrightSteps = journeyPlaywright?.results ?? [];
const scriptPassed = journeyScript?.passed ?? [];
const scriptFailed = journeyScript?.failed ?? [];

const journeyFails = [
  ...playwrightSteps.filter((s) => s.status === 'fail'),
  ...scriptFailed.map((f) => ({
    persona: f.journey,
    step: f.step,
    status: 'fail',
    error: f.error,
  })),
];

const journeyPasses = [
  ...playwrightSteps.filter((s) => s.status === 'pass'),
  ...scriptPassed.map((p) => ({ persona: p.journey, step: p.step, status: 'pass' })),
];

const journeySkips = playwrightSteps.filter((s) => s.status === 'skip');

const byPersona = (steps) => {
  const map = new Map();
  for (const s of steps) {
    const list = map.get(s.persona) ?? [];
    list.push(s);
    map.set(s.persona, list);
  }
  return map;
};

const journeyOnly = process.env.QA_JOURNEY_ONLY === '1';
const designOk = journeyOnly && !designLint ? true : designErrors.length === 0;
const a11yOk =
  (journeyOnly && !uxSummary) || uxStatus === 'pass' || a11yFails.length === 0;
const journeyOk = journeyFails.length === 0;
const overallStatus = designOk && a11yOk && journeyOk ? 'pass' : 'fail';

const summary = {
  generatedAt: new Date().toISOString(),
  status: overallStatus,
  designLint: { errors: designErrors.length, warnings: designWarnings.length },
  ux: uxSummary?.summary ?? { status: uxStatus },
  journeys: {
    stepsPassed: journeyPasses.length,
    stepsFailed: journeyFails.length,
    stepsSkipped: journeySkips.length,
  },
};

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'qa-audit-summary.json'), JSON.stringify({ summary, designLint, uxSummary, journeyPlaywright, journeyScript }, null, 2));

const md = [
  '# ShopTheBarber QA Audit Report',
  '',
  `Generated: ${summary.generatedAt}`,
  '',
  `**Overall:** ${overallStatus === 'pass' ? 'PASS' : 'FAIL'}`,
  '',
  '## Summary',
  '',
  `| Area | Status | Detail |`,
  `|------|--------|--------|`,
  `| Design lint | ${designOk ? 'PASS' : 'FAIL'} | ${designErrors.length} errors, ${designWarnings.length} warnings |`,
  `| UX / a11y | ${a11yOk ? 'PASS' : 'FAIL'} | ${uxSummary?.summary?.a11y?.routesFailed ?? '?'} routes with axe issues |`,
  `| User journeys | ${journeyOk ? 'PASS' : 'FAIL'} | ${journeyPasses.length} passed, ${journeyFails.length} failed, ${journeySkips.length} skipped |`,
  '',
];

if (designErrors.length) {
  md.push('## Design lint errors', '');
  for (const v of designErrors.slice(0, 40)) {
    md.push(`- \`${v.file}:${v.line}\` **${v.rule}** — ${v.message}`);
  }
  md.push('');
}

if (a11yFails.length) {
  md.push('## Accessibility failures', '');
  for (const f of a11yFails) {
    md.push(`### ${f.label} (${f.route})`);
    for (const v of f.violations ?? []) {
      md.push(`- **${v.id}** (${v.impact}): ${v.help}`);
    }
    md.push('');
  }
}

if (journeyFails.length) {
  md.push('## Journey failures', '');
  for (const f of journeyFails) {
    md.push(`- **${f.persona}** — ${f.step}${f.error ? `: ${f.error}` : ''}`);
  }
  md.push('');
}

md.push('## Journey matrix results', '');

for (const [persona, steps] of byPersona([...journeyPasses, ...journeySkips, ...journeyFails])) {
  md.push(`### ${persona}`, '');
  for (const s of steps) {
    const icon = s.status === 'pass' ? '✓' : s.status === 'skip' ? '○' : '✗';
    md.push(`- ${icon} ${s.step}${s.error ? ` — _${s.error}_` : ''}`);
  }
  md.push('');
}

if (journeyPasses.length === 0 && journeyFails.length === 0) {
  md.push('_No journey results recorded. Run `npm run qa:journey-audit` or `npm run qa:journeys`._', '');
}

md.push('---', '', '*Automated by `npm run qa:audit:full`*');

writeFileSync(resolve(outDir, 'QA-AUDIT-REPORT.md'), md.join('\n'));
console.log(`Report: qa-reports/QA-AUDIT-REPORT.md (${overallStatus.toUpperCase()})`);
process.exit(overallStatus === 'pass' ? 0 : 1);
