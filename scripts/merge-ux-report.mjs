/**
 * Merge design-lint + Playwright UX audit into a single Markdown + JSON report.
 *
 * Usage: node scripts/merge-ux-report.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const outDir = resolve(root, 'qa-reports');

function readJson(name) {
  const p = resolve(outDir, name);
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

const designLint = readJson('design-lint.json');
const playwrightDesktop = readJson('ux-audit-playwright.json');
const playwrightMobile = readJson('ux-audit-mobile-playwright.json');
const playwrightResults = [
  ...(playwrightDesktop?.results ?? []),
  ...(playwrightMobile?.results ?? []),
];

function dedupeA11yResults(results) {
  const seen = new Set();
  const out = [];
  for (const r of results) {
    if (r.type !== 'a11y') {
      out.push(r);
      continue;
    }
    const key = `${r.route}|${r.viewport ?? 'desktop'}|${r.violationCount}|${(r.violations ?? []).map((v) => v.id).join(',')}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

const dedupedResults = dedupeA11yResults(playwrightResults);
const playwright = playwrightDesktop || playwrightMobile
  ? { generatedAt: new Date().toISOString(), results: dedupedResults }
  : null;

const a11yFails =
  playwright?.results?.filter((r) => r.type === 'a11y' && r.violationCount > 0) ?? [];
const designErrors = designLint?.violations?.filter((v) => v.severity === 'error') ?? [];
const designWarnings = designLint?.violations?.filter((v) => v.severity === 'warn') ?? [];

const summary = {
  generatedAt: new Date().toISOString(),
  designLint: {
    errors: designErrors.length,
    warnings: designWarnings.length,
  },
  a11y: {
    routesScanned: playwright?.results?.filter((r) => r.type === 'a11y').length ?? 0,
    routesFailed: a11yFails.length,
  },
  status: designErrors.length === 0 && a11yFails.length === 0 ? 'pass' : 'fail',
};

mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'ux-audit-summary.json'), JSON.stringify({ summary, designLint, playwright }, null, 2));

const md = [
  '# ShopTheBarber UX Audit Report',
  '',
  `Generated: ${summary.generatedAt}`,
  '',
  `**Overall:** ${summary.status === 'pass' ? 'PASS' : 'FAIL'}`,
  '',
  '## Design lint',
  '',
  `- Errors: ${summary.designLint.errors}`,
  `- Warnings: ${summary.designLint.warnings}`,
  '',
];

if (designErrors.length) {
  md.push('### Design errors', '');
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
} else {
  md.push('## Accessibility', '', 'No serious/critical axe violations on scanned routes.', '');
}

if (designWarnings.length) {
  md.push('## Design warnings (non-blocking)', '');
  for (const v of designWarnings.slice(0, 20)) {
    md.push(`- \`${v.file}:${v.line}\` ${v.rule}`);
  }
  md.push('');
}

md.push('---', '', '*Automated by `npm run qa:audit`*');

writeFileSync(resolve(outDir, 'UX-AUDIT-REPORT.md'), md.join('\n'));
console.log(`Report: qa-reports/UX-AUDIT-REPORT.md (${summary.status.toUpperCase()})`);
process.exit(summary.status === 'pass' ? 0 : 1);
