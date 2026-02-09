#!/usr/bin/env node
/**
 * List routes and their zone for journey/UX audit.
 * Run from repo root: node .cursor/skills/journey-ux-auditor/scripts/list-routes-by-zone.js
 * Output: JSON with { zone: [ pageKeys ] } for PUBLIC, AUTH, CLIENT, PROVIDER, ADMIN.
 */
const path = require('path');
const fs = require('fs');

const navConfigPath = path.join(__dirname, '../../../src/components/navigationConfig.jsx');
const pagesConfigPath = path.join(__dirname, '../../../src/pages.config.js');

// Zone path rules (must match getZoneFromPath in navigationConfig.jsx)
const PUBLIC_PATHS = ['/', '/home', '/explore', '/about', '/selectprovidertype', '/registershop', '/termsofservice', '/privacypolicy', '/providertermsofservice'];
const AUTH_PATHS = ['/signin', '/signup'];
const ADMIN_PATHS = ['/globalfinancials', '/admin'];
const PROVIDER_PATHS = ['/providerdashboard', '/providerbookings', '/providersettings', '/providerpayouts', '/providertermsofservice', '/shop'];

function getZoneFromPath(pathname) {
  const p = pathname.toLowerCase();
  if (PUBLIC_PATHS.some(pp => p === pp || p.startsWith(pp + '/'))) return 'PUBLIC';
  if (AUTH_PATHS.includes(p)) return 'AUTH';
  if (ADMIN_PATHS.some(pp => p === pp || p.startsWith(pp))) return 'ADMIN';
  if (PROVIDER_PATHS.some(pp => p === pp || p.startsWith(pp))) return 'PROVIDER';
  return 'CLIENT';
}

let pageKeys = [];
try {
  const pagesContent = fs.readFileSync(pagesConfigPath, 'utf8');
  const match = pagesContent.match(/export const PAGES = \{([^}]+)\}/s);
  if (match) {
    pageKeys = match[1].split(',').map(line => line.trim().replace(/^"(.*)":.*/, '$1').replace(/"/g, '')).filter(Boolean);
  }
} catch (_) {
  pageKeys = ['Home', 'Explore', 'SignIn', 'Dashboard', 'ProviderDashboard', 'BookingFlow', 'UserBookings', 'ProviderBookings', 'AccountSettings', 'ProviderSettings', 'AdminBackups', 'AdminDisputes', 'GlobalFinancials'];
}

const byZone = { PUBLIC: [], AUTH: [], CLIENT: [], PROVIDER: [], ADMIN: [] };
pageKeys.forEach(key => {
  const routePath = '/' + key;
  const zone = getZoneFromPath(routePath);
  if (byZone[zone]) byZone[zone].push(key);
});

console.log(JSON.stringify(byZone, null, 2));
