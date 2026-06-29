/**
 * Ownership/scope conditions for auth-required entity routes (Prisma + Neon).
 * Ensures users only list, get, update, and delete their own (or their shop/barber) data.
 * `getEntityScopeCondition` returns a Prisma `where` object (or null = no restriction).
 */

import { prisma } from './db/prisma';

export type JwtUser = { id: string; email?: string; role?: string };

/** Request-scoped: first call loads barbers + shops for a user id; repeats reuse the same promise. */
export type EntityScopeCache = {
    getBarberShopIdsForUser(userId: string): Promise<{ barberIds: string[]; shopIds: string[] }>;
};

export function createEntityScopeCache(): EntityScopeCache {
    const pending = new Map<string, Promise<{ barberIds: string[]; shopIds: string[] }>>();
    return {
        getBarberShopIdsForUser(userId: string) {
            let p = pending.get(userId);
            if (!p) {
                p = (async () => {
                    const [barberRows, shopRows] = await Promise.all([
                        prisma.barbers.findMany({ where: { user_id: userId }, select: { id: true } }),
                        prisma.shops.findMany({ where: { owner_id: userId }, select: { id: true } }),
                    ]);
                    return {
                        barberIds: barberRows.map(r => r.id).filter(Boolean),
                        shopIds: shopRows.map(r => r.id).filter(Boolean),
                    };
                })();
                pending.set(userId, p);
            }
            return p;
        },
    };
}

/**
 * Shop IDs the user may manage promos for: owned shops + shops where they are owner/manager member.
 */
export async function getManagedShopIdsForUser(userId: string, cache?: EntityScopeCache): Promise<string[]> {
    const { shopIds: owned } = await barberShopIdsForUser(userId, cache);
    const memberRows = await prisma.shop_members.findMany({
        where: { user_id: userId, role: { in: ['owner', 'manager'] } },
        select: { shop_id: true },
    });
    const fromMember = memberRows.map(r => r.shop_id).filter(Boolean);
    return [...new Set([...owned, ...fromMember])];
}

async function barberShopIdsForUser(userId: string, cache?: EntityScopeCache): Promise<{ barberIds: string[]; shopIds: string[] }> {
    if (cache) return cache.getBarberShopIdsForUser(userId);
    const [barberRows, shopRows] = await Promise.all([
        prisma.barbers.findMany({ where: { user_id: userId }, select: { id: true } }),
        prisma.shops.findMany({ where: { owner_id: userId }, select: { id: true } }),
    ]);
    return {
        barberIds: barberRows.map(r => r.id).filter(Boolean),
        shopIds: shopRows.map(r => r.id).filter(Boolean),
    };
}

/** Public helper for messaging, bookings, etc. */
export async function getBarberShopIdsForUser(userId: string): Promise<{ barberIds: string[]; shopIds: string[] }> {
    return barberShopIdsForUser(userId, undefined);
}

type Where = Record<string, any>;

/**
 * Returns a Prisma `where` filter to restrict rows to the current user's scope for the given entity.
 * Admin role: no scope (can see all). Otherwise: entity-specific ownership rules.
 * Returns null if no scope should be applied (e.g. admin or entity not in scope map).
 */
export async function getEntityScopeCondition(
    entity: string,
    user: JwtUser,
    cache?: EntityScopeCache
): Promise<Where | null> {
    const userId = user?.id;
    const role = user?.role;
    if (!userId) return null;
    if (role === 'admin') return null;

    switch (entity) {
        case 'booking': {
            const { barberIds, shopIds } = await barberShopIdsForUser(userId, cache);
            const or: Where[] = [{ client_id: userId }];
            if (barberIds.length > 0) or.push({ barber_id: { in: barberIds } });
            if (shopIds.length > 0) or.push({ shop_id: { in: shopIds } });
            return { OR: or };
        }
        case 'loyalty_profile':
        case 'loyalty_transaction':
            return { user_id: userId };
        case 'message':
            return { OR: [{ sender_id: userId }, { receiver_id: userId }] };
        case 'notification':
            return { user_id: userId };
        case 'payout': {
            const { barberIds } = await barberShopIdsForUser(userId, cache);
            if (barberIds.length === 0) return { provider_id: '__none__' };
            return { provider_id: { in: barberIds } };
        }
        case 'favorite':
            return { user_id: userId };
        case 'dispute': {
            const { barberIds, shopIds } = await barberShopIdsForUser(userId, cache);
            const or: Where[] = [{ client_id: userId }];
            if (barberIds.length > 0) or.push({ barber_id: { in: barberIds } });
            if (shopIds.length > 0) or.push({ shop_id: { in: shopIds } });
            const bookingRows = await prisma.bookings.findMany({ where: { OR: or }, select: { id: true } });
            const bookingIds = bookingRows.map(r => r.id).filter(Boolean);
            if (bookingIds.length === 0) return { booking_id: '__none__' };
            return { booking_id: { in: bookingIds } };
        }
        case 'audit_log':
            return { actor_id: userId };
        case 'waiting_list_entry': {
            const { barberIds } = await barberShopIdsForUser(userId, cache);
            if (barberIds.length === 0) return { client_id: userId };
            return { OR: [{ client_id: userId }, { barber_id: { in: barberIds } }] };
        }
        case 'barber':
            return { user_id: userId };
        case 'shop':
            return { owner_id: userId };
        case 'service': {
            const { barberIds, shopIds } = await barberShopIdsForUser(userId, cache);
            const or: Where[] = [];
            if (barberIds.length > 0) or.push({ barber_id: { in: barberIds } });
            if (shopIds.length > 0) or.push({ shop_id: { in: shopIds } });
            if (or.length === 0) return { shop_id: '__none__' };
            return { OR: or };
        }
        case 'shift':
        case 'time_block': {
            const { barberIds } = await barberShopIdsForUser(userId, cache);
            if (barberIds.length === 0) return { barber_id: '__none__' };
            return { barber_id: { in: barberIds } };
        }
        case 'shop_member': {
            const { shopIds } = await barberShopIdsForUser(userId, cache);
            if (shopIds.length === 0) return { user_id: userId };
            return { OR: [{ user_id: userId }, { shop_id: { in: shopIds } }] };
        }
        case 'review':
            return { reviewer_id: userId };
        case 'product': {
            const { barberIds, shopIds } = await barberShopIdsForUser(userId, cache);
            const or: Where[] = [];
            if (barberIds.length > 0) or.push({ barber_id: { in: barberIds } });
            if (shopIds.length > 0) or.push({ shop_id: { in: shopIds } });
            if (or.length === 0) return { shop_id: '__none__' };
            return { OR: or };
        }
        case 'promo_code': {
            const ids = await getManagedShopIdsForUser(userId, cache);
            if (ids.length === 0) return { shop_id: '__none__' };
            return { shop_id: { in: ids } };
        }
        case 'wishlist_item':
            return { user_id: userId };
        case 'wallet_account':
        case 'wallet_transaction':
            return { user_id: userId };
        case 'referral':
            return { referrer_id: userId };
        case 'gift_card':
            return { purchaser_id: userId };
        case 'shop_inventory_item':
        case 'shop_expense': {
            const { shopIds } = await barberShopIdsForUser(userId, cache);
            const ids = await getManagedShopIdsForUser(userId, cache);
            const allShopIds = [...new Set([...shopIds, ...ids])];
            if (allShopIds.length === 0) return { shop_id: '__none__' };
            return { shop_id: { in: allShopIds } };
        }
        case 'barber_video': {
            const { barberIds } = await barberShopIdsForUser(userId, cache);
            if (barberIds.length === 0) return { barber_id: '__none__' };
            return { barber_id: { in: barberIds } };
        }
        default:
            return null;
    }
}

/**
 * Returns true if the given row is within the current user's scope (for GET by id / PATCH / DELETE checks).
 */
export async function rowInScope(
    entity: string,
    row: Record<string, unknown> | null,
    user: JwtUser,
    cache?: EntityScopeCache
): Promise<boolean> {
    if (!row || !user?.id) return false;
    if (user.role === 'admin') return true;

    switch (entity) {
        case 'booking': {
            if (row.client_id === user.id) return true;
            const { barberIds, shopIds } = await barberShopIdsForUser(user.id, cache);
            return barberIds.includes(row.barber_id as string) || shopIds.includes(row.shop_id as string);
        }
        case 'loyalty_profile':
        case 'loyalty_transaction':
            return row.user_id === user.id;
        case 'message':
            return row.sender_id === user.id || row.receiver_id === user.id;
        case 'notification':
            return row.user_id === user.id;
        case 'payout': {
            const { barberIds } = await barberShopIdsForUser(user.id, cache);
            return barberIds.includes(row.provider_id as string);
        }
        case 'favorite':
            return row.user_id === user.id;
        case 'dispute': {
            const booking = await prisma.bookings.findUnique({
                where: { id: row.booking_id as string },
                select: { client_id: true, barber_id: true, shop_id: true },
            });
            if (!booking) return false;
            if (booking.client_id === user.id) return true;
            const { barberIds, shopIds } = await barberShopIdsForUser(user.id, cache);
            return barberIds.includes(booking.barber_id) || shopIds.includes(booking.shop_id as string);
        }
        case 'audit_log':
            return row.actor_id === user.id;
        case 'waiting_list_entry': {
            if (row.client_id === user.id) return true;
            const { barberIds } = await barberShopIdsForUser(user.id, cache);
            return barberIds.includes(row.barber_id as string);
        }
        case 'barber':
            return row.user_id === user.id;
        case 'shop':
            return row.owner_id === user.id;
        case 'service': {
            const { barberIds, shopIds } = await barberShopIdsForUser(user.id, cache);
            return barberIds.includes(row.barber_id as string) || shopIds.includes(row.shop_id as string);
        }
        case 'shift':
        case 'time_block': {
            const { barberIds } = await barberShopIdsForUser(user.id, cache);
            return barberIds.includes(row.barber_id as string);
        }
        case 'shop_member': {
            if (row.user_id === user.id) return true;
            const { shopIds } = await barberShopIdsForUser(user.id, cache);
            return shopIds.includes(row.shop_id as string);
        }
        case 'review':
            return row.reviewer_id === user.id;
        case 'product': {
            const { barberIds, shopIds } = await barberShopIdsForUser(user.id, cache);
            return barberIds.includes(row.barber_id as string) || shopIds.includes(row.shop_id as string);
        }
        case 'promo_code': {
            const sid = row.shop_id;
            if (sid == null || sid === '') return false;
            const ids = await getManagedShopIdsForUser(user.id, cache);
            return ids.includes(String(sid));
        }
        case 'wishlist_item':
            return row.user_id === user.id;
        case 'wallet_account':
        case 'wallet_transaction':
            return row.user_id === user.id;
        case 'referral':
            return row.referrer_id === user.id;
        case 'gift_card':
            return row.purchaser_id === user.id;
        case 'shop_inventory_item':
        case 'shop_expense': {
            const ids = await getManagedShopIdsForUser(user.id, cache);
            return ids.includes(String(row.shop_id));
        }
        case 'barber_video': {
            const { barberIds } = await barberShopIdsForUser(user.id, cache);
            return barberIds.includes(row.barber_id as string);
        }
        default:
            return false;
    }
}
