/**
 * CI / Render database bootstrap (Prisma + Neon PostgreSQL only).
 * Generates the Prisma Client and applies pending migrations non-interactively.
 * Requires DATABASE_URL (Neon connection string).
 */

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '..');

function run(label, argv) {
    const display = `${label}: ${argv.join(' ')}`;
    console.log(`[build-database] ${display}`);
    const r = spawnSync(argv[0], argv.slice(1), {
        cwd: serverRoot,
        stdio: 'inherit',
        shell: process.platform === 'win32',
        env: process.env,
    });
    if (r.error) throw r.error;
    const code = typeof r.status === 'number' ? r.status : 1;
    if (code !== 0) {
        console.error(`[build-database] failed (${code}): ${display}`);
        process.exit(code);
    }
}

if (!process.env.DATABASE_URL) {
    console.error('[build-database] DATABASE_URL is required (Neon PostgreSQL). Aborting.');
    process.exit(1);
}

run('Prisma generate', ['npx', 'prisma', 'generate']);
run('Prisma migrate deploy', ['npx', 'prisma', 'migrate', 'deploy']);
console.log('[build-database] Done.');
