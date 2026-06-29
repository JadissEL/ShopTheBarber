import { readFileSync } from 'node:fs';
import { createClerkClient, verifyToken } from '@clerk/backend';

const env = Object.fromEntries(
  readFileSync('server/.env', 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
const stamp = Date.now();
const email = `apitest.${stamp}@example.com`;
const user = await clerk.users.createUser({
  emailAddress: [email],
  password: `Test!${stamp}`,
  skipPasswordChecks: true,
});
const session = await clerk.sessions.createSession({ userId: user.id });
const tokenRes = await clerk.sessions.getToken(session.id);
const token = tokenRes.jwt;

const verified = await verifyToken(token, { secretKey: env.CLERK_SECRET_KEY }).catch((e) => {
  console.error('verifyToken failed:', e.message);
  return null;
});
console.log('verified sub:', verified && typeof verified === 'object' ? verified.sub : null);

const res = await fetch('http://localhost:3001/api/auth/me', {
  headers: { Authorization: `Bearer ${token}` },
});
const body = await res.text();
console.log('auth/me status', res.status, body.slice(0, 300));

await clerk.users.deleteUser(user.id);
