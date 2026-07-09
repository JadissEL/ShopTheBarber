/**
 * Provision QA test profiles in Clerk (login credentials) and sync DB rows.
 *
 * Usage:
 *   node scripts/provision-qa-profiles.mjs           # Clerk + DB upsert
 *   node scripts/provision-qa-profiles.mjs --db-only # DB only (no Clerk API)
 */
import { readFileSync, existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { createClerkClient } from '@clerk/backend';
import { hydrateE2eEnv, root } from './qa-e2e-env.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const dbOnly = process.argv.includes('--db-only');
const env = hydrateE2eEnv();
const secretKey = env.CLERK_SECRET_KEY || process.env.CLERK_SECRET_KEY;

const profiles = JSON.parse(readFileSync(resolve(__dirname, 'qa-profiles.json'), 'utf8'));

async function seedDbOnly() {
  const { spawnSync } = await import('node:child_process');
  const result = spawnSync('npx', ['tsx', 'src/db/seedQaProfilesOnly.ts'], {
    cwd: resolve(root, 'server'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, ...env },
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

async function provisionClerk() {
  if (!secretKey) {
    console.error('Missing CLERK_SECRET_KEY in server/.env');
    process.exit(1);
  }

  const clerk = createClerkClient({ secretKey });
  const results = [];

  for (const p of profiles) {
    const existing = await clerk.users.getUserList({ emailAddress: [p.email], limit: 1 });
    let user = existing.data[0];

    if (user) {
      user = await clerk.users.updateUser(user.id, {
        password: p.password,
        publicMetadata: { role: p.role },
        firstName: p.full_name.split(' ')[0],
        lastName: p.full_name.split(' ').slice(1).join(' ') || undefined,
      });
      results.push({ email: p.email, action: 'updated', clerkId: user.id, role: p.role });
    } else {
      user = await clerk.users.createUser({
        emailAddress: [p.email],
        password: p.password,
        skipPasswordChecks: true,
        publicMetadata: { role: p.role },
        firstName: p.full_name.split(' ')[0],
        lastName: p.full_name.split(' ').slice(1).join(' ') || undefined,
      });
      results.push({ email: p.email, action: 'created', clerkId: user.id, role: p.role });
    }
  }

  return results;
}

async function syncClerkIdsToDb(clerkResults) {
  const { spawnSync } = await import('node:child_process');
  const tmpFile = join(tmpdir(), `stb-clerk-sync-${Date.now()}.json`);
  writeFileSync(
    tmpFile,
    JSON.stringify(clerkResults.map((r) => ({ email: r.email, clerkId: r.clerkId }))),
  );
  try {
    const result = spawnSync('npx', ['tsx', 'src/db/syncQaClerkIds.ts', tmpFile], {
      cwd: resolve(root, 'server'),
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, ...env },
    });
    if (result.status !== 0) process.exit(result.status ?? 1);
  } finally {
    try {
      unlinkSync(tmpFile);
    } catch {
      /* ignore */
    }
  }
}

console.log('\n=== ShopTheBarber QA Profile Provisioning ===\n');
console.log(`Profiles: ${profiles.length}\n`);

await seedDbOnly();

if (!dbOnly) {
  console.log('\nProvisioning Clerk accounts…\n');
  const clerkResults = await provisionClerk();
  for (const r of clerkResults) {
    console.log(`  [${r.action}] ${r.email} (${r.role}) → ${r.clerkId}`);
  }
  console.log('\nSyncing clerk_user_id to database…\n');
  await syncClerkIdsToDb(clerkResults);
  console.log('  Done.\n');
}

console.log('\n--- Login credentials ---\n');
for (const p of profiles) {
  console.log(`${p.label ?? p.role}`);
  console.log(`  Email:    ${p.email}`);
  console.log(`  Password: ${p.password}`);
  console.log(`  Role:     ${p.role}${p.is_vip ? ' (VIP barber)' : ''}`);
  console.log('');
}

console.log('Sign in at: http://localhost:3000/SignIn\n');
console.log('Done.\n');
