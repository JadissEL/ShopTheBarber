/**
 * Shared role & account-type helpers — routing, zones, and permissions.
 */
import {
  dashboardPageForAccountType,
  isBookingProviderAccountType,
  isProviderShellAccountType,
  accountTypeFromRole,
  platformRoleForAccountType,
} from '@/lib/accountType';

export const PROVIDER_ROLES = new Set(['barber', 'shop_owner', 'provider']);

export const BUSINESS_ACCOUNT_TYPES = new Set([
  'solo_barber',
  'shop',
  'seller',
  'company',
  'blogger',
]);

/** @param {string | null | undefined} role */
export function isAdminRole(role) {
  return role === 'admin';
}

/** @param {string | null | undefined} role */
export function isProviderRole(role) {
  return PROVIDER_ROLES.has(role);
}

/** @param {string | null | undefined} accountType */
export function isProviderAccountType(accountType) {
  return isProviderShellAccountType(accountType);
}

/** @param {string | null | undefined} role */
export function isClientRole(role) {
  return !role || role === 'client' || role === 'guest';
}

/** @param {string | null | undefined} accountType */
export function isClientAccountType(accountType) {
  return !accountType || accountType === 'client';
}

export const PROVIDER_TOOL_ROLES = ['barber', 'shop_owner', 'provider'];

/** @param {string | null | undefined} role */
export function canAccessProviderTools(role) {
  return isProviderRole(role);
}

/**
 * Resolve routing identity from account type (canonical) or legacy role.
 * @param {{
 *   accountType?: string | null,
 *   authRole?: string | null,
 *   barber?: { title?: string | null } | null,
 *   ownerMembership?: boolean,
 * }} ctx
 */
export function resolveEffectiveRole(ctx) {
  const authRole = ctx.authRole || 'client';
  if (authRole === 'admin') return 'admin';

  if (ctx.accountType) {
    return platformRoleForAccountType(ctx.accountType);
  }

  if (authRole === 'barber' || authRole === 'shop_owner') return authRole;
  if (authRole === 'seller' || authRole === 'company' || authRole === 'blogger') return authRole;

  if (ctx.ownerMembership) {
    if (ctx.barber?.title === 'Independent Barber') return 'barber';
    if (ctx.barber?.title === 'Shop Owner') return 'shop_owner';
    return 'shop_owner';
  }

  if (ctx.barber) return 'barber';

  return authRole;
}

/** @param {string | null | undefined} accountType */
export function resolveAccountType(accountType, role) {
  if (accountType) return accountType;
  return accountTypeFromRole(role);
}

/** @param {string | null | undefined} role */
export function dashboardPageForRole(role) {
  if (isAdminRole(role)) return 'GlobalFinancials';
  return dashboardPageForAccountType(accountTypeFromRole(role));
}

/** @param {string | null | undefined} accountType */
export { dashboardPageForAccountType };

/** @param {string | null | undefined} role */
export function settingsPageForRole(role) {
  if (isAdminRole(role)) return 'AdminPlatformHealth';
  if (isProviderRole(role)) return 'ProviderSettings';
  if (role === 'seller') return 'ProviderMarketplaceProducts';
  if (role === 'company') return 'MyJobs';
  if (role === 'blogger') return 'ProviderBlogArticles';
  return 'AccountSettings';
}

/** @param {string | null | undefined} accountType */
export function canAccessBookingProviderTools(accountType) {
  return isBookingProviderAccountType(accountType);
}

/** @param {string | null | undefined} accountType */
export function layoutZoneForAccountType(accountType) {
  switch (accountType) {
    case 'solo_barber':
    case 'shop':
      return 'provider';
    case 'seller':
      return 'seller';
    case 'company':
      return 'company';
    case 'blogger':
      return 'blogger';
    default:
      return 'client';
  }
}
