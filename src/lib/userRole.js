/**
 * Shared role helpers — keep provider/client routing consistent across the app.
 */

export const PROVIDER_ROLES = new Set(['barber', 'shop_owner', 'provider']);

/** @param {string | null | undefined} role */
export function isProviderRole(role) {
  return role === 'admin' || PROVIDER_ROLES.has(role);
}

/** @param {string | null | undefined} role */
export function isClientRole(role) {
  return !role || role === 'client' || role === 'guest';
}

/**
 * Resolve display/routing role from auth role + optional workspace hints.
 * @param {{
 *   authRole?: string | null,
 *   barber?: { title?: string | null } | null,
 *   ownerMembership?: boolean,
 *   providerIntent?: 'barber' | 'shop' | null,
 * }} ctx
 */
export function resolveEffectiveRole(ctx) {
  const authRole = ctx.authRole || 'client';
  if (authRole === 'admin') return 'admin';
  if (authRole === 'barber' || authRole === 'shop_owner') return authRole;

  if (ctx.ownerMembership) {
    if (ctx.barber?.title === 'Independent Barber') return 'barber';
    if (ctx.barber?.title === 'Shop Owner') return 'shop_owner';
    if (ctx.providerIntent === 'barber') return 'barber';
    if (ctx.providerIntent === 'shop') return 'shop_owner';
    return 'barber';
  }

  if (ctx.barber) return 'barber';

  if (ctx.providerIntent === 'shop') return 'shop_owner';
  if (ctx.providerIntent === 'barber') return 'barber';

  return authRole;
}

/** @param {string | null | undefined} role */
export function dashboardPageForRole(role) {
  if (role === 'admin') return 'GlobalFinancials';
  if (isProviderRole(role)) return 'ProviderDashboard';
  return 'Dashboard';
}
