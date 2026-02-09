#!/usr/bin/env node
/**
 * Write Stripe keys from env to server/.stripe-keys.json (MCP-friendly).
 * Run from project root: STRIPE_API_KEY=sk_... STRIPE_WEBHOOK_SECRET=whsec_... node server/scripts/set-stripe-keys.js
 * Or from server/: STRIPE_API_KEY=sk_... STRIPE_PUBLISHABLE_KEY=pk_... STRIPE_WEBHOOK_SECRET=whsec_... npm run set-stripe-keys
 */
const fs = require('fs');
const path = require('path');

const serverDir = path.join(__dirname, '..');
const file = path.join(serverDir, '.stripe-keys.json');
const key = (process.env.STRIPE_API_KEY || '').trim();
const publishableKey = (process.env.STRIPE_PUBLISHABLE_KEY || '').trim();
const secret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();

if (!key && !publishableKey && !secret) {
  console.error('Set STRIPE_API_KEY and/or STRIPE_PUBLISHABLE_KEY and/or STRIPE_WEBHOOK_SECRET in the environment.');
  process.exit(1);
}

const data = {};
if (key) data.STRIPE_API_KEY = key;
if (publishableKey) data.STRIPE_PUBLISHABLE_KEY = publishableKey;
if (secret) data.STRIPE_WEBHOOK_SECRET = secret;
fs.writeFileSync(file, JSON.stringify(data, null, 2));
console.log('Wrote', file);
console.log('Backend will use these keys (env vars still override).');
