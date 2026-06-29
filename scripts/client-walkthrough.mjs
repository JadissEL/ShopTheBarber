/**
 * Client walkthrough — snapshot key public/client pages (mobile viewport).
 * Auth pages use /login and /register (not legacy /SignIn).
 */
import { chromium } from '@playwright/test';

const base = 'http://localhost:3000';
const paths = [
  '/',
  '/Explore',
  '/Barbers',
  '/About',
  '/login',
  '/register',
  '/BookingFlow',
  '/Marketplace',
  '/CareerHub',
  '/Referral',
  '/HelpCenter',
  '/cities',
  '/SetupGuide',
  '/Dashboard',
  '/UserBookings',
  '/ShoppingBag',
  '/Favorites',
];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } }); // mobile client
const page = await ctx.newPage();
const results = [];

for (const path of paths) {
  try {
    await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(2500);
    const snap = await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      rootLen: document.getElementById('root')?.innerHTML?.length ?? 0,
      text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 400),
      hasMain: !!document.getElementById('main-content'),
      h1: document.querySelector('h1')?.innerText?.slice(0, 80) ?? null,
    }));
    results.push({ path, ok: snap.rootLen > 100, ...snap });
  } catch (e) {
    results.push({ path, ok: false, error: e.message });
  }
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
