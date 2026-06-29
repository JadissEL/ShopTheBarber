/**
 * Feature module registry, single source of truth for product surface area.
 *
 * Goals: reduce nav sprawl, gate optional verticals via env + runtime DB flags, keep deep links working
 * when a module is off (FeatureGuard redirects to Dashboard with context).
 *
 * Env: set VITE_FEATURE_<KEY>=false to hide a module at build time (default: enabled).
 * Runtime: admin toggles via /api/admin/feature-flags (merged in isFeatureEnabled when env allows).
 */

import { getFeatureFlagOverride } from '@/lib/featureFlagOverrides';
import { DISCOVERY_ROUTES } from '@/lib/discoveryRoutes';

/** @typedef {'core'|'marketplace'|'careers'|'content'|'engagement'|'communication'|'programs'|'shop_ops'|'admin'} FeatureId */

/** @type {Record<FeatureId, { id: FeatureId, label: string, description: string, alwaysOn?: boolean, envKey?: string, defaultEnabled?: boolean, pages: string[] }>} */
export const FEATURE_MODULES = {
  core: {
    id: 'core',
    label: 'Booking & discovery',
    description: 'Home, explore, book, manage appointments, account',
    alwaysOn: true,
    pages: [
      'Home', 'Explore', 'Barbers', 'BarberProfile', 'ShopProfile', 'BookingFlow',
      'ConfirmBooking', 'SelectServices', 'Dashboard', 'UserBookings', 'AccountSettings',
      'SignIn', 'SignUp', 'Auth', 'Onboarding', 'SetupGuide', 'SelectProviderType', 'HelpCenter', 'StatusPage',
      'About', 'Privacy', 'TermsOfService', 'ServicesPricing', 'ProviderTermsOfService',
      'NotificationSettings', 'Review', 'PaymentSuccess', 'PaymentError', 'Offline',
      'LegalDocuments', 'LaunchChecklist', 'CityLanding', 'CitiesDirectory', 'InviteLanding',
    ],
  },
  marketplace: {
    id: 'marketplace',
    label: 'Marketplace',
    description: 'Shop products, cart, checkout, orders, vault',
    envKey: 'VITE_FEATURE_MARKETPLACE',
    defaultEnabled: true,
    pages: [
      'Marketplace', 'ProductDetail', 'BrandProfile', 'ShoppingBag', 'Checkout',
      'Wishlist', 'MyOrders', 'OrderTracking', 'GroomingVault', 'ClientWallet',
      'ProviderMarketplaceProducts', 'MarketplaceProductEditor', 'SellerOrders',
      'AdminMarketplaceManagement', 'AdminOrders',
    ],
  },
  careers: {
    id: 'careers',
    label: 'Careers',
    description: 'Job board, applications, employer tools',
    envKey: 'VITE_FEATURE_CAREERS',
    defaultEnabled: true,
    pages: [
      'CareerHub', 'JobDetail', 'ApplyToJob', 'ProfessionalPortfolio', 'PortfolioCredentials',
      'CreateJob', 'MyJobs', 'ApplicantReview', 'ScheduleInterview', 'AdminJobsManagement',
    ],
  },
  content: {
    id: 'content',
    label: 'Content & inspiration',
    description: 'Blog, articles, inspiration feed',
    envKey: 'VITE_FEATURE_CONTENT',
    defaultEnabled: true,
    pages: [
      'Blog', 'ArticleDetail', 'InspirationFeed', 'ProviderBlogArticles', 'BlogArticleEditor',
      'AdminContentManagement',
    ],
  },
  engagement: {
    id: 'engagement',
    label: 'Engagement',
    description: 'Loyalty, referrals, gift cards, favorites, tombola',
    envKey: 'VITE_FEATURE_ENGAGEMENT',
    defaultEnabled: true,
    pages: [
      'Loyalty', 'Referral', 'GiftCards', 'Favorites', 'TombolaLive', 'AdminTombola', 'ChampionshipLeaderboard',
    ],
  },
  communication: {
    id: 'communication',
    label: 'Messaging',
    description: 'Client chat, provider inbox, support',
    envKey: 'VITE_FEATURE_MESSAGING',
    defaultEnabled: true,
    pages: [
      'Chat', 'ProviderMessages', 'SupportChat', 'AdminSupportInbox',
    ],
  },
  programs: {
    id: 'programs',
    label: 'Programs & events',
    description: 'Live events, language programs, provider showcases',
    envKey: 'VITE_FEATURE_PROGRAMS',
    defaultEnabled: true,
    pages: [
      'ProviderEvents', 'ProviderLanguagePrograms', 'AdminEvents', 'AdminLanguagePrograms',
    ],
  },
  shop_ops: {
    id: 'shop_ops',
    label: 'Shop operations',
    description: 'Staff, inventory, analytics (shop managers)',
    envKey: 'VITE_FEATURE_SHOP_OPS',
    defaultEnabled: true,
    pages: [
      'StaffRoster', 'StaffSchedule', 'ShopEmployeeManagement', 'ShopInventoryManagement',
      'ShopExpenseTracking', 'ShopBrandingManagement', 'ShopAnalytics', 'NetworkOwnerDashboard',
    ],
  },
  admin: {
    id: 'admin',
    label: 'Administration',
    description: 'Platform admin, analytics, moderation, backups',
    alwaysOn: true,
    pages: [
      'GlobalFinancials', 'AdminProductAnalytics', 'AdminProviderInsights', 'AdminUserModeration',
      'UserModerationDetail', 'AdminDisputes', 'DisputeDetail', 'AdminBackups', 'AdminAuditLogs',
      'AdminPlatformHealth', 'AdminFeatureToggles', 'AdminKeysWalkthrough',
    ],
  },
};

/** Reverse lookup: PascalCase page key feature id */
const pageToFeature = Object.entries(FEATURE_MODULES).reduce((acc, [featureId, mod]) => {
  for (const page of mod.pages) {
    acc[page] = /** @type {FeatureId} */ (featureId);
  }
  return acc;
}, /** @type {Record<string, FeatureId>} */ ({}));

/**
 * @param {FeatureId} featureId
 */
export function isFeatureEnabled(featureId) {
  const mod = FEATURE_MODULES[featureId];
  if (!mod) return false;
  if (mod.alwaysOn) return true;
  if (mod.envKey) {
    const raw = import.meta.env[mod.envKey];
    if (raw === 'false') return false;
  }
  const runtime = getFeatureFlagOverride(featureId);
  if (runtime !== undefined) return runtime;
  if (mod.envKey) {
    const raw = import.meta.env[mod.envKey];
    if (raw === 'true') return true;
  }
  return mod.defaultEnabled !== false;
}

/** True when build-time env permanently disables a module (runtime cannot re-enable). */
export function isFeatureEnvLocked(featureId) {
  const mod = FEATURE_MODULES[featureId];
  if (!mod?.envKey) return false;
  return import.meta.env[mod.envKey] === 'false';
}

/**
 * @param {string} pageName PascalCase page from pages.config / pathname segment
 */
export function getFeatureForPage(pageName) {
  if (!pageName) return 'core';
  const normalized = pageName.charAt(0).toUpperCase() + pageName.slice(1);
  return pageToFeature[normalized] ?? pageToFeature[pageName] ?? 'core';
}

/**
 * @param {string} pathname e.g. /Marketplace or /marketplace
 */
export function isPathFeatureEnabled(pathname) {
  const segment = (pathname || '').replace(/^\//, '').split('/')[0] || '';
  if (!segment) return true;
  const pageKey = segment.charAt(0).toUpperCase() + segment.slice(1);
  const featureId = getFeatureForPage(pageKey);
  return isFeatureEnabled(featureId);
}

/**
 * @param {FeatureId} featureId
 */
export function getEnabledModulePages(featureId) {
  const mod = FEATURE_MODULES[featureId];
  if (!mod || !isFeatureEnabled(featureId)) return [];
  return mod.pages;
}

/** All modules with enabled flag (for admin overview) */
export function listFeatureModules() {
  return Object.values(FEATURE_MODULES).map((mod) => ({
    id: mod.id,
    label: mod.label,
    description: mod.description,
    enabled: isFeatureEnabled(mod.id),
    alwaysOn: !!mod.alwaysOn,
    envLocked: isFeatureEnvLocked(mod.id),
    pageCount: mod.pages.length,
    envKey: mod.envKey ?? null,
  }));
}

/** Client desktop / mobile nav items */
export const CLIENT_NAV_ITEMS = [
  { feature: 'core', label: 'Dashboard', page: 'Dashboard', primary: true },
  { feature: 'core', label: 'Bookings', page: 'UserBookings', primary: true },
  { feature: 'marketplace', label: 'Marketplace', page: 'Marketplace', primary: true },
  { feature: 'marketplace', label: 'Shopping Bag', page: 'ShoppingBag', primary: false },
  { feature: 'marketplace', label: 'My Orders', page: 'MyOrders', primary: false },
  { feature: 'marketplace', label: 'Grooming Vault', page: 'GroomingVault', primary: false },
  { feature: 'careers', label: 'Career Hub', page: 'CareerHub', primary: false },
  { feature: 'communication', label: 'Chat', page: 'Chat', primary: false },
  { feature: 'core', label: 'Profile', page: 'AccountSettings', primary: false },
];

export const CLIENT_MORE_ITEMS = [
  { feature: 'core', label: 'Find a Barber', page: 'Explore' },
  { feature: 'engagement', label: 'Favorites', page: 'Favorites' },
  { feature: 'engagement', label: 'Loyalty', page: 'Loyalty' },
  { feature: 'engagement', label: 'Refer & Earn', page: 'Referral' },
  { feature: 'engagement', label: 'Gift Cards', page: 'GiftCards' },
  { feature: 'engagement', label: 'Championships', page: 'ChampionshipLeaderboard' },
  { feature: 'marketplace', label: 'Wallet', page: 'ClientWallet' },
  { feature: 'marketplace', label: 'Wishlist', page: 'Wishlist' },
  { feature: 'core', label: 'Notifications', page: 'NotificationSettings' },
  { feature: 'communication', label: 'Support', page: 'SupportChat' },
  { feature: 'core', label: 'Help', page: 'HelpCenter' },
];

/** @param {{ primaryOnly?: boolean }} [opts] */
export function getClientNavItems(opts = {}) {
  return CLIENT_NAV_ITEMS.filter((item) => {
    if (!isFeatureEnabled(item.feature)) return false;
    if (opts.primaryOnly && !item.primary) return false;
    return true;
  });
}

export function getClientMoreItems() {
  return CLIENT_MORE_ITEMS.filter((item) => isFeatureEnabled(item.feature));
}

/** Provider sidebar groups */
export const PROVIDER_NAV_GROUPS = [
  {
    title: 'Daily',
    items: [
      { feature: 'core', label: 'Dashboard', page: 'ProviderDashboard' },
      { feature: 'core', label: 'Bookings', page: 'ProviderBookings' },
      { feature: 'communication', label: 'Messages', page: 'ProviderMessages' },
      { feature: 'core', label: 'Payouts', page: 'ProviderPayouts' },
      { feature: 'core', label: 'Clients', page: 'ClientList' },
      { feature: 'core', label: 'Settings', page: 'ProviderSettings' },
    ],
  },
  {
    title: 'Grow',
    items: [
      { feature: 'marketplace', label: 'Marketplace', page: 'ProviderMarketplaceProducts' },
      { feature: 'marketplace', label: 'Orders to ship', page: 'SellerOrders' },
      { feature: 'content', label: 'Blog', page: 'ProviderBlogArticles' },
      { feature: 'careers', label: 'My Jobs', page: 'MyJobs' },
      { feature: 'careers', label: 'Career Hub', page: 'CareerHub' },
    ],
  },
  {
    title: 'Programs',
    items: [
      { feature: 'engagement', label: 'Tombola', page: 'TombolaLive' },
      { feature: 'programs', label: 'Events', page: 'ProviderEvents' },
      { feature: 'programs', label: 'Language programs', page: 'ProviderLanguagePrograms' },
      { feature: 'communication', label: 'Support', page: 'SupportChat' },
    ],
  },
  {
    title: 'Shop team',
    managerOnly: true,
    items: [
      { feature: 'shop_ops', label: 'Network', page: 'NetworkOwnerDashboard' },
      { feature: 'shop_ops', label: 'Team', page: 'StaffRoster' },
      { feature: 'shop_ops', label: 'Schedules', page: 'StaffSchedule' },
      { feature: 'shop_ops', label: 'Staff HR', page: 'ShopEmployeeManagement' },
      { feature: 'shop_ops', label: 'Inventory', page: 'ShopInventoryManagement' },
      { feature: 'shop_ops', label: 'Expenses', page: 'ShopExpenseTracking' },
      { feature: 'shop_ops', label: 'Branding', page: 'ShopBrandingManagement' },
      { feature: 'shop_ops', label: 'Analytics', page: 'ShopAnalytics' },
    ],
  },
];

export function getProviderNavGroups({ isManager = false } = {}) {
  return PROVIDER_NAV_GROUPS.map((group) => {
    if (group.managerOnly && !isManager) return null;
    const items = group.items.filter((item) => isFeatureEnabled(item.feature));
    if (items.length === 0) return null;
    return { title: group.title, items };
  }).filter(Boolean);
}

/** Admin sidebar groups */
export const ADMIN_NAV_GROUPS = [
  {
    title: 'Platform',
    items: [
      { feature: 'admin', label: 'Financials', page: 'GlobalFinancials' },
      { feature: 'admin', label: 'Data & Analytics', page: 'AdminProductAnalytics' },
      { feature: 'admin', label: 'Provider Insights', page: 'AdminProviderInsights' },
      { feature: 'admin', label: 'Users', page: 'AdminUserModeration' },
      { feature: 'admin', label: 'Disputes', page: 'AdminDisputes' },
      { feature: 'admin', label: 'Audit Logs', page: 'AdminAuditLogs' },
      { feature: 'marketplace', label: 'Orders', page: 'AdminOrders' },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { feature: 'content', label: 'Content', page: 'AdminContentManagement' },
      { feature: 'marketplace', label: 'Marketplace', page: 'AdminMarketplaceManagement' },
      { feature: 'careers', label: 'Jobs', page: 'AdminJobsManagement' },
    ],
  },
  {
    title: 'Programs',
    items: [
      { feature: 'communication', label: 'Support', page: 'AdminSupportInbox' },
      { feature: 'engagement', label: 'Tombola', page: 'AdminTombola' },
      { feature: 'programs', label: 'Events', page: 'AdminEvents' },
      { feature: 'programs', label: 'Language programs', page: 'AdminLanguagePrograms' },
    ],
  },
  {
    title: 'System',
    items: [
      { feature: 'admin', label: 'Backups', page: 'AdminBackups' },
      { feature: 'admin', label: 'Platform Health', page: 'AdminPlatformHealth' },
      { feature: 'admin', label: 'API keys', page: 'AdminKeysWalkthrough' },
      { feature: 'admin', label: 'Feature modules', page: 'AdminFeatureToggles' },
    ],
  },
];

export function getAdminNavGroups() {
  return ADMIN_NAV_GROUPS.map((group) => {
    const items = group.items.filter((item) => isFeatureEnabled(item.feature));
    if (items.length === 0) return null;
    return { title: group.title, items };
  }).filter(Boolean);
}

/** Public marketing nav, conversion-focused, minimal top-level items */
export const PUBLIC_NAV_ITEMS = [
  {
    feature: 'core',
    label: 'Find Barbers',
    children: [
      { label: 'By City', path: DISCOVERY_ROUTES.cities },
      { label: 'Mobile', path: DISCOVERY_ROUTES.mobile },
      { label: 'Top Rated', path: DISCOVERY_ROUTES.explore },
      { label: 'Rankings', path: 'ChampionshipLeaderboard' },
      { label: 'Deals', path: DISCOVERY_ROUTES.deals },
      { label: 'Gift Cards', path: 'GiftCards' },
    ],
  },
  { feature: 'marketplace', label: 'Shop Products', path: 'Marketplace' },
  { feature: 'core', label: 'Help Center', path: 'HelpCenter' },
];

/** Provider / B2B, separate dropdown, not on landing body */
export const PUBLIC_BUSINESS_NAV_ITEMS = [
  { label: 'Solo Barbers', path: '/for-barbers' },
  { label: 'Shops', path: '/for-shops' },
  { label: 'Networks', path: '/for-networks' },
  { label: 'Pricing', path: '/pricing' },
  { label: 'Onboarding', path: 'SelectProviderType' },
];

export function getPublicNavItems() {
  return PUBLIC_NAV_ITEMS.filter((item) => isFeatureEnabled(item.feature));
}

export function getPublicBusinessNavItems() {
  return PUBLIC_BUSINESS_NAV_ITEMS;
}

/** CareerHub active detection for client nav */
export const CAREER_PATH_SEGMENTS = [
  'careerhub', 'jobdetail', 'applytojob', 'professionalportfolio', 'portfoliocredentials',
  'myjobs', 'createjob', 'applicantreview', 'scheduleinterview',
];
