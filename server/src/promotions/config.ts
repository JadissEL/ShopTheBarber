export const PROMO_AUDIENCES = [
    'everyone',
    'specific_users',
    'all_shops',
    'specific_shops',
    'all_barbers',
    'specific_barbers',
] as const;

export type PromoAudience = (typeof PROMO_AUDIENCES)[number];

export const PROMO_TARGET_TYPES = ['user', 'shop', 'barber'] as const;
export type PromoTargetType = (typeof PROMO_TARGET_TYPES)[number];

export const AUDIENCE_LABELS: Record<PromoAudience, string> = {
    everyone: 'All clients, any barber or shop',
    specific_users: 'Specific clients only',
    all_shops: 'All barbershop bookings',
    specific_shops: 'Specific barbershops only',
    all_barbers: 'All barber bookings',
    specific_barbers: 'Specific barbers only',
};

export const DEFAULT_MAX_USES = 100;
export const DEFAULT_MAX_USES_PER_USER = 1;

export function parseAudience(value: unknown): PromoAudience {
    const s = String(value ?? 'everyone');
    if ((PROMO_AUDIENCES as readonly string[]).includes(s)) return s as PromoAudience;
    throw new Error(`Invalid audience. Use one of: ${PROMO_AUDIENCES.join(', ')}`);
}

export function targetTypeForAudience(audience: PromoAudience): PromoTargetType | null {
    switch (audience) {
        case 'specific_users':
            return 'user';
        case 'specific_shops':
            return 'shop';
        case 'specific_barbers':
            return 'barber';
        default:
            return null;
    }
}

export function audienceRequiresTargets(audience: PromoAudience): boolean {
    return targetTypeForAudience(audience) !== null;
}
