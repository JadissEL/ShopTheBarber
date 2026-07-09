#!/usr/bin/env node
/**
 * Run authenticated journey specs with local API env forced (see scripts/qa-e2e-env.mjs).
 */
import { spawnSync } from 'node:child_process';
import { hydrateE2eEnv } from './qa-e2e-env.mjs';

hydrateE2eEnv();
process.env.QA_AUTH_JOURNEYS = '1';
process.env.E2E_FORCE_LOCAL_API = '1';
process.env.E2E_FRONTEND_URL = process.env.E2E_FRONTEND_URL || 'http://localhost:3000';
process.env.E2E_API_BASE_URL = process.env.E2E_API_BASE_URL || 'http://127.0.0.1:3001';

const extraArgs = process.argv.slice(2);
const testTargets = extraArgs.length > 0 ? extraArgs : ['e2e/journeys'];

const result = spawnSync(
  'npx',
  [
    'playwright',
    'test',
    ...testTargets,
    '--project=setup-auth',
    '--project=clerk-browser',
    '--workers=1',
  ],
  { stdio: 'inherit', shell: true, env: process.env },
);

process.exit(result.status ?? 1);
