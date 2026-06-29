#!/usr/bin/env node
/**
 * Local secrets readiness check — never prints secret values.
 * Usage: node scripts/verify-secrets.mjs [--probe-production]
 *
 * Reads server/.env via dotenv if present. Optionally probes PRODUCTION_API_URL /api/admin/config-readiness (needs admin JWT — skip).
 * Prefer: npm run verify:secrets
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnvFile(relPath) {
    const p = resolve(root, relPath);
    if (!existsSync(p)) return {};
    const out = {};
    for (const line of readFileSync(p, 'utf8').split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const eq = t.indexOf('=');
        if (eq === -1) continue;
        const key = t.slice(0, eq).trim();
        let val = t.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        out[key] = val;
    }
    return out;
}

const serverEnv = loadEnvFile('server/.env');
const localEnv = loadEnvFile('.env.local');
const env = { ...localEnv, ...serverEnv, ...process.env };

function set(key) {
    const v = env[key];
    return typeof v === 'string' && v.trim().length > 0;
}

const CHECKS = [
    { key: 'DATABASE_URL', group: 'server', required: true },
    { key: 'CLERK_SECRET_KEY', group: 'server', required: true },
    { key: 'VITE_CLERK_PUBLISHABLE_KEY', group: 'frontend', required: true },
    { key: 'FRONTEND_URL', group: 'server', required: false },
    { key: 'VITE_API_URL', group: 'frontend', required: false },
    { key: 'STRIPE_API_KEY', group: 'server', required: false },
    { key: 'STRIPE_WEBHOOK_SECRET', group: 'server', required: false },
    { key: 'UPSTASH_REDIS_REST_URL', group: 'server', required: false },
    { key: 'UPSTASH_REDIS_REST_TOKEN', group: 'server', required: false },
    { key: 'MAPBOX_ACCESS_TOKEN', group: 'server', required: false },
    { key: 'GOOGLE_MAPS_API_KEY', group: 'server', required: false },
    { key: 'SENTRY_DSN', group: 'server', required: false },
    { key: 'VITE_SENTRY_DSN', group: 'frontend', required: false },
    { key: 'RESEND_API_KEY', group: 'server', required: false },
    { key: 'CRON_SECRET', group: 'ci', required: true },
    { key: 'PRODUCTION_API_URL', group: 'ci', required: true },
];

let missingRequired = 0;
console.log('\nShopTheBarber — secrets readiness (values hidden)\n');

for (const c of CHECKS) {
    const ok = set(c.key) || (c.key.startsWith('MAPBOX') && set('GOOGLE_MAPS_API_KEY'));
    const icon = ok ? '✓' : c.required ? '✗' : '○';
    console.log(`  ${icon}  [${c.group}] ${c.key}`);
    if (!ok && c.required) missingRequired += 1;
}

const probe = process.argv.includes('--probe-production');
const apiUrl = (env.PRODUCTION_API_URL || env.VITE_API_URL || '').replace(/\/$/, '');

if (probe && apiUrl) {
    console.log(`\nProbing ${apiUrl}/api/health/ready …`);
    try {
        const res = await fetch(`${apiUrl}/api/health/ready`, { signal: AbortSignal.timeout(20000) });
        const body = await res.json().catch(() => ({}));
        console.log(res.ok ? '  ✓  API readiness OK' : `  ✗  API readiness ${res.status}`);
        if (!res.ok) console.log('     ', JSON.stringify(body).slice(0, 200));
    } catch (e) {
        console.log('  ✗  Probe failed:', e instanceof Error ? e.message : e);
    }
} else if (probe) {
    console.log('\nSet PRODUCTION_API_URL or VITE_API_URL to probe production health.');
}

console.log('\nDocs: docs/KEYS_FINALIZATION_WALKTHROUGH.md');
console.log('Admin UI: /AdminKeysWalkthrough (after deploy)\n');

process.exit(missingRequired > 0 ? 1 : 0);
