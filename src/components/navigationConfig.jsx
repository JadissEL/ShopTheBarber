import {
  LayoutDashboard, Calendar,
  Settings, TrendingUp,
  Search, MessageSquare, Users
} from 'lucide-react';
import { isFeatureEnabled, getFeatureForPage } from '@/lib/featureRegistry';

/** Strip leading slash and map path to feature gate */
function pathToFeature(path) {
  const raw = path.replace(/^\//, '');
  if (!raw) return 'core';
  const pageKey = raw.charAt(0).toUpperCase() + raw.slice(1);
  return getFeatureForPage(pageKey);
}

function filterByFeature(items) {
  return items.filter((item) => isFeatureEnabled(pathToFeature(item.path)));
}

// Define the zones/contexts of the application
export const APP_ZONES = {
  PUBLIC: 'public',
  CLIENT: 'client',
  PROVIDER: 'provider',
  SELLER: 'seller',
  COMPANY: 'company',
  BLOGGER: 'blogger',
  ADMIN: 'admin',
  AUTH: 'auth',
};

// Define branding for each zone
export const ZONE_BRANDING = {
  [APP_ZONES.PUBLIC]: { name: 'ShopTheBarber', dark: true },
  [APP_ZONES.CLIENT]: { name: 'ShopTheBarber', dark: false },
  [APP_ZONES.PROVIDER]: { name: 'ShopTheBarber', dark: false },
  [APP_ZONES.SELLER]: { name: 'ShopTheBarber', dark: false },
  [APP_ZONES.COMPANY]: { name: 'ShopTheBarber', dark: false },
  [APP_ZONES.BLOGGER]: { name: 'ShopTheBarber', dark: false },
  [APP_ZONES.ADMIN]: { name: 'ShopTheBarber', dark: false },
  [APP_ZONES.AUTH]: { name: 'ShopTheBarber', dark: true },
};

// Navigation menus for each zone (filtered by feature modules at read time)
const NAV_MENUS_RAW = {
  [APP_ZONES.AUTH]: [
    { label: 'Sign In', path: 'SignIn' },
  ],

  [APP_ZONES.PUBLIC]: [
    { label: 'Home', path: 'Home' },
    { label: 'Find a Barber', path: 'Explore' },
    { label: 'Cities', path: '/cities' },
    { label: 'Barbers Map', path: 'Barbers' },
    { label: 'Blog', path: 'Blog' },
    { label: 'Refer & Earn', path: 'Referral' },
    { label: 'Inspiration', path: 'InspirationFeed' },
  ],
  [APP_ZONES.CLIENT]: [
    { label: 'Dashboard', path: 'Dashboard', icon: LayoutDashboard },
    { label: 'Explore', path: 'Explore', icon: Search },
    { label: 'Refer & Earn', path: 'Referral', icon: Users },
    { label: 'Messages', path: 'Chat', icon: MessageSquare },
  ],
  [APP_ZONES.PROVIDER]: [
    { label: 'Dashboard', path: 'ProviderDashboard', icon: LayoutDashboard },
    { label: 'Bookings', path: 'ProviderBookings', icon: Calendar },
    { label: 'Messages', path: 'ProviderMessages', icon: MessageSquare },
    { label: 'Clients', path: 'ClientList', icon: Users },
    { label: 'Settings', path: 'ProviderSettings', icon: Settings },
  ],
  [APP_ZONES.ADMIN]: [
    { label: 'Financials', path: 'GlobalFinancials', icon: TrendingUp },
  ]
};

export const NAV_MENUS = Object.fromEntries(
  Object.entries(NAV_MENUS_RAW).map(([zone, items]) => [zone, filterByFeature(items)]),
);

import { resolveZoneFromPath } from '@/lib/appZone';

/**
 * Resolve layout zone for a route.
 * Pass `{ isAuthenticated, role }` so signed-in users stay in the dashboard shell
 * on discovery modules (Explore, Marketplace, Help, etc.).
 */
export const getZoneFromPath = (pathname, options) => resolveZoneFromPath(pathname, options);