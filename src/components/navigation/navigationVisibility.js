/**
 * NAVIGATION VISIBILITY RULES
 * 
 * Centralized configuration for what navigation elements should appear
 * based on authentication state, user role, and page context.
 * 
 * This file is the SINGLE SOURCE OF TRUTH for navigation visibility logic.
 * UI components should consume these rules, not implement their own.
 */

import { APP_ZONES } from '@/components/navigationConfig';

/**
 * Navigation visibility categories
 */
export const NAV_ITEMS = {
    BACK_BUTTON: 'back_button',
    LOGO: 'logo',
    HOME: 'home',
    DASHBOARD: 'dashboard',
    EXPLORE: 'explore',
    NOTIFICATIONS: 'notifications',
    LOYALTY: 'loyalty',
    PROFILE: 'profile',
    SETTINGS: 'settings',
    BOOKINGS: 'bookings',
    SIGN_IN: 'sign_in',
    SIGN_UP: 'sign_up',
};

/**
 * Root paths where back button should be hidden
 */
const ROOT_PATHS = [
    '/',
    '/home',
    '/dashboard',
    '/providerdashboard',
    '/helpcenter',
    '/signin',
    '/signup',
    '/onboarding',
    '/selectprovidertype',
];

/**
 * Public/pre-auth paths (aligned with navigationConfig getZoneFromPath).
 * On these paths, unauthenticated users can view; authenticated nav items may be hidden where appropriate.
 */
const PUBLIC_PATHS = [
    '/',
    '/home',
    '/about',
    '/explore',
    '/marketplace',
    '/careerhub',
    '/helpcenter',
    '/signin',
    '/signup',
    '/selectprovidertype',
    '/registershop',
    '/servicespricing',
    '/termsofservice',
    '/privacypolicy',
    '/providertermsofservice',
    '/barberprofile',
    '/shopprofile',
    '/jobdetail',
    '/productdetail',
    '/brandprofile',
];

/**
 * Determine which navigation items should be visible
 * 
 * @param {Object} params
 * @param {string} params.pathname - Current route path (lowercase)
 * @param {boolean} params.isAuthenticated - User authentication state
 * @param {string} params.role - User role ('guest', 'client', 'barber', 'shop_owner', 'admin')
 * @param {string} params.zone - Current app zone from navigationConfig
 * @returns {Object} Visibility flags for each nav item
 */
export function getNavigationVisibility({ pathname, isAuthenticated, role, zone: _zone }) {
    const path = pathname.toLowerCase();
    const _isPublicPath = PUBLIC_PATHS.includes(path);
    const isRootPath = ROOT_PATHS.includes(path);
    const isAuthPage = path === '/signin' || path === '/signup';

    // Base visibility - always shown
    const visibility = {
        [NAV_ITEMS.LOGO]: true,
        [NAV_ITEMS.BACK_BUTTON]: !isRootPath,
        [NAV_ITEMS.HOME]: path !== '/' && path !== '/home',
        [NAV_ITEMS.SIGN_IN]: false,
        [NAV_ITEMS.SIGN_UP]: false,
        [NAV_ITEMS.NOTIFICATIONS]: false,
        [NAV_ITEMS.LOYALTY]: false,
        [NAV_ITEMS.PROFILE]: false,
        [NAV_ITEMS.SETTINGS]: false,
        [NAV_ITEMS.DASHBOARD]: false,
        [NAV_ITEMS.EXPLORE]: false,
        [NAV_ITEMS.BOOKINGS]: false,
    };

    // PUBLIC/PRE-AUTH CONTEXT: Show login/signup, hide authenticated items
    if (!isAuthenticated) {
        visibility[NAV_ITEMS.SIGN_IN] = !isAuthPage;
        visibility[NAV_ITEMS.SIGN_UP] = !isAuthPage;
        // Explicitly ensure authenticated items are hidden
        visibility[NAV_ITEMS.NOTIFICATIONS] = false;
        visibility[NAV_ITEMS.LOYALTY] = false;
        visibility[NAV_ITEMS.PROFILE] = false;
        visibility[NAV_ITEMS.SETTINGS] = false;
        visibility[NAV_ITEMS.DASHBOARD] = false;
        visibility[NAV_ITEMS.EXPLORE] = false;
        visibility[NAV_ITEMS.BOOKINGS] = false;
        return visibility;
    }

    // AUTHENTICATED CONTEXT: Role-based visibility

    // All authenticated users can see notifications and profile
    visibility[NAV_ITEMS.NOTIFICATIONS] = true;
    visibility[NAV_ITEMS.PROFILE] = !path.includes('profile');

    // Role-specific items
    switch (role) {
        case 'admin':
            visibility[NAV_ITEMS.DASHBOARD] = path !== '/globalfinancials';
            visibility[NAV_ITEMS.SETTINGS] = !path.includes('settings');
            break;

        case 'barber':
        case 'shop_owner':
            visibility[NAV_ITEMS.DASHBOARD] = path !== '/providerdashboard';
            visibility[NAV_ITEMS.BOOKINGS] = !path.includes('bookings');
            visibility[NAV_ITEMS.SETTINGS] = !path.includes('settings');
            break;

        case 'client':
        default:
            visibility[NAV_ITEMS.DASHBOARD] = path !== '/dashboard';
            visibility[NAV_ITEMS.EXPLORE] = !path.includes('explore') && !path.includes('marketplace');
            visibility[NAV_ITEMS.LOYALTY] = !path.includes('loyalty');
            break;
    }

    return visibility;
}

/**
 * Get the appropriate dashboard path for a user role
 * @param {string} role - User role
 * @returns {string} Page name for dashboard
 */
export function getDashboardPath(role) {
    switch (role) {
        case 'admin':
            return 'GlobalFinancials';
        case 'barber':
        case 'shop_owner':
        case 'provider':
            return 'ProviderDashboard';
        case 'client':
        default:
            return 'Dashboard';
    }
}

/**
 * Determine if the header should use dark styling
 * @param {string} zone - Current app zone
 * @param {string} pathname - Current path
 * @returns {boolean}
 */
export function shouldUseDarkHeader(zone, pathname) {
    const path = pathname.toLowerCase();

    // Always dark on these pages for visual consistency
    if (path === '/' || path === '/home') return true;
    if (path.startsWith('/barber')) return true; // Barber profile pages
    if (path.startsWith('/shop')) return true; // Shop profile pages

    // Zone-based decision
    return zone === APP_ZONES.PROVIDER || zone === APP_ZONES.ADMIN;
}
