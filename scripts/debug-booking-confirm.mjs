import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { clerkSetup, clerk } from '@clerk/testing/playwright';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
function loadEnv(relPath) {
  const p = resolve(root, relPath);
  if (!existsSync(p)) return {};
  const out = {};
  for (const line of readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
  }
  return out;
}
const env = { ...loadEnv('server/.env'), ...loadEnv('.env.local'), ...process.env };
process.env.CLERK_SECRET_KEY = env.CLERK_SECRET_KEY;
process.env.CLERK_PUBLISHABLE_KEY = env.VITE_CLERK_PUBLISHABLE_KEY;
await clerkSetup();

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.goto('http://localhost:3000/SignIn');
await clerk.signIn({ page, emailAddress: 'qa.marcus.client@shopthebarber.com', password: 'Stb!Client2026a' });
await page.waitForFunction(async () => {
  const c = window.Clerk;
  if (!c?.session) return false;
  const token = await c.session.getToken();
  if (!token) return false;
  const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  return res.ok && (await res.json())?.id;
}, { timeout: 90000 });

await page.goto('http://localhost:3000/BookingFlow?barberId=gb1&shopId=s1&step=services');
await page.getByRole('heading', { name: /Book Appointment/i }).waitFor({ timeout: 30000 });
await page.getByText('Signature Cut', { exact: true }).first().click();
await page.getByRole('button', { name: /Continue/i }).click();
await page.getByRole('heading', { name: /Select Date & Time/i }).waitFor({ timeout: 20000 });
await page.getByRole('button', { name: /Book ASAP/i }).click();
await page.getByRole('heading', { name: /Review & Confirm/i }).waitFor({ timeout: 30000 });
await page.waitForTimeout(3000);

const debug = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button')].map((b) => ({
    text: (b.textContent || '').trim().slice(0, 80),
    disabled: b.disabled,
  }));
  return { url: location.href, body: document.body.innerText.slice(0, 2500), buttons };
});
console.log(JSON.stringify(debug, null, 2));
await browser.close();
