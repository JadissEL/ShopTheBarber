/**
 * Platform-level RBAC (mirrors frontend userRole.js).
 * Admins are platform operators — not providers.
 */

export const PLATFORM_PROVIDER_ROLES = new Set(['barber', 'shop_owner', 'provider']);

export type PlatformRole = 'client' | 'barber' | 'shop_owner' | 'provider' | 'admin';

export function isAdminRole(role?: string | null): boolean {
    return role === 'admin';
}

export function isProviderRole(role?: string | null): boolean {
    return !!role && PLATFORM_PROVIDER_ROLES.has(role);
}

export function isClientRole(role?: string | null): boolean {
    return !role || role === 'client';
}

export function canAccessProviderTools(role?: string | null): boolean {
    return isProviderRole(role);
}
