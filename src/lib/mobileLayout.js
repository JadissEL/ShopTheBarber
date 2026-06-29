import { APP_ZONES } from '@/components/navigationConfig';

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
 * Client bottom tab bar, authenticated mobile users only.
 */
export function shouldShowClientBottomNav({ pathname, isAuthenticated, isDesktop }) {
  if (isDesktop) return false;
  if (!isAuthenticated) return false;
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
