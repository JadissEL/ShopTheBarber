import { isFeatureEnabled } from '@/lib/featureRegistry';
import { capabilityContextFromUser, hasCapability } from '@/lib/capabilities';

/**
 * Filter account-type or provider nav items by feature flags and capabilities.
 * @param {Array<{ page: string, label: string, feature?: string, capability?: string }>} items
 * @param {ReturnType<typeof capabilityContextFromUser>} ctx
 */
export function filterNavItemsByCapabilities(items, ctx) {
  return items.filter((item) => {
    if (item.feature && !isFeatureEnabled(item.feature)) return false;
    if (item.capability && !hasCapability(ctx, item.capability)) return false;
    return true;
  });
}

/**
 * @param {{
 *   role?: string | null,
 *   accountType?: string | null,
 *   companyCommerceEnabled?: boolean,
 * }} auth
 */
export function capabilityContextFromAuth(auth) {
  return capabilityContextFromUser({
    role: auth.role,
    accountType: auth.accountType,
    companyCommerceEnabled: auth.companyCommerceEnabled,
  });
}

/**
 * @param {ReturnType<typeof capabilityContextFromUser>} ctx
 * @param {string} capability
 */
export function canAccessCapability(ctx, capability) {
  return hasCapability(ctx, capability);
}
