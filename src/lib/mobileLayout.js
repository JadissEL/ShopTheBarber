import { APP_ZONES } from '@/components/navigationConfig';
import { isAdminRole, isClientRole, isProviderRole } from '@/lib/userRole';
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
 * Provider bottom tab bar — authenticated providers on mobile in provider shell or public discovery.
 */
export function shouldShowProviderBottomNav({ pathname, isAuthenticated, isDesktop, role }) {
  if (isDesktop) return false;
  if (!isAuthenticated) return false;
  if (!isProviderRole(role)) return false;
  return !shouldHideBottomNav(pathname);
}

/**
 * Admin bottom tab bar — authenticated admins on mobile in admin shell.
 */
export function shouldShowAdminBottomNav({ pathname, isAuthenticated, isDesktop, role }) {
  if (isDesktop) return false;
  if (!isAuthenticated) return false;
  if (!isAdminRole(role)) return false;
  return !shouldHideBottomNav(pathname);
}

/**
 * Hide duplicate top nav when the role-specific bottom tab bar is active.
 */
export function shouldHideGlobalNavOnMobile({
  pathname,
  zone,
  isAuthenticated,
  isDesktop,
  role,
}) {
  if (isDesktop || !isAuthenticated) return false;
  if (shouldHideBottomNav(pathname)) return false;

  if (isClientRole(role) && (zone === APP_ZONES.CLIENT || zone === APP_ZONES.PUBLIC)) {
    return true;
  }
  if (isProviderRole(role) && zone === APP_ZONES.PROVIDER) {
    return true;
  }
  if (isAdminRole(role) && zone === APP_ZONES.ADMIN) {
    return true;
  }
  return false;
}
