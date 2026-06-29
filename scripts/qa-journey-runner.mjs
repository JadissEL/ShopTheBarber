/**
 * Step-by-step QA journey runner for all role types.
 * Signs in via @clerk/testing, walks each journey, reports failures.
 *
 * Usage: node scripts/qa-journey-runner.mjs [--role=client|barber|vip|owner|admin|all]
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
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
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = { ...loadEnv('server/.env'), ...loadEnv('.env.local'), ...process.env };
const frontend = env.E2E_FRONTEND_URL || 'http://localhost:3000';
const profiles = JSON.parse(readFileSync(resolve(__dirname, 'qa-profiles.json'), 'utf8'));

const roleFilter = process.argv.find((a) => a.startsWith('--role='))?.split('=')[1] || 'all';

if (!env.CLERK_SECRET_KEY) {
  console.error('Missing CLERK_SECRET_KEY');
  process.exit(1);
}

process.env.CLERK_SECRET_KEY = env.CLERK_SECRET_KEY;
process.env.CLERK_PUBLISHABLE_KEY = env.VITE_CLERK_PUBLISHABLE_KEY;
await clerkSetup();

const results = [];

function profile(role, extra) {
  const map = {
    client: profiles.find((p) => p.id === 'qa-c1'),
    barber: profiles.find((p) => p.id === 'qa-b1'),
    barber2: profiles.find((p) => p.id === 'qa-b2'),
    vip: profiles.find((p) => p.id === 'qa-vip'),
    owner: profiles.find((p) => p.id === 'qa-o1'),
    owner2: profiles.find((p) => p.id === 'qa-o2'),
    admin: profiles.find((p) => p.id === 'qa-admin'),
  };
  return map[role] ?? profiles.find((p) => p.id === extra);
}

async function waitClerk(page, timeout = 60_000) {
  await page.waitForFunction(
    () => typeof window.Clerk !== 'undefined' && window.Clerk.loaded && !!window.Clerk.user?.id,
    { timeout },
  );
}

async function waitAuthMe(page, timeout = 90_000) {
  await page.waitForFunction(
    async () => {
      const c = window.Clerk;
      if (!c?.session) return false;
      const token = await c.session.getToken();
      if (!token) return false;
      const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return false;
      const body = await res.json();
      return !!body?.id;
    },
    { timeout },
  );
}

async function signOut(page) {
  await page.goto(`${frontend}/`);
  await page.waitForFunction(() => typeof window.Clerk !== 'undefined' && window.Clerk.loaded, { timeout: 30_000 }).catch(() => {});
  await page.evaluate(async () => {
    if (window.Clerk?.session) await window.Clerk.signOut();
  }).catch(() => {});
  await page.waitForTimeout(1000);
}

async function signInAs(page, user) {
  await signOut(page);
  await page.goto(`${frontend}/SignIn`);
  await clerk.signIn({ page, emailAddress: user.email, password: user.password });
  await waitClerk(page);
  await waitAuthMe(page);
}

async function step(journey, name, fn) {
  try {
    await fn();
    results.push({ journey, step: name, status: 'PASS' });
    console.log(`  ✓ ${name}`);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push({ journey, step: name, status: 'FAIL', error: msg });
    console.error(`  ✗ ${name}: ${msg}`);
    return false;
  }
}

async function bodyHas(page, pattern) {
  const text = await page.evaluate(() => document.body.innerText);
  return pattern.test(text);
}

async function completeBookingToConfirmation(page, { barberId = 'gb1', shopId = 's1', serviceName = 'Signature Cut' } = {}) {
  await page.goto(`${frontend}/BookingFlow?barberId=${barberId}&shopId=${shopId}&step=services`);
  await page.waitForLoadState('networkidle');
  const heading = page.getByRole('heading', { name: /Book Appointment/i });
  await heading.waitFor({ state: 'visible', timeout: 30_000 });
  const serviceCard = page.getByText(serviceName, { exact: true }).first();
  await serviceCard.waitFor({ state: 'visible', timeout: 45_000 });
  await serviceCard.click();
  await page.getByRole('button', { name: /Continue/i }).click();
  await page.getByRole('heading', { name: /Select Date & Time/i }).waitFor({ state: 'visible', timeout: 20_000 });
  await page.getByRole('button', { name: /Book ASAP/i }).click();
  await page.getByRole('heading', { name: /Review & Confirm/i }).waitFor({ state: 'visible', timeout: 30_000 });
}

async function confirmBooking(page) {
  const payAtShop = page.getByRole('button', { name: /Pay at shop/i });
  if (await payAtShop.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await payAtShop.click();
    await page.waitForTimeout(500);
  }

  await page.waitForFunction(() => {
    const buttons = [...document.querySelectorAll('button')];
    const btn = buttons.find((el) => /Confirm Booking/i.test(el.textContent || ''));
    return btn && !btn.disabled;
  }, { timeout: 60_000 });

  const confirmBtn = page.getByRole('button', { name: /Confirm Booking/i });
  await confirmBtn.scrollIntoViewIfNeeded();
  await confirmBtn.click();

  await page.getByRole('heading', { name: /Booking (Confirmed|requested)!/i }).waitFor({ state: 'visible', timeout: 45_000 });
}

async function runProfileSmoke(page, p) {
  const key = p.id;
  console.log(`\n=== SMOKE: ${p.label} (${p.email}) ===`);
  await signInAs(page, p);

  const landing =
    p.role === 'admin'
      ? '/GlobalFinancials'
      : p.role === 'client'
        ? '/Dashboard'
        : '/ProviderDashboard';

  await step(key, `Sign-in → ${landing}`, async () => {
    await page.goto(`${frontend}${landing}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    if (/SignIn|login/i.test(page.url())) throw new Error('Redirected to sign-in');
    const text = await page.evaluate(() => document.body.innerText);
    if (/Something went wrong|ErrorBoundary|could not finish/i.test(text)) {
      throw new Error(`Page error: ${text.slice(0, 120)}`);
    }
  });
}

async function runClientJourney(page) {
  const user = profile('client');
  console.log(`\n=== CLIENT JOURNEY (${user.email}) ===`);
  await signInAs(page, user);

  await step('client', '1. Home loads after auth', async () => {
    await page.goto(`${frontend}/`);
    await page.waitForLoadState('networkidle');
    if (await bodyHas(page, /Account setup could not finish|Auth check failed/i)) {
      throw new Error('Auth sync error on home');
    }
  });

  await step('client', '2. Explore shows barbers', async () => {
    await page.goto(`${frontend}/Explore`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const text = await page.evaluate(() => document.body.innerText);
    if (/0 professionals|Couldn't load|Updating\.\.\./i.test(text) && !/barber|professional|rating/i.test(text)) {
      throw new Error(`Explore empty or stuck: ${text.slice(0, 200)}`);
    }
  });

  let barberId = null;
  await step('client', '3. Open first barber profile', async () => {
    await page.goto(`${frontend}/Explore`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const link = page.locator('a[href*="BarberProfile"], a[href*="barber"]').first();
    await link.waitFor({ state: 'visible', timeout: 15_000 });
    const href = await link.getAttribute('href');
    barberId = href?.match(/[?&]id=([^&]+)/)?.[1] ?? href?.match(/BarberProfile\/([^/?]+)/)?.[1];
    await link.click();
    await page.waitForLoadState('networkidle');
    if (!/Book|book|service/i.test(await page.evaluate(() => document.body.innerText))) {
      throw new Error('Barber profile missing book CTA');
    }
  });

  await step('client', '4. Full booking — services → datetime → confirm', async () => {
    await completeBookingToConfirmation(page, { barberId: 'gb1', shopId: 's1' });
  });

  await step('client', '5. Confirm booking succeeds', async () => {
    await confirmBooking(page);
  });

  await step('client', '6. Booking appears in My Bookings', async () => {
    await page.goto(`${frontend}/UserBookings`);
    await page.waitForLoadState('networkidle');
    await page.getByRole('heading', { level: 1, name: 'My Bookings' }).waitFor({ state: 'visible', timeout: 30_000 });
    const text = await page.evaluate(() => document.body.innerText);
    if (!/Nikos|booking|appointment|pending|confirmed/i.test(text)) {
      throw new Error(`My Bookings missing new booking: ${text.slice(0, 200)}`);
    }
  });

  await step('client', '7. Dashboard accessible', async () => {
    await page.goto(`${frontend}/Dashboard`);
    await page.waitForLoadState('networkidle');
    if (page.url().includes('SetupGuide') && await bodyHas(page, /could not finish|Auth check failed/i)) {
      throw new Error('Stuck on SetupGuide sync error');
    }
    const text = await page.evaluate(() => document.body.innerText);
    if (!/dashboard|booking|welcome|appointment/i.test(text)) {
      throw new Error(`Dashboard unexpected: ${text.slice(0, 150)}`);
    }
  });

  await step('client', '8. Favorites page loads', async () => {
    await page.goto(`${frontend}/Favorites`);
    await page.waitForLoadState('networkidle');
    const text = await page.evaluate(() => document.body.innerText);
    if (/Sign in for Favorites/i.test(text)) throw new Error('Not authenticated on Favorites');
    if (!/favorite|barber|shop|save/i.test(text)) {
      throw new Error(`Favorites unexpected: ${text.slice(0, 150)}`);
    }
  });

  await step('client', '9. Marketplace browse', async () => {
    await page.goto(`${frontend}/Marketplace`);
    await page.waitForLoadState('networkidle');
    const text = await page.evaluate(() => document.body.innerText);
    if (!/market|product|shop|brand/i.test(text)) {
      throw new Error(`Marketplace unexpected: ${text.slice(0, 150)}`);
    }
  });
}

async function runProviderJourney(page, roleKey, label) {
  const user = profile(roleKey);
  console.log(`\n=== ${label} (${user.email}) ===`);
  await signInAs(page, user);

  await step(roleKey, '1. Provider dashboard loads', async () => {
    await page.goto(`${frontend}/ProviderDashboard`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const url = page.url();
    if (/SignIn|login/i.test(url)) throw new Error('Redirected to sign-in');
    const text = await page.evaluate(() => document.body.innerText);
    if (/Access denied|not authorized/i.test(text)) throw new Error('Access denied');
    if (!/dashboard|booking|revenue|console|provider|welcome/i.test(text)) {
      throw new Error(`Provider dashboard unexpected: ${text.slice(0, 200)}`);
    }
  });

  await step(roleKey, '2. Provider bookings page', async () => {
    await page.goto(`${frontend}/ProviderBookings`);
    await page.waitForLoadState('networkidle');
    const text = await page.evaluate(() => document.body.innerText);
    if (/Something went wrong|ReferenceError/i.test(text)) throw new Error('ProviderBookings crashed');
    if (!/booking|upcoming|appointment/i.test(text)) {
      throw new Error(`ProviderBookings unexpected: ${text.slice(0, 150)}`);
    }
  });

  await step(roleKey, '3. Provider settings — services tab', async () => {
    await page.goto(`${frontend}/ProviderSettings?tab=services`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const text = await page.evaluate(() => document.body.innerText);
    if (/Something went wrong/i.test(text)) throw new Error('ProviderSettings crashed');
    if (!/service|settings|price|duration/i.test(text)) {
      throw new Error(`Services tab unexpected: ${text.slice(0, 200)}`);
    }
  });

  if (roleKey === 'vip') {
    await step(roleKey, '4. VIP group booking settings visible', async () => {
      await page.goto(`${frontend}/ProviderSettings?tab=general`);
      await page.waitForLoadState('networkidle');
      const text = await page.evaluate(() => document.body.innerText);
      if (!/group|VIP|party|mobile/i.test(text)) {
        throw new Error('VIP group booking panel not found');
      }
    });
  }

  if (roleKey === 'owner' || roleKey === 'owner2') {
    await step(roleKey, '4. Staff schedule accessible', async () => {
      await page.goto(`${frontend}/StaffSchedule`);
      await page.waitForLoadState('networkidle');
      const text = await page.evaluate(() => document.body.innerText);
      if (/Access denied|SignIn/i.test(page.url())) throw new Error('Schedule access denied');
      if (!/schedule|staff|shift|hour|availability/i.test(text)) {
        throw new Error(`StaffSchedule unexpected: ${text.slice(0, 200)}`);
      }
    });
  }
}

async function runAdminJourney(page) {
  const user = profile('admin');
  console.log(`\n=== ADMIN JOURNEY (${user.email}) ===`);
  await signInAs(page, user);

  await step('admin', '1. Global financials loads', async () => {
    await page.goto(`${frontend}/GlobalFinancials`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    if (/SignIn|login/i.test(page.url())) throw new Error('Redirected to sign-in');
    const text = await page.evaluate(() => document.body.innerText);
    if (/Access denied|not authorized/i.test(text)) throw new Error('Admin access denied');
    if (!/financial|revenue|promo|platform|admin/i.test(text)) {
      throw new Error(`GlobalFinancials unexpected: ${text.slice(0, 200)}`);
    }
  });

  await step('admin', '2. User moderation page', async () => {
    await page.goto(`${frontend}/AdminUserModeration`);
    await page.waitForLoadState('networkidle');
    const text = await page.evaluate(() => document.body.innerText);
    if (!/user|moderat|admin|role/i.test(text)) {
      throw new Error(`AdminUserModeration unexpected: ${text.slice(0, 200)}`);
    }
  });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

page.on('pageerror', (err) => console.error('  [pageerror]', err.message));

try {
  if (roleFilter === 'all' || roleFilter === 'client') await runClientJourney(page);

  if (roleFilter === 'all' || roleFilter === 'smoke') {
    for (const p of profiles) {
      if (p.id === 'qa-c1') continue; // covered by full client journey
      await runProfileSmoke(page, p);
    }
  }

  if (roleFilter === 'all' || roleFilter === 'barber') await runProviderJourney(page, 'barber', 'BARBER JOURNEY');
  if (roleFilter === 'all' || roleFilter === 'barber2') await runProviderJourney(page, 'barber2', 'BARBER 2 JOURNEY');
  if (roleFilter === 'all' || roleFilter === 'vip') await runProviderJourney(page, 'vip', 'VIP BARBER JOURNEY');
  if (roleFilter === 'all' || roleFilter === 'owner') await runProviderJourney(page, 'owner', 'SHOP OWNER JOURNEY');
  if (roleFilter === 'all' || roleFilter === 'owner2') await runProviderJourney(page, 'owner2', 'SHOP OWNER 2 JOURNEY');
  if (roleFilter === 'all' || roleFilter === 'admin') await runAdminJourney(page);
} finally {
  await browser.close();
}

const failed = results.filter((r) => r.status === 'FAIL');
const passed = results.filter((r) => r.status === 'PASS');

console.log('\n========== SUMMARY ==========');
console.log(`PASS: ${passed.length}  FAIL: ${failed.length}`);
for (const f of failed) console.log(`  FAIL [${f.journey}] ${f.step}: ${f.error}`);

writeFileSync(resolve(__dirname, 'qa-journey-results.json'), JSON.stringify({ passed, failed, at: new Date().toISOString() }, null, 2));

process.exit(failed.length > 0 ? 1 : 0);
