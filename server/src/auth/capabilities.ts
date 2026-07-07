/**
 * Central capability model — backend authority for RBAC (mirrored in src/lib/capabilities.js).
 */
import { inferAccountTypeFromLegacyRole, type AccountType } from './accountType';

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
] as const;

export type CapabilityKey = (typeof CAPABILITY_KEYS)[number];

export type CapabilityContext = {
    role?: string | null;
    accountType?: string | null;
    /** Required for company product/order/analytics capabilities (on-request activation). */
    companyCommerceEnabled?: boolean;
};

function isAdmin(ctx: CapabilityContext): boolean {
    return ctx.role === 'admin';
}

function accountType(ctx: CapabilityContext): AccountType | null {
    const t = ctx.accountType;
    if (
        t === 'client' ||
        t === 'solo_barber' ||
        t === 'shop' ||
        t === 'seller' ||
        t === 'company' ||
        t === 'blogger'
    ) {
        return t;
    }
    return null;
}

function resolvedAccountType(ctx: CapabilityContext): AccountType | null {
    if (ctx.accountType) return accountType(ctx);
    return inferAccountTypeFromLegacyRole(ctx.role);
}

function isBookingProvider(ctx: CapabilityContext): boolean {
    const t = resolvedAccountType(ctx);
    return t === 'solo_barber' || t === 'shop';
}

function isMarketplaceSellerAlways(ctx: CapabilityContext): boolean {
    const t = resolvedAccountType(ctx);
    return t === 'seller' || t === 'solo_barber' || t === 'shop' || t === 'blogger';
}

function isCompanyCommerceActive(ctx: CapabilityContext): boolean {
    return resolvedAccountType(ctx) === 'company' && ctx.companyCommerceEnabled === true;
}

const CAPABILITY_GRANTS: Record<CapabilityKey, (ctx: CapabilityContext) => boolean> = {
    'booking.provider.tools': (ctx) => isAdmin(ctx) || isBookingProvider(ctx),
    'service.write': (ctx) => isAdmin(ctx) || isBookingProvider(ctx),
    'barber.write': (ctx) => isAdmin(ctx) || isBookingProvider(ctx),
    'shop.write': (ctx) => isAdmin(ctx) || resolvedAccountType(ctx) === 'shop',
    'staff.manage': (ctx) => isAdmin(ctx) || resolvedAccountType(ctx) === 'shop',
    'inventory.manage': (ctx) =>
        isAdmin(ctx) || resolvedAccountType(ctx) === 'shop' || resolvedAccountType(ctx) === 'seller',
    'expenses.manage': (ctx) => isAdmin(ctx) || resolvedAccountType(ctx) === 'shop',
    'product.write': (ctx) =>
        isAdmin(ctx) ||
        isMarketplaceSellerAlways(ctx) ||
        isCompanyCommerceActive(ctx),
    'order.manage': (ctx) =>
        isAdmin(ctx) ||
        isMarketplaceSellerAlways(ctx) ||
        isCompanyCommerceActive(ctx),
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
        isAdmin(ctx) || isBookingProvider(ctx) || isMarketplaceSellerAlways(ctx) || isCompanyCommerceActive(ctx),
    'company.commerce': (ctx) => isAdmin(ctx) || isCompanyCommerceActive(ctx),
};

/** Check a single capability against account type / role context. */
export function hasCapability(ctx: CapabilityContext, capability: CapabilityKey): boolean {
    const grant = CAPABILITY_GRANTS[capability];
    return grant ? grant(ctx) : false;
}

/** True when any listed capability is granted (OR semantics). */
export function hasAnyCapability(ctx: CapabilityContext, capabilities: CapabilityKey[]): boolean {
    return capabilities.some((cap) => hasCapability(ctx, cap));
}

export function capabilityContextFromUser(user: {
    role?: string | null;
    accountType?: string | null;
    account_type?: string | null;
    companyCommerceEnabled?: boolean;
}): CapabilityContext {
    return {
        role: user.role,
        accountType: user.accountType ?? user.account_type,
        companyCommerceEnabled: user.companyCommerceEnabled,
    };
}
