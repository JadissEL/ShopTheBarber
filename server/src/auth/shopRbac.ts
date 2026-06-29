/** Shop staff RBAC — Phase 3. Roles: owner, manager, receptionist, barber, assistant, apprentice */

export const SHOP_ROLES = ['owner', 'manager', 'receptionist', 'barber', 'assistant', 'apprentice'] as const;
export type ShopRole = (typeof SHOP_ROLES)[number];

export const SHOP_PERMISSIONS = [
    'shop:view',
    'shop:edit',
    'staff:manage',
    'bookings:view',
    'bookings:manage',
    'bookings:check_in',
    'finance:view',
    'finance:manage',
    'inventory:manage',
    'reports:export',
] as const;

export type ShopPermission = (typeof SHOP_PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<ShopRole, ShopPermission[]> = {
    owner: [...SHOP_PERMISSIONS],
    manager: [
        'shop:view',
        'shop:edit',
        'staff:manage',
        'bookings:view',
        'bookings:manage',
        'bookings:check_in',
        'finance:view',
        'inventory:manage',
        'reports:export',
    ],
    receptionist: ['shop:view', 'bookings:view', 'bookings:manage', 'bookings:check_in'],
    barber: ['shop:view', 'bookings:view', 'bookings:manage', 'bookings:check_in'],
    assistant: ['shop:view', 'bookings:view', 'bookings:check_in'],
    apprentice: ['shop:view', 'bookings:view'],
};

export function isValidShopRole(role: string): role is ShopRole {
    return (SHOP_ROLES as readonly string[]).includes(role);
}

export function permissionsForRole(role: string): ShopPermission[] {
    if (!isValidShopRole(role)) return ['shop:view'];
    return ROLE_PERMISSIONS[role];
}

export function roleHasPermission(role: string, permission: ShopPermission): boolean {
    return permissionsForRole(role).includes(permission);
}

export function normalizeLegacyRole(role: string | null | undefined): ShopRole {
    const r = (role ?? 'barber').toLowerCase();
    if (r === 'owner') return 'owner';
    if (isValidShopRole(r)) return r;
    return 'barber';
}
