#!/usr/bin/env node
/**
 * Push QA secrets to GitHub Actions (one-time / idempotent).
 * Reads server/.env + qa-profiles.json — never prints secret values.
 *
 * Requires GITHUB_TOKEN with repo admin (or actions secrets write).
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sodium from 'libsodium-wrappers';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const REPO = 'JadissEL/ShopTheBarber';
const TOKEN = process.env.GITHUB_TOKEN;

function loadEnv(relPath) {
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

async function encryptSecret(publicKey, secretValue) {
  await sodium.ready;
  const binkey = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);
  const binsec = sodium.from_string(secretValue);
  const encBytes = sodium.crypto_box_seal(binsec, binkey);
  return sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);
}

async function setSecret(name, value) {
  if (!value) {
    console.log(`skip ${name} (empty)`);
    return false;
  }
  const keyRes = await fetch(`https://api.github.com/repos/${REPO}/actions/secrets/public-key`, {
    headers: { Authorization: `Bearer ${TOKEN}`, Accept: 'application/vnd.github+json' },
  });
  if (!keyRes.ok) throw new Error(`public-key: ${keyRes.status} ${await keyRes.text()}`);
  const { key, key_id } = await keyRes.json();
  const encrypted = await encryptSecret(key, value);
  const putRes = await fetch(`https://api.github.com/repos/${REPO}/actions/secrets/${name}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ encrypted_value: encrypted, key_id }),
  });
  if (!putRes.ok) throw new Error(`set ${name}: ${putRes.status} ${await putRes.text()}`);
  console.log(`set ${name}`);
  return true;
}

async function main() {
  if (!TOKEN) {
    console.error('GITHUB_TOKEN required');
    process.exit(1);
  }

  const env = { ...loadEnv('server/.env'), ...loadEnv('.env.local') };
  const profiles = JSON.parse(readFileSync(resolve(__dirname, 'qa-profiles.json'), 'utf8'));
  const byId = (id) => profiles.find((p) => p.id === id)?.email;

  const secrets = {
    CLERK_SECRET_KEY: env.CLERK_SECRET_KEY,
    CLERK_PUBLISHABLE_KEY: env.CLERK_PUBLISHABLE_KEY || env.VITE_CLERK_PUBLISHABLE_KEY,
    E2E_CLERK_USER_EMAIL: byId('qa-c1'),
    E2E_CLERK_PROVIDER_EMAIL: byId('qa-b1'),
    E2E_CLERK_ADMIN_EMAIL: byId('qa-admin'),
  };

  let ok = 0;
  for (const [name, value] of Object.entries(secrets)) {
    if (await setSecret(name, value)) ok += 1;
  }
  console.log(`Done: ${ok} secret(s) updated`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
