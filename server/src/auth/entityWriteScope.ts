/**
 * Write-time FK / ownership validation for the generic entity router.
 * Complements rowInScope (read/update/delete on existing rows).
 */
import type { FastifyReply } from 'fastify';
import { prisma } from '../db/prisma';
import {
    type EntityScopeCache,
    getBarberShopIdsForUser,
    getManagedShopIdsForUser,
} from '../entityScope';
import { isAdminRole } from './platformRbac';

export type ScopeUser = { id: string; role?: string | null };

const USER_OWNED_ENTITIES = new Set(['favorite', 'wishlist_item']);

/** Entities allowed via generic POST (excluding dedicated handlers like promo_code). */
export function isGenericCreateAllowed(entity: string): boolean {
    const AUTH_WRITE = new Set([
        'barber',
        'shop',
        'service',
        'shift',
        'time_block',
        'shop_member',
        'staff_service_config',
        'review',
        'shop_inventory_item',
        'shop_expense',
        'barber_video',
        'inspiration_post',
        'legal_document',
    ]);
    const ADMIN_ONLY = new Set(['pricing_rule', 'brand', 'brand_accolade', 'brand_collection']);
    if (AUTH_WRITE.has(entity)) return true;
    if (ADMIN_ONLY.has(entity)) return true;
    if (USER_OWNED_ENTITIES.has(entity)) return true;
    return false;
}

async function managedShopIds(userId: string, cache?: EntityScopeCache): Promise<string[]> {
    return getManagedShopIdsForUser(userId, cache);
}

async function barberShopScope(userId: string, cache?: EntityScopeCache) {
    if (cache) {
        const { barberIds, shopIds } = await cache.getBarberShopIdsForUser(userId);
        return { barberIds, shopIds, managedShopIds: await managedShopIds(userId, cache) };
    }
    const { barberIds, shopIds } = await getBarberShopIdsForUser(userId);
    return { barberIds, shopIds, managedShopIds: await managedShopIds(userId, cache) };
}

function shopIdInList(shopId: unknown, ids: string[]): boolean {
    return shopId != null && shopId !== '' && ids.includes(String(shopId));
}

function barberIdInList(barberId: unknown, ids: string[]): boolean {
    return barberId != null && barberId !== '' && ids.includes(String(barberId));
}

/**
 * Returns true when a 403/400 response was sent.
 */
export async function denyWriteScopeOnCreate(
    entity: string,
    data: Record<string, unknown>,
    user: ScopeUser,
    cache: EntityScopeCache | undefined,
    reply: FastifyReply,
): Promise<boolean> {
    if (!user?.id) {
        reply.status(401).send({ error: 'Unauthorized' });
        return true;
    }
    if (isAdminRole(user.role)) return false;

    if (USER_OWNED_ENTITIES.has(entity)) {
        if (data.user_id !== undefined && data.user_id !== user.id) {
            reply.status(403).send({ error: 'Cannot create records for another user' });
            return true;
        }
        data.user_id = user.id;
        return false;
    }

    const { barberIds, shopIds, managedShopIds } = await barberShopScope(user.id, cache);

    switch (entity) {
        case 'barber': {
            if (data.user_id !== undefined && data.user_id !== user.id) {
                reply.status(403).send({ error: 'Cannot create barber profiles for another user' });
                return true;
            }
            data.user_id = user.id;
            return false;
        }
        case 'shop': {
            if (data.owner_id !== undefined && data.owner_id !== user.id) {
                reply.status(403).send({ error: 'Cannot create shops for another user' });
                return true;
            }
            data.owner_id = user.id;
            return false;
        }
        case 'service': {
            const bid = data.barber_id;
            const sid = data.shop_id;
            const barberOk = barberIdInList(bid, barberIds);
            const shopOk = shopIdInList(sid, managedShopIds);
            if (!barberOk && !shopOk) {
                reply.status(403).send({ error: 'Service must belong to your barber or shop' });
                return true;
            }
            if (bid && !barberOk) {
                reply.status(403).send({ error: 'Invalid barber_id for this account' });
                return true;
            }
            if (sid && !shopOk) {
                reply.status(403).send({ error: 'Invalid shop_id for this account' });
                return true;
            }
            return false;
        }
        case 'shift':
        case 'time_block':
        case 'barber_video': {
            if (!barberIdInList(data.barber_id, barberIds)) {
                reply.status(403).send({ error: 'Invalid barber_id for this account' });
                return true;
            }
            return false;
        }
        case 'shop_member': {
            const sid = data.shop_id;
            if (!shopIdInList(sid, managedShopIds)) {
                reply.status(403).send({ error: 'You cannot add members to this shop' });
                return true;
            }
            const memberRole = data.role != null ? String(data.role) : 'barber';
            if (memberRole === 'owner') {
                const shop = await prisma.shops.findUnique({
                    where: { id: String(sid) },
                    select: { owner_id: true },
                });
                if (shop?.owner_id !== user.id) {
                    reply.status(403).send({ error: 'Only the shop owner may assign owner role' });
                    return true;
                }
            }
            return false;
        }
        case 'staff_service_config': {
            const memberId = data.shop_member_id;
            if (!memberId) {
                reply.status(400).send({ error: 'shop_member_id is required' });
                return true;
            }
            const member = await prisma.shop_members.findUnique({
                where: { id: String(memberId) },
                select: { shop_id: true },
            });
            if (!member || !shopIdInList(member.shop_id, managedShopIds)) {
                reply.status(403).send({ error: 'Invalid shop_member_id for this account' });
                return true;
            }
            if (data.service_id) {
                const service = await prisma.services.findUnique({
                    where: { id: String(data.service_id) },
                    select: { shop_id: true, barber_id: true },
                });
                if (!service) {
                    reply.status(400).send({ error: 'Invalid service_id' });
                    return true;
                }
                const serviceOk =
                    shopIdInList(service.shop_id, managedShopIds) ||
                    barberIdInList(service.barber_id, barberIds);
                if (!serviceOk) {
                    reply.status(403).send({ error: 'Invalid service_id for this shop' });
                    return true;
                }
            }
            return false;
        }
        case 'shop_inventory_item':
        case 'shop_expense': {
            if (!shopIdInList(data.shop_id, managedShopIds)) {
                reply.status(403).send({ error: 'Invalid shop_id for this account' });
                return true;
            }
            return false;
        }
        case 'inspiration_post': {
            if (data.author_id !== undefined && data.author_id !== user.id) {
                reply.status(403).send({ error: 'Cannot publish as another author' });
                return true;
            }
            data.author_id = user.id;
            return false;
        }
        case 'review': {
            if (data.reviewer_id !== undefined && data.reviewer_id !== user.id) {
                reply.status(403).send({ error: 'Cannot submit reviews as another user' });
                return true;
            }
            data.reviewer_id = user.id;
            return false;
        }
        default:
            return false;
    }
}

/**
 * Validates foreign keys present in PATCH body. Returns true when reply was sent.
 */
export async function denyWriteScopeOnPatch(
    entity: string,
    data: Record<string, unknown>,
    user: ScopeUser,
    cache: EntityScopeCache | undefined,
    reply: FastifyReply,
): Promise<boolean> {
    if (!user?.id) {
        reply.status(401).send({ error: 'Unauthorized' });
        return true;
    }
    if (isAdminRole(user.role)) return false;

    const { barberIds, managedShopIds } = await barberShopScope(user.id, cache);

    if (entity === 'service') {
        if (data.barber_id !== undefined && !barberIdInList(data.barber_id, barberIds)) {
            reply.status(403).send({ error: 'Invalid barber_id' });
            return true;
        }
        if (data.shop_id !== undefined && !shopIdInList(data.shop_id, managedShopIds)) {
            reply.status(403).send({ error: 'Invalid shop_id' });
            return true;
        }
    }

    if (entity === 'shift' || entity === 'time_block' || entity === 'barber_video') {
        if (data.barber_id !== undefined && !barberIdInList(data.barber_id, barberIds)) {
            reply.status(403).send({ error: 'Invalid barber_id' });
            return true;
        }
    }

    if (entity === 'shop_member') {
        if (data.shop_id !== undefined && !shopIdInList(data.shop_id, managedShopIds)) {
            reply.status(403).send({ error: 'Invalid shop_id' });
            return true;
        }
        if (data.role === 'owner' && data.shop_id) {
            const shop = await prisma.shops.findUnique({
                where: { id: String(data.shop_id) },
                select: { owner_id: true },
            });
            if (shop?.owner_id !== user.id) {
                reply.status(403).send({ error: 'Only the shop owner may assign owner role' });
                return true;
            }
        }
    }

    if (entity === 'shop_inventory_item' || entity === 'shop_expense') {
        if (data.shop_id !== undefined && !shopIdInList(data.shop_id, managedShopIds)) {
            reply.status(403).send({ error: 'Invalid shop_id' });
            return true;
        }
    }

    if (entity === 'promo_code' && data.shop_id !== undefined) {
        const sid = data.shop_id;
        if (sid == null || sid === '') {
            reply.status(403).send({ error: 'Only admins may set platform-wide shop_id' });
            return true;
        }
        if (!shopIdInList(sid, managedShopIds)) {
            reply.status(403).send({ error: 'Invalid shop scope' });
            return true;
        }
    }

    if (entity === 'barber' && data.user_id !== undefined && data.user_id !== user.id) {
        reply.status(403).send({ error: 'Cannot reassign barber profile' });
        return true;
    }

    if (entity === 'shop' && data.owner_id !== undefined && data.owner_id !== user.id) {
        reply.status(403).send({ error: 'Cannot reassign shop ownership' });
        return true;
    }

    if (entity === 'inspiration_post' && data.author_id !== undefined && data.author_id !== user.id) {
        reply.status(403).send({ error: 'Cannot reassign author' });
        return true;
    }

    return false;
}
