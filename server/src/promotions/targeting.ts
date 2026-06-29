import { prisma } from '../db/prisma';
import { type PromoAudience, DEFAULT_MAX_USES, DEFAULT_MAX_USES_PER_USER } from './config';

export type PromoWithTargets = Awaited<ReturnType<typeof loadPromoByCode>>;

export async function loadPromoByCode(code: string) {
    const normalized = code.trim().toUpperCase();
    return prisma.promo_codes.findUnique({
        where: { code: normalized },
        include: { targets: true },
    });
}

export async function loadPromoById(id: string) {
    return prisma.promo_codes.findUnique({
        where: { id },
        include: { targets: true },
    });
}

/** Resolve audience from row, including legacy shop_id / owner_user_id. */
export function resolveAudience(row: {
    audience?: string | null;
    shop_id?: string | null;
    owner_user_id?: string | null;
}): PromoAudience {
    const raw = row.audience ?? 'everyone';
    if (raw !== 'everyone') return raw as PromoAudience;
    if (row.owner_user_id) return 'specific_users';
    if (row.shop_id) return 'specific_shops';
    return 'everyone';
}

export function targetIdsByType(
    row: { targets?: { target_type: string; target_id: string }[]; shop_id?: string | null; owner_user_id?: string | null },
    type: 'user' | 'shop' | 'barber'
): string[] {
    const fromTargets = (row.targets ?? [])
        .filter((t) => t.target_type === type)
        .map((t) => t.target_id);
    if (type === 'shop' && row.shop_id && !fromTargets.includes(row.shop_id)) {
        return [...fromTargets, row.shop_id];
    }
    if (type === 'user' && row.owner_user_id && !fromTargets.includes(row.owner_user_id)) {
        return [...fromTargets, row.owner_user_id];
    }
    return fromTargets;
}

export interface ApplyCheckContext {
    barber_id: string;
    shop_id?: string | null;
    context_type: 'shop' | 'independent';
}

export interface RedeemCheckContext {
    user_id: string;
}

export type TargetCheckResult =
    | { ok: true }
    | { ok: false; reason: string; message: string };

export async function checkPromoRedeemEligibility(
    row: NonNullable<PromoWithTargets>,
    ctx: RedeemCheckContext
): Promise<TargetCheckResult> {
    const audience = resolveAudience(row);

    if (audience === 'specific_users') {
        const userIds = targetIdsByType(row, 'user');
        if (userIds.length === 0 && row.owner_user_id) {
            userIds.push(row.owner_user_id);
        }
        if (userIds.length === 0 || !userIds.includes(ctx.user_id)) {
            return {
                ok: false,
                reason: 'NOT_OWNER',
                message: 'This promo code is not available for your account',
            };
        }
    }

    return { ok: true };
}

export async function checkPromoApplyEligibility(
    row: NonNullable<PromoWithTargets>,
    ctx: ApplyCheckContext
): Promise<TargetCheckResult> {
    const audience = resolveAudience(row);
    const { barber_id, shop_id = null, context_type } = ctx;

    if (audience === 'everyone') {
        return { ok: true };
    }

    if (audience === 'all_shops') {
        const effectiveShopId =
            context_type === 'shop'
                ? shop_id
                : (await prisma.barbers.findUnique({ where: { id: barber_id }, select: { shop_id: true } }))?.shop_id;
        if (!effectiveShopId) {
            return {
                ok: false,
                reason: 'NOT_APPLICABLE',
                message: 'This promo applies to barbershop bookings only',
            };
        }
        return { ok: true };
    }

    if (audience === 'all_barbers') {
        if (!barber_id) {
            return { ok: false, reason: 'NOT_APPLICABLE', message: 'This promo requires a barber booking' };
        }
        return { ok: true };
    }

    if (audience === 'specific_shops') {
        const shopIds = targetIdsByType(row, 'shop');
        const effectiveShopId =
            context_type === 'shop'
                ? shop_id
                : (await prisma.barbers.findUnique({ where: { id: barber_id }, select: { shop_id: true } }))?.shop_id;
        if (!effectiveShopId || !shopIds.includes(effectiveShopId)) {
            return {
                ok: false,
                reason: 'NOT_APPLICABLE',
                message: 'This promo code cannot be used at this barbershop',
            };
        }
        return { ok: true };
    }

    if (audience === 'specific_barbers') {
        const barberIds = targetIdsByType(row, 'barber');
        if (!barberIds.includes(barber_id)) {
            return {
                ok: false,
                reason: 'NOT_APPLICABLE',
                message: 'This promo code cannot be used with this barber',
            };
        }
        return { ok: true };
    }

    // specific_users, apply side is open once user is eligible
    return { ok: true };
}

export async function countPromoUses(code: string, userId?: string) {
    const normalized = code.trim().toUpperCase();
    const [totalUses, userUses] = await Promise.all([
        prisma.bookings.count({ where: { discount_code: normalized } }),
        userId
            ? prisma.bookings.count({ where: { discount_code: normalized, client_id: userId } })
            : Promise.resolve(0),
    ]);
    return { totalUses, userUses };
}

export function getUsageLimits(row: {
    max_uses?: number | null;
    max_uses_per_user?: number | null;
    owner_user_id?: string | null;
}) {
    const maxUses = row.max_uses ?? DEFAULT_MAX_USES;
    const maxPerUser = row.max_uses_per_user ?? DEFAULT_MAX_USES_PER_USER;
    return { maxUses, maxPerUser };
}

export async function checkPromoUsageLimits(
    row: NonNullable<PromoWithTargets>,
    code: string,
    userId: string
): Promise<TargetCheckResult> {
    const { maxUses, maxPerUser } = getUsageLimits(row);
    const { totalUses, userUses } = await countPromoUses(code, userId);

    if (totalUses >= maxUses) {
        return {
            ok: false,
            reason: 'CODE_EXHAUSTED',
            message: 'This promo code has reached its usage limit',
        };
    }

    if (userUses >= maxPerUser) {
        return {
            ok: false,
            reason: 'ALREADY_USED',
            message: 'You have already used this promo code',
        };
    }

    return { ok: true };
}

export function promoAppliesToBarberContext(
    row: {
        audience?: string | null;
        shop_id?: string | null;
        owner_user_id?: string | null;
        targets?: { target_type: string; target_id: string }[];
        is_active?: boolean | null;
    },
    barberId: string,
    barberShopId: string | null
): boolean {
    if (row.is_active === false) return false;
    const audience = resolveAudience(row);

    if (audience === 'everyone' || audience === 'all_barbers' || audience === 'specific_users') {
        return true;
    }
    if (audience === 'all_shops') {
        return !!barberShopId;
    }
    if (audience === 'specific_shops') {
        const shopIds = targetIdsByType(row, 'shop');
        return !!barberShopId && shopIds.includes(barberShopId);
    }
    if (audience === 'specific_barbers') {
        return targetIdsByType(row, 'barber').includes(barberId);
    }
    return false;
}

export function promoAppliesToShop(shopId: string, row: {
    audience?: string | null;
    shop_id?: string | null;
    targets?: { target_type: string; target_id: string }[];
}): boolean {
    const audience = resolveAudience(row);
    if (audience === 'everyone' || audience === 'all_shops') return true;
    if (audience === 'specific_shops') {
        return targetIdsByType(row, 'shop').includes(shopId);
    }
    return false;
}
