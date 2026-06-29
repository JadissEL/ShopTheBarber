#!/usr/bin/env node
/**
 * Set GitHub Actions secrets via API (values from env, never logged).
 * Usage:
 *   CRON_SECRET=... PRODUCTION_API_URL=... GITHUB_TOKEN=... node scripts/set-github-secrets.mjs
 */
import _sodium from 'libsodium-wrappers';
import { readFileSync } from 'node:fs';

const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const repo = 'JadissEL/ShopTheBarber';

const cronFromFile = process.env.CRON_SECRET_FILE
  ? readFileSync(process.env.CRON_SECRET_FILE, 'utf8').trim()
  : undefined;

const secrets = {
  CRON_SECRET: process.env.CRON_SECRET || cronFromFile,
  PRODUCTION_API_URL: process.env.PRODUCTION_API_URL || 'https://shopthebarber.onrender.com',
};

if (!token) {
  console.error('Missing GITHUB_TOKEN');
  process.exit(1);
}

async function getPublicKey() {
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/secrets/public-key`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) {
    console.error('public-key failed:', res.status, await res.text());
    process.exit(1);
  }
  return res.json();
}

async function encrypt(publicKey, secretValue) {
  const sodium = await _sodium;
  await sodium.ready;
  const messageBytes = Buffer.from(secretValue);
  const keyBytes = Buffer.from(publicKey, 'base64');
  const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);
  return Buffer.from(encryptedBytes).toString('base64');
}

async function setSecret(name, value, keyId, publicKey) {
  const res = await fetch(`https://api.github.com/repos/${repo}/actions/secrets/${name}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      encrypted_value: await encrypt(publicKey, value),
      key_id: keyId,
    }),
  });
  if (!res.ok) {
    console.error(`${name}: failed`, res.status, await res.text());
    return false;
  }
  console.log(`${name}: ok`);
  return true;
}

async function main() {
  const { key, key_id } = await getPublicKey();
  let ok = true;
  for (const [name, value] of Object.entries(secrets)) {
    if (!value?.trim()) {
      console.error(`${name}: missing (set env var)`);
      ok = false;
      continue;
    }
    const result = await setSecret(name, value.trim(), key_id, key);
    ok = ok && result;
  }
  process.exit(ok ? 0 : 1);
}

main();
