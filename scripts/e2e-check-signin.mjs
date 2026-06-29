import { chromium } from '@playwright/test';

const browser = await chromium.launch({ headless: true });
const page = await (await browser.newContext()).newPage();
for (const path of ['/login', '/register', '/SignIn']) {
  await page.goto(`http://localhost:3000${path}`, { waitUntil: 'networkidle', timeout: 90000 });
  const snap = await page.evaluate(() => ({
    rootLen: document.getElementById('root')?.innerHTML?.length ?? 0,
    url: location.href,
    hasClerk: !!document.querySelector('[class*="cl-"]'),
    text: document.body.innerText.slice(0, 100).replace(/\s+/g, ' '),
  }));
  console.log(path, snap);
}
await browser.close();
