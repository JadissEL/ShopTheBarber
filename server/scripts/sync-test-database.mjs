/**
 * Repairs the isolated Neon test branch when migrate deploy is blocked by failed
 * or partially-applied migrations (schema drift). Safe to re-run.
 *
 * Usage (from server/):
 *   npm run sync:test-db
 *
 * Requires TEST_DATABASE_URL in .env (falls back to DATABASE_URL).
 */

import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(serverRoot, '.env') });

const testUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
if (!testUrl) {
    console.error('[sync-test-database] TEST_DATABASE_URL or DATABASE_URL is required.');
    process.exit(1);
}

const env = { ...process.env, DATABASE_URL: testUrl };
const MAX_DEPLOY_ATTEMPTS = 60;

function runCapture(label, argv) {
    console.log(`[sync-test-database] ${label}`);
    const r = spawnSync(argv[0], argv.slice(1), {
        cwd: serverRoot,
        encoding: 'utf8',
        shell: process.platform === 'win32',
        env,
    });
    const stdout = r.stdout ?? '';
    const stderr = r.stderr ?? '';
    const code = typeof r.status === 'number' ? r.status : 1;
    return { code, stdout, stderr, combined: `${stdout}\n${stderr}` };
}

function run(label, argv) {
    const { code } = runCapture(label, argv);
    if (code !== 0) {
        console.error(`[sync-test-database] failed (${code}): ${label}`);
        process.exit(code);
    }
}

function extractMigrationName(output) {
    const applied = output.match(/Applying migration `([^`]+)`/);
    if (applied) return applied[1];
    const failed = output.match(/Migration name: ([^\s\r\n]+)/);
    if (failed) return failed[1];
    const blocked = output.match(/The `([^`]+)` migration started at/);
    if (blocked) return blocked[1];
    return null;
}

function resolveMigration(name, action) {
    runCapture(`Resolve ${name} (${action})`, [
        'npx',
        'prisma',
        'migrate',
        'resolve',
        `--${action}`,
        name,
    ]);
}

// Known drift: migration failed mid-way but objects already exist.
const DRIFTED_MIGRATIONS = ['20260626300000_provider_fee_wallet'];

for (const name of DRIFTED_MIGRATIONS) {
    const migrationSql = path.join(serverRoot, 'prisma', 'migrations', name, 'migration.sql');
    runCapture(`Apply ${name} SQL idempotently`, [
        'npx',
        'prisma',
        'db',
        'execute',
        '--schema',
        'prisma/schema.prisma',
        '--file',
        migrationSql,
    ]);
    resolveMigration(name, 'applied');
}

for (let attempt = 1; attempt <= MAX_DEPLOY_ATTEMPTS; attempt += 1) {
    const { code, combined } = runCapture(`Deploy migrations (attempt ${attempt})`, [
        'npx',
        'prisma',
        'migrate',
        'deploy',
    ]);

    if (code === 0) break;

    const migrationName = extractMigrationName(combined);
    const alreadyExists =
        /already exists/i.test(combined) ||
        /duplicate column/i.test(combined) ||
        /duplicate key value/i.test(combined);
    const blockedByFailed = /P3009/i.test(combined);

    if (!migrationName) {
        console.error('[sync-test-database] migrate deploy failed without a migration name:\n', combined);
        process.exit(code);
    }

    if (blockedByFailed || alreadyExists) {
        console.log(`[sync-test-database] ${migrationName} blocked or partial — marking as applied.`);
        resolveMigration(migrationName, 'applied');
        continue;
    }

    // Failed migration record blocks deploy — roll back then retry SQL + deploy.
    if (/P3018/i.test(combined)) {
        console.log(`[sync-test-database] Recovering failed migration ${migrationName}.`);
        resolveMigration(migrationName, 'rolled-back');
        const migrationSql = path.join(
            serverRoot,
            'prisma',
            'migrations',
            migrationName,
            'migration.sql'
        );
        runCapture(`Re-apply ${migrationName} SQL`, [
            'npx',
            'prisma',
            'db',
            'execute',
            '--schema',
            'prisma/schema.prisma',
            '--file',
            migrationSql,
        ]);
        resolveMigration(migrationName, 'applied');
        continue;
    }

    console.error('[sync-test-database] Unrecoverable migrate deploy error:\n', combined);
    process.exit(code);
}

run('Verify schema', ['node', 'scripts/verify-production-schema.mjs']);
console.log('[sync-test-database] Test database sync complete.');
