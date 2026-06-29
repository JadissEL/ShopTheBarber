#!/usr/bin/env node
/**
 * Push env vars from render.secrets.local.env to Render (merge).
 * Requires RENDER_API_KEY and file at repo root (gitignored).
 * Never logs secret values.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const envPath = resolve(root, 'render.secrets.local.env');
const serviceId = process.env.RENDER_SERVICE_ID || 'srv-d6kedpma2pns738sr430';
const apiKey = process.env.RENDER_API_KEY;

if (!apiKey) {
  console.error('Set RENDER_API_KEY (Render dashboard → Account → API Keys).');
  process.exit(1);
}
if (!existsSync(envPath)) {
  console.error(`Missing ${envPath} — copy from render.secrets.local.env.example`);
  process.exit(1);
}

const envVars = [];
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq === -1) continue;
  const key = t.slice(0, eq).trim();
  let val = t.slice(eq + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  if (!val) continue;
  envVars.push({ key, value: val });
}

if (!envVars.length) {
  console.error('No non-empty keys in render.secrets.local.env');
  process.exit(1);
}

for (const { key, value } of envVars) {
  const res = await fetch(`https://api.render.com/v1/services/${serviceId}/env-vars`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ envVar: { key, value } }),
  });
  if (!res.ok) {
    console.error(`Failed to set ${key}:`, res.status, await res.text());
    process.exit(1);
  }
  console.log(`  ✓  ${key}`);
}

console.log(`\nUpdated ${envVars.length} env var(s). Redeploy starts automatically.`);
console.log('Verify: GET /api/health/ready → geocoding.production_ready');
