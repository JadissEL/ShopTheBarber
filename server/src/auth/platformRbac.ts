/**
 * Platform-level RBAC (mirrors frontend userRole.js).
 * Admins are platform operators — not providers.
 */

import { type AccountType } from './accountType';
import {
    capabilityContextFromUser,
    hasCapability,
} from './capabilities';

export const PLATFORM_PROVIDER_ROLES = new Set(['barber', 'shop_owner', 'provider']);
export const PLATFORM_SELLER_ROLES = new Set(['seller', 'company', 'blogger']);
export const PLATFORM_EMPLOYER_ROLES = new Set(['barber', 'shop_owner', 'provider', 'company', 'seller']);

export type PlatformRole =
    | 'client'
    | 'barber'
    | 'shop_owner'
    | 'provider'
    | 'seller'
    | 'company'
    | 'blogger'
    | 'admin';

function ctx(role?: string | null, accountType?: string | null, companyCommerceEnabled?: boolean) {
    return capabilityContextFromUser({ role, accountType, companyCommerceEnabled });
}

export function isAdminRole(role?: string | null): boolean {
    return role === 'admin';
}

export function isProviderRole(role?: string | null): boolean {
    return !!role && PLATFORM_PROVIDER_ROLES.has(role);
}

export function isMarketplaceSellerRole(role?: string | null): boolean {
    return isProviderRole(role) || (!!role && PLATFORM_SELLER_ROLES.has(role));
}

export function isEmployerRole(role?: string | null): boolean {
    return !!role && PLATFORM_EMPLOYER_ROLES.has(role);
}

export function isBloggerRole(role?: string | null): boolean {
    return role === 'blogger';
}

export function isClientRole(role?: string | null): boolean {
    return !role || role === 'client';
}

export function canAccessProviderTools(role?: string | null): boolean {
    return isProviderRole(role);
}

export function canAccessBookingProviderTools(
    role?: string | null,
    accountType?: string | null,
): boolean {
    if (accountType) return hasCapability(ctx(role, accountType), 'booking.provider.tools');
    return hasCapability(ctx(role), 'booking.provider.tools') || isProviderRole(role);
}

export function canListMarketplaceProducts(
    role?: string | null,
    accountType?: string | null,
    companyCommerceEnabled?: boolean,
): boolean {
    return hasCapability(ctx(role, accountType, companyCommerceEnabled), 'product.write');
}

export function canPostJobs(role?: string | null, accountType?: string | null): boolean {
    return hasCapability(ctx(role, accountType), 'job.write');
}

export function canAuthorArticles(role?: string | null, accountType?: string | null): boolean {
    return hasCapability(ctx(role, accountType), 'article.write');
}

export function accountTypeAllows(
    accountType: string | null | undefined,
    allowed: readonly AccountType[],
): boolean {
    return !!accountType && allowed.includes(accountType as AccountType);
}
