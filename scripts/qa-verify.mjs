/**
 * RS2 — npm run qa:verify
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hydrateE2eEnv, root } from './qa-e2e-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

hydrateE2eEnv();

const result = spawnSync('npx', ['tsx', 'src/db/verifyQaProfiles.ts'], {
  cwd: resolve(root, 'server'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env },
});

process.exit(result.status ?? 1);
