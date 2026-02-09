import {
  LayoutDashboard, Calendar,
  Settings, TrendingUp,
  Search, MessageSquare, Users
} from 'lucide-react';

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

// Navigation menus for each zone
export const NAV_MENUS = {
  [APP_ZONES.AUTH]: [
    { label: 'Sign In', path: 'SignIn' },
  ],

  [APP_ZONES.PUBLIC]: [
    { label: 'Home', path: 'Home' },
    { label: 'Find a Barber', path: 'Explore' },
  ],
  [APP_ZONES.CLIENT]: [
    { label: 'Dashboard', path: 'Dashboard', icon: LayoutDashboard },
    { label: 'Explore', path: 'Explore', icon: Search },
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

// Helper to determine the current zone based on path
export const getZoneFromPath = (pathname) => {
  const path = pathname.toLowerCase();

  // PUBLIC ZONE: Landing, marketing, discovery, and view-only pages (no auth required to view)
  const publicPaths = [
    '/',
    '/home',
    '/explore',
    '/marketplace',
    '/careerhub',
    '/about',
    '/helpcenter',
    '/selectprovidertype',
    '/registershop',
    '/servicespricing',
    '/termsofservice',
    '/privacypolicy',
    '/providertermsofservice',
    '/barberprofile',   // view barber profile (book/appointment may require auth)
    '/shopprofile',     // view shop profile
    '/jobdetail',       // view job listing (apply requires auth)
    '/productdetail',   // view product (add to cart requires auth)
    '/brandprofile',    // view brand
  ];
  if (publicPaths.some(p => path === p || path.startsWith(p + '/'))) {
    return APP_ZONES.PUBLIC;
  }

  // AUTH ZONE: Authentication flows
  if (path === '/signin' || path === '/signup' || path === '/auth') return APP_ZONES.AUTH;

  // ADMIN ZONE: Platform management
  if (path === '/globalfinancials' || path.startsWith('/admin')) return APP_ZONES.ADMIN;

  // PROVIDER ZONE: Business operations
  if (
    path === '/providerdashboard' ||
    path === '/providerbookings' ||
    path === '/providermessages' ||
    path === '/providerpayouts' ||
    path === '/providersettings' ||
    path === '/providertermsofservice' ||
    path.startsWith('/shop/') ||
    path === '/clientlist'
  ) return APP_ZONES.PROVIDER;

  // CLIENT ZONE: Authenticated customer-facing (default for all others)
  // Includes: Dashboard, Wallet, LoyaltyProgram, EditProfile,
  // Notifications, InspirationFeed, ProductRecommendations, Referral,
  // Messages, BarberProfile, BookingDetails, BookingFlow,
  // BookingSuccess, SelectService, Payment, NoInternet, NotFound
  return APP_ZONES.CLIENT;
};