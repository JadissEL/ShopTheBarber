/**
 * Ownership/scope conditions for auth-required entity routes.
 * Ensures users only list, get, update, and delete their own (or their shop/barber) data.
 */

import { eq, or, inArray, SQL } from 'drizzle-orm';
import { db } from './db';
import * as schema from './db/schema';

export type JwtUser = { id: string; email?: string; role?: string };

/**
 * Returns a Drizzle condition to restrict rows to the current user's scope for the given entity.
 * Admin role: no scope (can see all). Otherwise: entity-specific ownership rules.
 * Returns null if no scope should be applied (e.g. admin or entity not in scope map).
 */
export async function getEntityScopeCondition(
    entity: string,
    table: any,
    user: JwtUser
): Promise<SQL | null> {
    const userId = user?.id;
    const role = user?.role;
    if (!userId) return null;

    if (role === 'admin') return null;

    switch (entity) {
        case 'booking': {
            const barberRows = await db.select({ id: schema.barbers.id }).from(schema.barbers).where(eq(schema.barbers.user_id, userId));
            const shopRows = await db.select({ id: schema.shops.id }).from(schema.shops).where(eq(schema.shops.owner_id, userId));
            const barberIds = barberRows.map(r => r.id).filter(Boolean) as string[];
            const shopIds = shopRows.map(r => r.id).filter(Boolean) as string[];
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
            const barberRows = await db.select({ id: schema.barbers.id }).from(schema.barbers).where(eq(schema.barbers.user_id, userId));
            const barberIds = barberRows.map(r => r.id).filter(Boolean) as string[];
            if (barberIds.length === 0) return eq(table.provider_id, '__none__'); // no barber profile → no payouts
            return inArray(table.provider_id, barberIds);
        }
        case 'favorite':
            return eq(table.user_id, userId);
        case 'dispute': {
            const barberRows = await db.select({ id: schema.barbers.id }).from(schema.barbers).where(eq(schema.barbers.user_id, userId));
            const shopRows = await db.select({ id: schema.shops.id }).from(schema.shops).where(eq(schema.shops.owner_id, userId));
            const barberIds = barberRows.map(r => r.id).filter(Boolean) as string[];
            const shopIds = shopRows.map(r => r.id).filter(Boolean) as string[];
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
            const barberRows = await db.select({ id: schema.barbers.id }).from(schema.barbers).where(eq(schema.barbers.user_id, userId));
            const barberIds = barberRows.map(r => r.id).filter(Boolean) as string[];
            if (barberIds.length === 0) return eq(table.client_id, userId);
            return or(eq(table.client_id, userId), inArray(table.barber_id, barberIds))!;
        }
        default:
            return null;
    }
}

/**
 * Returns true if the given row is within the current user's scope (for GET by id / PATCH / DELETE checks).
 */
export async function rowInScope(entity: string, table: any, row: Record<string, unknown> | null, user: JwtUser): Promise<boolean> {
    if (!row || !user?.id) return false;
    if (user.role === 'admin') return true;

    switch (entity) {
        case 'booking': {
            if (row.client_id === user.id) return true;
            const barberRows = await db.select({ id: schema.barbers.id }).from(schema.barbers).where(eq(schema.barbers.user_id, user.id));
            const shopRows = await db.select({ id: schema.shops.id }).from(schema.shops).where(eq(schema.shops.owner_id, user.id));
            if (barberRows.some(b => b.id === row.barber_id)) return true;
            if (shopRows.some(s => s.id === row.shop_id)) return true;
            return false;
        }
        case 'loyalty_profile':
        case 'loyalty_transaction':
            return row.user_id === user.id;
        case 'message':
            return row.sender_id === user.id || row.receiver_id === user.id;
        case 'notification':
            return row.user_id === user.id;
        case 'payout': {
            const barberRows = await db.select({ id: schema.barbers.id }).from(schema.barbers).where(eq(schema.barbers.user_id, user.id));
            return barberRows.some(b => b.id === row.provider_id);
        }
        case 'favorite':
            return row.user_id === user.id;
        case 'dispute': {
            const [booking] = await db.select({ client_id: schema.bookings.client_id, barber_id: schema.bookings.barber_id, shop_id: schema.bookings.shop_id })
                .from(schema.bookings).where(eq(schema.bookings.id, row.booking_id as string));
            if (!booking) return false;
            if (booking.client_id === user.id) return true;
            const barberRows = await db.select({ id: schema.barbers.id }).from(schema.barbers).where(eq(schema.barbers.user_id, user.id));
            const shopRows = await db.select({ id: schema.shops.id }).from(schema.shops).where(eq(schema.shops.owner_id, user.id));
            if (barberRows.some(b => b.id === booking.barber_id)) return true;
            if (shopRows.some(s => s.id === booking.shop_id)) return true;
            return false;
        }
        case 'audit_log':
            return row.actor_id === user.id;
        case 'waiting_list_entry': {
            if (row.client_id === user.id) return true;
            const barberRows = await db.select({ id: schema.barbers.id }).from(schema.barbers).where(eq(schema.barbers.user_id, user.id));
            return barberRows.some(b => b.id === row.barber_id);
        }
        default:
            return false;
    }
}
