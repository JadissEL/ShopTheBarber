/**
 * Frontend capability mirror — keep in lockstep with server/src/auth/capabilities.ts.
 * UX only; backend is authoritative.
 */

export const CAPABILITY_KEYS = [
  'booking.provider.tools',
  'service.write',
  'barber.write',
  'shop.write',
  'staff.manage',
  'inventory.manage',
  'expenses.manage',
  'product.write',
  'order.manage',
  'article.write',
  'job.write',
  'promotion.write',
  'booking.create',
  'review.create',
  'analytics.view.own',
  'analytics.view.shop',
  'analytics.view.company',
  'payment.provider_wallet',
  'payment.stripe_connect',
  'company.commerce',
];

/** @typedef {(typeof CAPABILITY_KEYS)[number]} CapabilityKey */

/**
 * @param {{
 *   role?: string | null,
 *   accountType?: string | null,
 *   companyCommerceEnabled?: boolean,
 * }} ctx
 * @param {string} capability
 */
export function hasCapability(ctx, capability) {
  const grant = CAPABILITY_GRANTS[capability];
  return grant ? grant(ctx) : false;
}

/**
 * @param {ReturnType<typeof capabilityContextFromUser>} ctx
 * @param {string[]} capabilities
 */
export function hasAnyCapability(ctx, capabilities) {
  return capabilities.some((cap) => hasCapability(ctx, cap));
}

/**
 * @param {{
 *   role?: string | null,
 *   accountType?: string | null,
 *   companyCommerceEnabled?: boolean,
 * }} user
 */
export function capabilityContextFromUser(user) {
  return {
    role: user.role,
    accountType: user.accountType ?? user.account_type,
    companyCommerceEnabled: user.companyCommerceEnabled,
  };
}

function isAdmin(ctx) {
  return ctx.role === 'admin';
}

function accountType(ctx) {
  return ctx.accountType || null;
}

function resolvedAccountType(ctx) {
  if (ctx.accountType) return accountType(ctx);
  const role = ctx.role;
  if (role === 'shop_owner') return 'shop';
  if (role === 'barber' || role === 'provider') return 'solo_barber';
  if (role === 'seller') return 'seller';
  if (role === 'company') return 'company';
  if (role === 'blogger') return 'blogger';
  return 'client';
}

function isBookingProvider(ctx) {
  const t = resolvedAccountType(ctx);
  return t === 'solo_barber' || t === 'shop';
}

function isMarketplaceSellerAlways(ctx) {
  const t = resolvedAccountType(ctx);
  return t === 'seller' || t === 'solo_barber' || t === 'shop' || t === 'blogger';
}

function isCompanyCommerceActive(ctx) {
  return resolvedAccountType(ctx) === 'company' && ctx.companyCommerceEnabled === true;
}

/** @type {Record<string, (ctx: object) => boolean>} */
const CAPABILITY_GRANTS = {
  'booking.provider.tools': (ctx) => isAdmin(ctx) || isBookingProvider(ctx),
  'service.write': (ctx) => isAdmin(ctx) || isBookingProvider(ctx),
  'barber.write': (ctx) => isAdmin(ctx) || isBookingProvider(ctx),
  'shop.write': (ctx) => isAdmin(ctx) || resolvedAccountType(ctx) === 'shop',
  'staff.manage': (ctx) => isAdmin(ctx) || resolvedAccountType(ctx) === 'shop',
  'inventory.manage': (ctx) =>
    isAdmin(ctx) || resolvedAccountType(ctx) === 'shop' || resolvedAccountType(ctx) === 'seller',
  'expenses.manage': (ctx) => isAdmin(ctx) || resolvedAccountType(ctx) === 'shop',
  'product.write': (ctx) =>
    isAdmin(ctx) || isMarketplaceSellerAlways(ctx) || isCompanyCommerceActive(ctx),
  'order.manage': (ctx) =>
    isAdmin(ctx) || isMarketplaceSellerAlways(ctx) || isCompanyCommerceActive(ctx),
  'article.write': (ctx) => {
    if (isAdmin(ctx)) return true;
    const t = resolvedAccountType(ctx);
    return t === 'blogger' || t === 'solo_barber' || t === 'shop';
  },
  'job.write': (ctx) => {
    if (isAdmin(ctx)) return true;
    const t = resolvedAccountType(ctx);
    return t === 'company' || t === 'seller' || t === 'solo_barber' || t === 'shop';
  },
  'promotion.write': (ctx) => isAdmin(ctx) || isBookingProvider(ctx),
  'booking.create': (ctx) => {
    if (isAdmin(ctx)) return true;
    const t = resolvedAccountType(ctx);
    return t === 'client' || t === 'blogger';
  },
  'review.create': (ctx) => {
    if (isAdmin(ctx)) return true;
    const t = resolvedAccountType(ctx);
    return t === 'client' || t === 'blogger';
  },
  'analytics.view.own': (ctx) => {
    if (isAdmin(ctx)) return true;
    const t = resolvedAccountType(ctx);
    return (
      t === 'solo_barber' ||
      t === 'shop' ||
      t === 'seller' ||
      t === 'blogger' ||
      isCompanyCommerceActive(ctx)
    );
  },
  'analytics.view.shop': (ctx) => isAdmin(ctx) || resolvedAccountType(ctx) === 'shop',
  'analytics.view.company': (ctx) => isAdmin(ctx) || isCompanyCommerceActive(ctx),
  'payment.provider_wallet': (ctx) => isAdmin(ctx) || isBookingProvider(ctx),
  'payment.stripe_connect': (ctx) =>
    isAdmin(ctx) ||
    isBookingProvider(ctx) ||
    isMarketplaceSellerAlways(ctx) ||
    isCompanyCommerceActive(ctx),
  'company.commerce': (ctx) => isAdmin(ctx) || isCompanyCommerceActive(ctx),
};
