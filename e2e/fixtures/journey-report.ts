import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export type JourneyStepResult = {
  persona: string;
  step: string;
  status: 'pass' | 'fail' | 'skip';
  error?: string;
  url?: string;
  at: string;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportDir = resolve(__dirname, '..', '..', 'qa-reports');
const reportPath = resolve(reportDir, 'journey-playwright.json');

const pending: JourneyStepResult[] = [];

export function recordJourneyStep(entry: Omit<JourneyStepResult, 'at'>): void {
  pending.push({ ...entry, at: new Date().toISOString() });
}

/** Merge this worker's steps into qa-reports/journey-playwright.json */
export function flushJourneyReport(): void {
  if (pending.length === 0) return;

  mkdirSync(reportDir, { recursive: true });

  let existing: JourneyStepResult[] = [];
  if (existsSync(reportPath)) {
    try {
      const parsed = JSON.parse(readFileSync(reportPath, 'utf8')) as { results?: JourneyStepResult[] };
      existing = parsed.results ?? [];
    } catch {
      existing = [];
    }
  }

  const key = (r: JourneyStepResult) => `${r.persona}|${r.step}`;
  const map = new Map<string, JourneyStepResult>();
  for (const r of existing) map.set(key(r), r);
  for (const r of pending) map.set(key(r), r);

  const results = [...map.values()].sort((a, b) => a.persona.localeCompare(b.persona) || a.step.localeCompare(b.step));

  writeFileSync(
    reportPath,
    JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2),
  );

  pending.length = 0;
}

export function resetJourneyReportFile(): void {
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(reportPath, JSON.stringify({ generatedAt: new Date().toISOString(), results: [] }, null, 2));
}
