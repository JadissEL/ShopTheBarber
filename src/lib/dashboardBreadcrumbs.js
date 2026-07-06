import { normalizePath } from '@/lib/appZone';
import { createPageUrl } from '@/utils';

/** Client primary sidebar — breadcrumbs redundant on these routes. */
export const CLIENT_PRIMARY_PAGES = new Set([
  'dashboard',
  'userbookings',
  'explore',
  'chat',
  'accountsettings',
]);

/** Provider primary sidebar — breadcrumbs redundant on these routes. */
export const PROVIDER_PRIMARY_PAGES = new Set([
  'providerdashboard',
  'providerbookings',
  'providermessages',
  'providersettings',
  'providerpayouts',
  'clientlist',
  'explore',
]);

/** Admin console home — breadcrumbs redundant here. */
export const ADMIN_PRIMARY_PAGES = new Set(['globalfinancials']);

/** Two-level module pages (root → module). Shared across client, provider, and admin shells. */
const MODULE_PAGES = {
  marketplace: 'Marketplace',
  referral: 'Refer & Earn',
  giftcards: 'Gift Cards',
  championshipleaderboard: 'Championships',
  careerhub: 'Career Hub',
  helpcenter: 'Help',
  shoppingbag: 'Shopping Bag',
  myorders: 'My Orders',
  groomingvault: 'Grooming Vault',
  clientwallet: 'Wallet',
  wishlist: 'Wishlist',
  favorites: 'Favorites',
  loyalty: 'Loyalty',
  notificationsettings: 'Notifications',
  supportchat: 'Support',
  blog: 'Blog',
  inspirationfeed: 'Inspiration',
  barbers: 'Barbers map',
  // Provider tools
  providermarketplaceproducts: 'Marketplace products',
  sellerorders: 'Orders to ship',
  providerblogarticles: 'Blog articles',
  myjobs: 'My jobs',
  tombolalive: 'Tombola',
  providerevents: 'Events',
  providerlanguageprograms: 'Language programs',
  networkownerdashboard: 'Network',
  setupguide: 'Setup guide',
  staffroster: 'Team roster',
  shopemployeemanagement: 'Staff HR',
  shopinventorymanagement: 'Inventory',
  shopexpensetracking: 'Expenses',
  shopbrandingmanagement: 'Branding',
  shopanalytics: 'Analytics',
  // Admin console
  adminproductanalytics: 'Data & analytics',
  adminproviderinsights: 'Provider insights',
  adminusermoderation: 'Users',
  admindisputes: 'Disputes',
  adminauditlogs: 'Audit logs',
  adminorders: 'Orders',
  admincontentmanagement: 'Content',
  adminmarketplacemanagement: 'Marketplace',
  adminjobsmanagement: 'Jobs',
  adminsupportinbox: 'Support inbox',
  admintombola: 'Tombola',
  adminevents: 'Events',
  adminlanguageprograms: 'Language programs',
  adminbackups: 'Backups',
  adminplatformhealth: 'Platform health',
  adminkeyswalkthrough: 'API keys',
  adminfeaturetoggles: 'Feature modules',
};

/** Three-level detail pages (Dashboard → parent → current). */
const CLIENT_DETAIL_PAGES = {
  barberprofile: { parent: 'Explore', parentLabel: 'Explore', label: 'Barber profile' },
  shopprofile: { parent: 'Explore', parentLabel: 'Explore', label: 'Shop profile' },
  productdetail: { parent: 'Marketplace', parentLabel: 'Marketplace', label: 'Product' },
  brandprofile: { parent: 'Marketplace', parentLabel: 'Marketplace', label: 'Brand' },
  jobdetail: { parent: 'CareerHub', parentLabel: 'Career Hub', label: 'Job details' },
  applytojob: { parent: 'CareerHub', parentLabel: 'Career Hub', label: 'Apply' },
  bookingflow: { parent: 'Explore', parentLabel: 'Explore', label: 'Book appointment' },
  guestbooking: { parent: 'UserBookings', parentLabel: 'Bookings', label: 'Guest booking' },
  review: { parent: 'UserBookings', parentLabel: 'Bookings', label: 'Review visit' },
  articledetail: { parent: 'Blog', parentLabel: 'Blog', label: 'Article' },
  checkout: { parent: 'ShoppingBag', parentLabel: 'Shopping Bag', label: 'Checkout' },
  ordertracking: { parent: 'MyOrders', parentLabel: 'My Orders', label: 'Order tracking' },
  confirmbooking: { parent: 'UserBookings', parentLabel: 'Bookings', label: 'Confirm booking' },
  applicantreview: { parent: 'MyJobs', parentLabel: 'My jobs', label: 'Applicants' },
  scheduleinterview: { parent: 'MyJobs', parentLabel: 'My jobs', label: 'Schedule interview' },
  blogarticleeditor: { parent: 'ProviderBlogArticles', parentLabel: 'Blog articles', label: 'Edit article' },
  marketplaceproducteditor: { parent: 'ProviderMarketplaceProducts', parentLabel: 'Marketplace products', label: 'Edit product' },
  createjob: { parent: 'MyJobs', parentLabel: 'My jobs', label: 'Post a job' },
  staffschedule: { parent: 'StaffRoster', parentLabel: 'Team roster', label: 'Schedules' },
  disputedetail: { parent: 'AdminDisputes', parentLabel: 'Disputes', label: 'Dispute detail' },
  usermoderationdetail: { parent: 'AdminUserModeration', parentLabel: 'Users', label: 'User detail' },
};

/**
 * @typedef {{ label: string, page?: string, href?: string, current?: boolean }} BreadcrumbItem
 */

function rootForRole(role) {
  if (role === 'admin') {
    return { page: 'GlobalFinancials', label: 'Admin' };
  }
  const isProvider = role === 'barber' || role === 'shop_owner' || role === 'provider';
  if (isProvider) {
    return { page: 'ProviderDashboard', label: 'Dashboard' };
  }
  return { page: 'Dashboard', label: 'Dashboard' };
}

function item(page, label, current = false) {
  return {
    label,
    page,
    href: createPageUrl(page),
    current,
  };
}

function currentItem(label) {
  return { label, current: true };
}

function pathSegment(pathname) {
  const pathOnly = normalizePath(pathname).split('?')[0];
  return pathOnly.replace(/^\//, '').split('/')[0] || '';
}

/**
 * @param {string} pathname
 * @param {{ role?: string | null, dynamicTitle?: string | null }} [options]
 * @returns {BreadcrumbItem[] | null}
 */
export function resolveDashboardBreadcrumbs(pathname, options = {}) {
  const { role = 'client', dynamicTitle = null } = options;
  const key = pathSegment(pathname).toLowerCase();

  if (!key) return null;

  const isAdmin = role === 'admin';
  const isProvider = role === 'barber' || role === 'shop_owner' || role === 'provider';
  const primaryPages = isAdmin
    ? ADMIN_PRIMARY_PAGES
    : isProvider
      ? PROVIDER_PRIMARY_PAGES
      : CLIENT_PRIMARY_PAGES;

  if (primaryPages.has(key)) return null;

  const root = rootForRole(role);

  const detail = CLIENT_DETAIL_PAGES[key];
  if (detail) {
    const currentLabel = dynamicTitle?.trim() || detail.label;
    return [
      item(root.page, root.label),
      item(detail.parent, detail.parentLabel),
      currentItem(currentLabel),
    ];
  }

  const moduleLabel = MODULE_PAGES[key];
  if (moduleLabel) {
    return [
      item(root.page, root.label),
      currentItem(moduleLabel),
    ];
  }

  return null;
}

/** Parent crumb for contextual back navigation inside the dashboard shell. */
export function getDashboardBackLink(pathname, options = {}) {
  const crumbs = resolveDashboardBreadcrumbs(pathname, options);
  if (!crumbs || crumbs.length < 2) return null;
  const parent = crumbs[crumbs.length - 2];
  if (!parent.href) return null;
  return { href: parent.href, label: parent.label };
}

export function shouldShowDashboardBreadcrumbs(pathname, options = {}) {
  const crumbs = resolveDashboardBreadcrumbs(pathname, options);
  return Array.isArray(crumbs) && crumbs.length > 0;
}
