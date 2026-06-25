/**
 * Render / CI database bootstrap without interactive prompts.
 *
 * - **PostgreSQL** (`DATABASE_URL` set): default `drizzle-kit migrate` (additive).
 * - **PostgreSQL bootstrap** (`DRIZZLE_BOOTSTRAP=push`): runs `drizzle-kit push` once to sync **full schema** — set on Render/onboarding only (can be destructive; remove after first green deploy).
 *   Otherwise baseline tables must already exist.
 * - **SQLite** (no `DATABASE_URL`): remove local `sovereign.sqlite`, then `drizzle-kit push` (existing Render free-tier flow).
 */

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '..');

function run(label, argv, opts = {}) {
    const display = `${label}: ${argv.join(' ')}`;
    console.log(`[build-database] ${display}`);
    const r = spawnSync(argv[0], argv.slice(1), {
        cwd: serverRoot,
        stdio: 'inherit',
        shell: process.platform === 'win32',
        env: process.env,
        ...opts,
    });
    if (r.error) throw r.error;
    const code = typeof r.status === 'number' ? r.status : 1;
    if (code !== 0) {
        console.error(`[build-database] failed (${code}): ${display}`);
        process.exit(code);
    }
}

const isPostgres = !!process.env.DATABASE_URL;
const usePrisma =
    isPostgres &&
    (process.env.USE_PRISMA_MIGRATE === 'true' ||
        (process.env.DATABASE_URL || '').includes('neon.tech'));

if (isPostgres) {
    if (usePrisma) {
        run('Prisma generate', ['npx', 'prisma', 'generate']);
        run('Prisma migrate deploy', ['npx', 'prisma', 'migrate', 'deploy']);
    } else if (process.env.DRIZZLE_BOOTSTRAP === 'push') {
        run('PostgreSQL bootstrap (drizzle-kit push)', ['npx', 'drizzle-kit', 'push']);
    } else {
        run('PostgreSQL migrate', ['npx', 'drizzle-kit', 'migrate']);
    }
} else {
    const sqlitePath = path.join(serverRoot, 'sovereign.sqlite');
    try {
        fs.unlinkSync(sqlitePath);
    } catch (e) {
        if (e && e.code !== 'ENOENT') throw e;
    }
    run('SQLite push', ['npx', 'drizzle-kit', 'push']);
}
