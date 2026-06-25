/**
 * Ownership/scope conditions for auth-required entity routes.
 * Ensures users only list, get, update, and delete their own (or their shop/barber) data.
 */

import { eq, or, and, inArray, SQL } from 'drizzle-orm';
import { db } from './db';
import * as schema from './db/schema';

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
                        db.select({ id: schema.barbers.id }).from(schema.barbers).where(eq(schema.barbers.user_id, userId)),
                        db.select({ id: schema.shops.id }).from(schema.shops).where(eq(schema.shops.owner_id, userId)),
                    ]);
                    return {
                        barberIds: barberRows.map(r => r.id).filter(Boolean) as string[],
                        shopIds: shopRows.map(r => r.id).filter(Boolean) as string[],
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
    const memberRows = await db
        .select({ shop_id: schema.shop_members.shop_id })
        .from(schema.shop_members)
        .where(and(eq(schema.shop_members.user_id, userId), inArray(schema.shop_members.role, ['owner', 'manager'])));
    const fromMember = memberRows.map(r => r.shop_id).filter(Boolean) as string[];
    return [...new Set([...owned, ...fromMember])];
}

async function barberShopIdsForUser(userId: string, cache?: EntityScopeCache): Promise<{ barberIds: string[]; shopIds: string[] }> {
    if (cache) return cache.getBarberShopIdsForUser(userId);
    const barberRows = await db.select({ id: schema.barbers.id }).from(schema.barbers).where(eq(schema.barbers.user_id, userId));
    const shopRows = await db.select({ id: schema.shops.id }).from(schema.shops).where(eq(schema.shops.owner_id, userId));
    return {
        barberIds: barberRows.map(r => r.id).filter(Boolean) as string[],
        shopIds: shopRows.map(r => r.id).filter(Boolean) as string[],
    };
}

/**
 * Returns a Drizzle condition to restrict rows to the current user's scope for the given entity.
 * Admin role: no scope (can see all). Otherwise: entity-specific ownership rules.
 * Returns null if no scope should be applied (e.g. admin or entity not in scope map).
 */
export async function getEntityScopeCondition(
    entity: string,
    table: any,
    user: JwtUser,
    cache?: EntityScopeCache
): Promise<SQL | null> {
    const userId = user?.id;
    const role = user?.role;
    if (!userId) return null;

    if (role === 'admin') return null;

    switch (entity) {
        case 'booking': {
            const { barberIds, shopIds } = await barberShopIdsForUser(userId, cache);
            const parts: SQL[] = [eq(table.client_id, userId)];
            if (barberIds.length > 0) parts.push(inArray(table.barber_id, barberIds));
            if (shopIds.length > 0) parts.push(inArray(table.shop_id, shopIds));
            return or(...parts)!;
        }
        case 'loyalty_profile':
        case 'loyalty_transaction':
            return eq(table.user_id, userId);
        case 'message':
            return or(eq(table.sender_id, userId), eq(table.receiver_id, userId))!;
        case 'notification':
            return eq(table.user_id, userId);
        case 'payout': {
            const { barberIds } = await barberShopIdsForUser(userId, cache);
            if (barberIds.length === 0) return eq(table.provider_id, '__none__'); // no barber profile → no payouts
            return inArray(table.provider_id, barberIds);
        }
        case 'favorite':
            return eq(table.user_id, userId);
        case 'dispute': {
            const { barberIds, shopIds } = await barberShopIdsForUser(userId, cache);
            const orParts: SQL[] = [eq(schema.bookings.client_id, userId)];
            if (barberIds.length > 0) orParts.push(inArray(schema.bookings.barber_id, barberIds));
            if (shopIds.length > 0) orParts.push(inArray(schema.bookings.shop_id, shopIds));
            const bookingRows = await db.select({ id: schema.bookings.id }).from(schema.bookings).where(or(...orParts)!);
            const bookingIds = bookingRows.map(r => r.id).filter(Boolean) as string[];
            if (bookingIds.length === 0) return eq(table.booking_id, '__none__');
            return inArray(table.booking_id, bookingIds);
        }
        case 'audit_log':
            return eq(table.actor_id, userId);
        case 'waiting_list_entry': {
            const { barberIds } = await barberShopIdsForUser(userId, cache);
            if (barberIds.length === 0) return eq(table.client_id, userId);
            return or(eq(table.client_id, userId), inArray(table.barber_id, barberIds))!;
        }
        case 'barber':
            return eq(table.user_id, userId);
        case 'shop':
            return eq(table.owner_id, userId);
        case 'service': {
            const { barberIds, shopIds } = await barberShopIdsForUser(userId, cache);
            const parts: SQL[] = [];
            if (barberIds.length > 0) parts.push(inArray(table.barber_id, barberIds));
            if (shopIds.length > 0) parts.push(inArray(table.shop_id, shopIds));
            if (parts.length === 0) return eq(table.shop_id, '__none__');
            return or(...parts)!;
        }
        case 'shift':
        case 'time_block': {
            const { barberIds } = await barberShopIdsForUser(userId, cache);
            if (barberIds.length === 0) return eq(table.barber_id, '__none__');
            return inArray(table.barber_id, barberIds);
        }
        case 'shop_member': {
            const { shopIds } = await barberShopIdsForUser(userId, cache);
            if (shopIds.length === 0) return eq(table.user_id, userId);
            return or(eq(table.user_id, userId), inArray(table.shop_id, shopIds))!;
        }
        case 'review':
            return eq(table.reviewer_id, userId);
        case 'product': {
            const { barberIds, shopIds } = await barberShopIdsForUser(userId, cache);
            const parts: SQL[] = [];
            if (barberIds.length > 0) parts.push(inArray(table.barber_id, barberIds));
            if (shopIds.length > 0) parts.push(inArray(table.shop_id, shopIds));
            if (parts.length === 0) return eq(table.shop_id, '__none__');
            return or(...parts)!;
        }
        case 'promo_code': {
            const ids = await getManagedShopIdsForUser(userId, cache);
            if (ids.length === 0) return eq(table.shop_id, '__none__');
            return inArray(table.shop_id, ids);
        }
        case 'wishlist_item':
            return eq(table.user_id, userId);
        case 'wallet_account':
        case 'wallet_transaction':
            return eq(table.user_id, userId);
        case 'referral':
            return eq(table.referrer_id, userId);
        case 'gift_card':
            return eq(table.purchaser_id, userId);
        case 'shop_inventory_item':
        case 'shop_expense': {
            const { shopIds } = await barberShopIdsForUser(userId, cache);
            const ids = await getManagedShopIdsForUser(userId, cache);
            const allShopIds = [...new Set([...shopIds, ...ids])];
            if (allShopIds.length === 0) return eq(table.shop_id, '__none__');
            return inArray(table.shop_id, allShopIds);
        }
        case 'barber_video': {
            const { barberIds } = await barberShopIdsForUser(userId, cache);
            if (barberIds.length === 0) return eq(table.barber_id, '__none__');
            return inArray(table.barber_id, barberIds);
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
    table: any,
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
            const [booking] = await db
                .select({ client_id: schema.bookings.client_id, barber_id: schema.bookings.barber_id, shop_id: schema.bookings.shop_id })
                .from(schema.bookings)
                .where(eq(schema.bookings.id, row.booking_id as string));
            if (!booking) return false;
            if (booking.client_id === user.id) return true;
            const { barberIds, shopIds } = await barberShopIdsForUser(user.id, cache);
            return barberIds.includes(booking.barber_id as string) || shopIds.includes(booking.shop_id as string);
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
