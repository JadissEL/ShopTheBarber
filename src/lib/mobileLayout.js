import { APP_ZONES } from '@/components/navigationConfig';
import { isProviderRole } from '@/lib/userRole';
/** Paths where the fixed bottom nav would clash with full-screen flows */
const HIDE_BOTTOM_NAV_PREFIXES = [
  '/bookingflow',
  '/checkout',
  '/confirmbooking',
  '/payment',
  '/paymentsuccess',
  '/signin',
  '/signup',
  '/login',
  '/register',
  '/careerhub',
];

export function shouldHideBottomNav(pathname) {
  const path = (pathname || '').toLowerCase();
  return HIDE_BOTTOM_NAV_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

/**
 * Client bottom tab bar — authenticated clients on mobile only (not providers/admins).
 */
export function shouldShowClientBottomNav({ pathname, isAuthenticated, isDesktop, role }) {
  if (isDesktop) return false;
  if (!isAuthenticated) return false;
  if (role && role !== 'client' && role !== 'guest') return false;
  return !shouldHideBottomNav(pathname);
}

/**
 * Provider bottom tab bar on public/mobile discovery pages.
 */
export function shouldShowProviderBottomNav({ pathname, isAuthenticated, isDesktop, role }) {
  if (isDesktop) return false;
  if (!isAuthenticated) return false;
  if (!isProviderRole(role)) return false;
  return !shouldHideBottomNav(pathname);
}

/**
 * Top GlobalNavigation duplicates bottom nav on mobile client/public pages.
 */
export function shouldHideGlobalNavOnMobile({
  pathname,
  zone,
  isAuthenticated,
  isDesktop,
  role,
}) {
  if (isDesktop || !isAuthenticated) return false;
  const isClientRole = !role || role === 'client' || role === 'guest';
  if (!isClientRole) return false;
  if (zone !== APP_ZONES.CLIENT && zone !== APP_ZONES.PUBLIC) return false;
  return !shouldHideBottomNav(pathname);
}
