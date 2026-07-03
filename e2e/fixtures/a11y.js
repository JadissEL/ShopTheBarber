/* global process */
import AxeBuilder from '@axe-core/playwright';

/** When set, axe violations fail the test run (CI gate). Default: record-only. */
export const A11Y_STRICT = typeof process !== 'undefined' && process.env?.QA_AUDIT_STRICT === '1';

/** Impact levels we report / optionally fail on */
const FAIL_IMPACTS = new Set(['serious', 'critical']);

/**
 * Run axe on the current page; return structured violations (does not throw).
 * @param {import('@playwright/test').Page} page
 * @param {{ label?: string, include?: string[], exclude?: string[] }} opts
 */
export async function scanA11y(page, opts = {}) {
  let builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']);

  if (opts.include?.length) builder = builder.include(opts.include);
  if (opts.exclude?.length) builder = builder.exclude(opts.exclude);

  const results = await builder.analyze();

  const violations = results.violations
    .filter((v) => FAIL_IMPACTS.has(v.impact))
    .map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.slice(0, 5).map((n) => ({
        html: n.html?.slice(0, 200),
        failureSummary: n.failureSummary,
        target: n.target?.slice(0, 3),
      })),
    }));

  return {
    label: opts.label ?? page.url(),
    url: page.url(),
    violationCount: violations.length,
    violations,
  };
}

/**
 * Assert zero serious/critical axe violations; attach details on failure.
 */
export async function expectNoA11yViolations(page, opts = {}) {
  const scan = await scanA11y(page, opts);
  if (scan.violationCount > 0) {
    const detail = JSON.stringify(scan.violations, null, 2);
    throw new Error(`A11y: ${scan.violationCount} serious/critical issue(s) on ${scan.label}\n${detail}`);
  }
  return scan;
}
