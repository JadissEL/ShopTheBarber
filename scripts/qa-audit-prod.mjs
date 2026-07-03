#!/usr/bin/env node
/** Production read-only full QA audit wrapper. */
process.env.QA_AUDIT_PROD = '1';
process.env.E2E_START_SERVERS = '0';
process.env.JOURNEY_READONLY = '1';
process.env.E2E_FRONTEND_URL = process.env.E2E_FRONTEND_URL ?? 'https://shop-the-barber.vercel.app';

import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const r = spawnSync('node', ['scripts/qa-audit.mjs'], { cwd: root, stdio: 'inherit', env: process.env, shell: true });
process.exit(r.status ?? 1);
