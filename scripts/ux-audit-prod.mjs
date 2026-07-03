/**
 * Production UX audit — hits live Vercel frontend (no local servers).
 */
process.env.E2E_START_SERVERS = '0';
process.env.E2E_FRONTEND_URL =
  process.env.E2E_FRONTEND_URL || 'https://shop-the-barber.vercel.app';

await import('./ux-audit.mjs');
