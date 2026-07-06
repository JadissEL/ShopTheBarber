import { APP_ZONES } from '@/components/navigationConfig';
import { isAdminRole, isProviderRole } from '@/lib/userRole';

/** Marketing / SEO pages — always use PublicLayout, even when signed in. */
export const MARKETING_ONLY_PATHS = [
  '/',
  '/home',
  '/about',
  '/legaldocuments',
  '/offline',
  '/selectprovidertype',
  '/chooseaccounttype',
  '/servicespricing',
  '/termsofservice',
  '/privacy',
  '/privacypolicy',
  '/providertermsofservice',
  '/cities',
  '/barbers-in',
  '/invite',
  '/pricing',
  '/for-barbers',
  '/for-shops',
  '/for-networks',
  '/pilot',
  '/partners',
  '/marketplace/seller-terms',
  '/marketplace/buyer-terms',
];

/**
 * Discovery and consumer modules — PublicLayout for guests,
 * authenticated app shell (client or provider) for signed-in users.
 */
export const AUTH_APP_MODULE_PATHS = [
  '/explore',
  '/barbers',
  '/blog',
  '/articledetail',
  '/inspirationfeed',
  '/giftcards',
  '/referral',
  '/marketplace',
  '/careerhub',
  '/helpcenter',
  '/championshipleaderboard',
  '/barberprofile',
  '/shopprofile',
  '/bookingflow',
  '/guestbooking',
  '/review',
  '/jobdetail',
  '/productdetail',
  '/brandprofile',
];

const PROVIDER_ZONE_PATHS = new Set([
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

export function normalizePath(pathname) {
  const raw = (pathname || '').toLowerCase();
  if (!raw || raw === '/') return '/';
  return raw.replace(/\/$/, '') || '/';
}

function matchesPathPrefix(path, prefix) {
  return path === prefix || path.startsWith(`${prefix}/`);
}

function matchesAnyPathPrefix(path, prefixes) {
  return prefixes.some((prefix) => matchesPathPrefix(path, prefix));
}

export function isMarketingOnlyPath(pathname) {
  const path = normalizePath(pathname);
  if (matchesPathPrefix(path, '/barbers-in') || matchesPathPrefix(path, '/invite')) {
    return true;
  }
  return matchesAnyPathPrefix(path, MARKETING_ONLY_PATHS);
}

export function isAuthAppModulePath(pathname) {
  const path = normalizePath(pathname);
  if (isMarketingOnlyPath(path)) return false;
  return matchesAnyPathPrefix(path, AUTH_APP_MODULE_PATHS);
}

function isAuthPath(path) {
  return (
    path === '/login' ||
    path === '/register' ||
    path === '/chooseaccounttype' ||
    path === '/signin' ||
    path === '/signup' ||
    path === '/auth' ||
    path === '/oauthcallback' ||
    path === '/auth/callback' ||
    path === '/sso-callback' ||
    path.startsWith('/sign-in') ||
    path.startsWith('/sign-up') ||
    path.endsWith('/sso-callback')
  );
}

function isAdminPath(path) {
  return (
    path === '/globalfinancials' ||
    path === '/admincontentmanagement' ||
    path === '/adminmarketplacemanagement' ||
    path === '/adminjobsmanagement' ||
    path === '/adminauditlogs' ||
    path === '/disputedetail' ||
    path === '/usermoderationdetail' ||
    path.startsWith('/admin')
  );
}

function isProviderPath(path) {
  return path.startsWith('/provider') || PROVIDER_ZONE_PATHS.has(path);
}

/**
 * @param {string} pathname
 * @param {{ isAuthenticated?: boolean, role?: string | null, accountType?: string | null }} [options]
 */
export function resolveZoneFromPath(pathname, options = {}) {
  const path = normalizePath(pathname);
  const { isAuthenticated = false, role = null, accountType = null } = options;

  if (isAuthPath(path)) return APP_ZONES.AUTH;
  if (isMarketingOnlyPath(path)) return APP_ZONES.PUBLIC;

  if (isAuthenticated) {
    if (isAdminRole(role)) return APP_ZONES.ADMIN;
    switch (accountType) {
      case 'solo_barber':
      case 'shop':
        return APP_ZONES.PROVIDER;
      case 'seller':
        return APP_ZONES.SELLER;
      case 'company':
        return APP_ZONES.COMPANY;
      case 'blogger':
        return APP_ZONES.BLOGGER;
      default:
        return APP_ZONES.CLIENT;
    }
  }

  // Guest: path-based zones for discovery vs tool routes (RouteGuard handles auth).
  if (isAuthAppModulePath(path)) return APP_ZONES.PUBLIC;
  if (isAdminPath(path)) return APP_ZONES.ADMIN;
  if (isProviderPath(path)) return APP_ZONES.PROVIDER;

  return APP_ZONES.CLIENT;
}

/**
 * @param {string} pathname
 * @param {{ isAuthenticated?: boolean, role?: string | null }} auth
 */
export function resolveLayoutContext(pathname, auth = {}) {
  const zone = resolveZoneFromPath(pathname, auth);
  return { zone };
}

export { isAdminRole };
