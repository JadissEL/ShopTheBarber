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
  ADMIN: 'admin',
  AUTH: 'auth'
};

// Define branding for each zone
export const ZONE_BRANDING = {
  [APP_ZONES.PUBLIC]: { name: 'ShopTheBarber', dark: true },
  [APP_ZONES.CLIENT]: { name: 'ShopTheBarber', dark: false },
  [APP_ZONES.PROVIDER]: { name: 'ShopTheBarber', dark: false },
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

// Helper to determine the current zone based on path
export const getZoneFromPath = (pathname) => {
  const path = pathname.toLowerCase();

  // PUBLIC ZONE: Landing, marketing, discovery, and view-only pages (no auth required to view)
  const publicPaths = [
    '/',
    '/home',
    '/explore',
    '/barbers',
    '/blog',
    '/articledetail',
    '/inspirationfeed',
    '/giftcards',
    '/referral',
    '/legaldocuments',
    '/offline',
    '/marketplace',
    '/careerhub',
    '/about',
    '/helpcenter',
    '/selectprovidertype',
    '/servicespricing',
    '/termsofservice',
    '/privacy',
    '/privacypolicy',
    '/championshipleaderboard',
    '/providertermsofservice',
    '/barberprofile', // view barber profile (book/appointment may require auth)
    '/shopprofile', // view shop profile
    '/bookingflow', // 3-tap guest book (Cutly-style)
    '/guestbooking', // guest booking status via magic link
    '/review', // post-visit review via magic link (guest) or bookingId (auth)
    '/jobdetail', // view job listing (apply requires auth)
    '/productdetail', // view product (add to cart requires auth)
    '/brandprofile', // view brand
    '/cities',
    '/barbers-in',
    '/invite',
  ];
  if (publicPaths.some(p => path === p || path.startsWith(`${p  }/`))) {
    return APP_ZONES.PUBLIC;
  }
  if (path.startsWith('/barbers-in/') || path.startsWith('/invite/')) {
    return APP_ZONES.PUBLIC;
  }

  // AUTH ZONE: Authentication flows
  if (
    path === '/login' ||
    path === '/register' ||
    path === '/signin' ||
    path === '/signup' ||
    path === '/auth' ||
    path === '/oauthcallback' ||
    path === '/auth/callback' ||
    path === '/sso-callback' ||
    path.startsWith('/sign-in') ||
    path.startsWith('/sign-up') ||
    path.endsWith('/sso-callback')
  ) return APP_ZONES.AUTH;

  // ADMIN ZONE: Platform management
  if (
    path === '/globalfinancials' ||
    path === '/admincontentmanagement' ||
    path === '/adminmarketplacemanagement' ||
    path === '/adminjobsmanagement' ||
    path === '/adminauditlogs' ||
    path === '/disputedetail' ||
    path === '/usermoderationdetail' ||
    path.startsWith('/admin')
  ) return APP_ZONES.ADMIN;

  const providerZonePaths = new Set([
    '/clientlist',
    '/networkownerdashboard',
    '/sellerorders',
    '/tombolalive',
    '/providerevents',
    '/providerlanguageprograms',
    '/shopinventorymanagement',
    '/shopexpensetracking',
    '/shopbrandingmanagement',
    '/shopanalytics',
    '/staffroster',
    '/staffschedule',
    '/shopemployeemanagement',
    '/myjobs',
    '/createjob',
    '/applicantreview',
    '/scheduleinterview',
    '/blogarticleeditor',
    '/marketplaceproducteditor',
  ]);

  // PROVIDER ZONE: Business operations
  if (
    path.startsWith('/provider') ||
    providerZonePaths.has(path)
  ) return APP_ZONES.PROVIDER;

  // CLIENT ZONE: Authenticated customer-facing (default for all others)
  if (path === '/setupguide') return APP_ZONES.CLIENT;

  // Includes: Dashboard, Wallet, LoyaltyProgram, EditProfile,
  // Notifications, InspirationFeed, ProductRecommendations, Referral,
  // Messages, BarberProfile, BookingDetails, BookingFlow,
  // BookingSuccess, SelectService, Payment, NoInternet, NotFound
  return APP_ZONES.CLIENT;
};