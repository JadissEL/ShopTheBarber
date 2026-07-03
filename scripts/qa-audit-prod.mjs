#!/usr/bin/env node
/**
 * Production read-only QA audit:
 * - Design lint + axe scans against local `vite preview` (latest build)
 * - Guest journeys against live production URL
 */
import { spawn, spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const previewUrl = process.env.E2E_PREVIEW_URL || 'http://127.0.0.1:4173';
const prodUrl = process.env.E2E_JOURNEY_FRONTEND_URL || process.env.E2E_FRONTEND_URL || 'https://shop-the-barber.vercel.app';

function waitForUrl(url, timeoutMs = 90_000) {
  const start = Date.now();
  return new Promise((resolvePromise, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
        if (res.ok || res.status < 500) {
          resolvePromise(undefined);
          return;
        }
      } catch {
        /* retry */
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Preview not ready: ${url}`));
        return;
      }
      setTimeout(tick, 750);
    };
    tick();
  });
}

const preview = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173'], {
  cwd: root,
  stdio: 'ignore',
  shell: true,
});

let exitCode = 1;
try {
  await waitForUrl(previewUrl);

  const auditEnv = {
    ...process.env,
    QA_AUDIT_PROD: '1',
    E2E_START_SERVERS: '0',
    JOURNEY_READONLY: '1',
    E2E_FRONTEND_URL: previewUrl,
    E2E_JOURNEY_FRONTEND_URL: prodUrl,
    E2E_PREVIEW_URL: previewUrl,
  };

  const r = spawnSync('node', ['scripts/qa-audit.mjs'], {
    cwd: root,
    stdio: 'inherit',
    env: auditEnv,
    shell: true,
  });
  exitCode = r.status ?? 1;
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  exitCode = 1;
} finally {
  if (!preview.killed) preview.kill('SIGTERM');
}

process.exit(exitCode);
