/**
 * Design-system drift linter — catches forbidden Tailwind/class patterns in src/.
 * Writes qa-reports/design-lint.json and exits 1 on violations.
 *
 * Usage: node scripts/design-lint.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const srcDir = resolve(root, 'src');
const outDir = resolve(root, 'qa-reports');

/** @type {{ id: string, pattern: RegExp, message: string, severity: 'error' | 'warn' }[]} */
const RULES = [
  { id: 'no-gradient', pattern: /\bbg-gradient-/i, message: 'Use solid stb tokens — no bg-gradient-*', severity: 'error' },
  { id: 'no-linear-gradient', pattern: /linear-gradient\s*\(/i, message: 'No CSS linear-gradient in components', severity: 'error' },
  { id: 'no-radial-gradient', pattern: /radial-gradient\s*\(/i, message: 'No CSS radial-gradient in components', severity: 'error' },
  { id: 'no-shadow-xl', pattern: /\bshadow-xl\b/, message: 'Use shadow-elevation-* tokens', severity: 'error' },
  { id: 'no-shadow-2xl', pattern: /\bshadow-2xl\b/, message: 'Use shadow-elevation-* tokens', severity: 'error' },
  { id: 'no-font-black', pattern: /\bfont-black\b/, message: 'Use stb.uiHeading or font-semibold/bold', severity: 'error' },
  { id: 'no-rounded-2xl', pattern: /\brounded-2xl\b/, message: 'Use rounded-lg (8px system)', severity: 'warn' },
  { id: 'no-rounded-xl', pattern: /\brounded-xl\b/, message: 'Use rounded-lg (8px system)', severity: 'warn' },
  { id: 'legacy-orange-bg', pattern: /\bbg-orange-\d+/i, message: 'Use bg-warning/15 or bg-primary/10', severity: 'error' },
  { id: 'legacy-orange-text', pattern: /\btext-orange-\d+/i, message: 'Use text-primary or text-warning', severity: 'error' },
  { id: 'legacy-red-text', pattern: /\btext-red-\d+/i, message: 'Use text-destructive', severity: 'warn' },
  { id: 'legacy-green-bg', pattern: /\bbg-green-\d+/i, message: 'Use bg-success/10', severity: 'warn' },
  { id: 'legacy-amber', pattern: /\b(bg|text)-amber-\d+/i, message: 'Use semantic warning/success tokens', severity: 'warn' },
  {
    id: 'panel-navy-conflict',
    pattern: /stb-panel[\s\S]{0,120}bg-\[hsl\(var\(--navy\)\)\)|bg-\[hsl\(var\(--navy\)\)\][\s\S]{0,120}stb-panel/,
    message: 'Do not combine stb-panel (cream) with navy bg — use stb-surface-dark',
    severity: 'error',
  },
  {
    id: 'surface-hover-navy-conflict',
    pattern: /stb-surface-hover[\s\S]{0,120}bg-\[hsl\(var\(--navy\)\)\]|bg-\[hsl\(var\(--navy\)\)\][\s\S]{0,120}stb-surface-hover/,
    message: 'Do not combine stb-surface-hover with navy bg — use stb-surface-dark-hover',
    severity: 'error',
  },
];

const SKIP_DIRS = new Set(['node_modules', 'dist', '__tests__']);
const EXT = new Set(['.jsx', '.js', '.tsx', '.ts', '.css']);

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (SKIP_DIRS.has(name)) continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (EXT.has(name.slice(name.lastIndexOf('.')))) files.push(full);
  }
  return files;
}

const violations = [];

for (const file of walk(srcDir)) {
  const rel = relative(root, file).replace(/\\/g, '/');
  if (rel.includes('VisualEditAgent')) continue;
  const content = readFileSync(file, 'utf8');
  const lines = content.split('\n');

  for (const rule of RULES) {
    if (rule.id.includes('conflict')) {
      if (rule.pattern.test(content)) {
        const lineNum = lines.findIndex((line) => rule.pattern.test(line));
        violations.push({
          rule: rule.id,
          severity: rule.severity,
          file: rel,
          line: lineNum >= 0 ? lineNum + 1 : 1,
          message: rule.message,
          snippet: (lineNum >= 0 ? lines[lineNum] : content).trim().slice(0, 120),
        });
      }
      continue;
    }
    lines.forEach((line, i) => {
      if (rule.pattern.test(line)) {
        violations.push({
          rule: rule.id,
          severity: rule.severity,
          file: rel,
          line: i + 1,
          message: rule.message,
          snippet: line.trim().slice(0, 120),
        });
      }
    });
  }
}

const errors = violations.filter((v) => v.severity === 'error');
const warnings = violations.filter((v) => v.severity === 'warn');

mkdirSync(outDir, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  summary: { errors: errors.length, warnings: warnings.length, filesScanned: walk(srcDir).length },
  violations,
};
writeFileSync(resolve(outDir, 'design-lint.json'), JSON.stringify(report, null, 2));

console.log(`Design lint: ${errors.length} error(s), ${warnings.length} warning(s)`);
for (const v of violations.slice(0, 30)) {
  console.log(`  [${v.severity}] ${v.file}:${v.line} ${v.rule} — ${v.message}`);
}
if (violations.length > 30) console.log(`  … and ${violations.length - 30} more`);

process.exit(errors.length > 0 ? 1 : 0);
