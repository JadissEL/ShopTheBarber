/**
 * Platform-level RBAC (mirrors frontend userRole.js).
 * Admins are platform operators — not providers.
 */

import {
    isBookingProviderAccountType,
    isMarketplaceSellerAccountType,
    type AccountType,
} from './accountType';

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
    if (accountType) return isBookingProviderAccountType(accountType);
    return isProviderRole(role);
}

export function canListMarketplaceProducts(
    role?: string | null,
    accountType?: string | null,
): boolean {
    if (accountType) return isMarketplaceSellerAccountType(accountType);
    return isMarketplaceSellerRole(role);
}

export function canPostJobs(role?: string | null, accountType?: string | null): boolean {
    if (accountType === 'company' || accountType === 'seller') return true;
    if (accountType === 'solo_barber' || accountType === 'shop') return true;
    return isEmployerRole(role);
}

export function canAuthorArticles(role?: string | null, accountType?: string | null): boolean {
    if (accountType === 'blogger') return true;
    if (accountType === 'solo_barber' || accountType === 'shop') return true;
    return isProviderRole(role) || isBloggerRole(role);
}

export function accountTypeAllows(
    accountType: string | null | undefined,
    allowed: readonly AccountType[],
): boolean {
    return !!accountType && allowed.includes(accountType as AccountType);
}
