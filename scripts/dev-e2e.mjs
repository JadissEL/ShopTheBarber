#!/usr/bin/env node
/**
 * Start Vite with local API target for authenticated E2E (overrides .env.local production URL).
 */
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const child = spawn('npx', ['vite', '--mode', 'e2e'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    VITE_API_URL: '',
    E2E_FORCE_LOCAL_API: '1',
  },
});

child.on('exit', (code) => process.exit(code ?? 0));
