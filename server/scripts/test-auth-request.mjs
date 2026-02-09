#!/usr/bin/env node
/**
 * Test auth endpoints (backend must be running on port 3001).
 * Usage: node scripts/test-auth-request.mjs [register|login]
 */
const base = 'http://localhost:3001/api/auth';
const step = process.argv[2] || 'register';

const registerPayload = {
  email: 'debug-' + Date.now() + '@test.local',
  password: 'password123',
  full_name: 'Debug User',
  role: 'client'
};

const loginPayload = {
  email: registerPayload.email,
  password: registerPayload.password
};

async function run() {
  if (step === 'register') {
    console.log('POST', base + '/register', JSON.stringify(registerPayload, null, 2));
    const res = await fetch(base + '/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerPayload)
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { error: text }; }
    console.log('Status:', res.status, 'Content-Type:', res.headers.get('content-type'));
    console.log('Body:', JSON.stringify(data, null, 2));
    if (!res.ok) process.exit(1);
    return;
  }

  if (step === 'login') {
    console.log('POST', base + '/login', JSON.stringify(loginPayload, null, 2));
    const res = await fetch(base + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginPayload)
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { error: text }; }
    console.log('Status:', res.status, 'Content-Type:', res.headers.get('content-type'));
    console.log('Body:', JSON.stringify(data, null, 2));
    if (!res.ok) process.exit(1);
    return;
  }

  console.log('Usage: node scripts/test-auth-request.mjs [register|login]');
}

run().catch((e) => {
  console.error('Request failed:', e.message);
  process.exit(1);
});
