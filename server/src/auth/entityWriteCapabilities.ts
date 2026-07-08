import type { FastifyReply } from 'fastify';
import {
    capabilityContextFromUser,
    hasAnyCapability,
    type CapabilityContext,
    type CapabilityKey,
} from './capabilities';
import { resolveCompanyCommerceEnabled } from './companyCommerce';
import { isAdminRole } from './platformRbac';
import type { AuthedRequest } from './authPreHandlers';

/** Entities writable by platform admin only via generic router. */
export const ADMIN_ONLY_ENTITY_WRITES = new Set([
    'legal_document',
    'brand',
    'brand_accolade',
    'brand_collection',
]);

/** Maps generic entity names to required capability(ies). OR when array. */
export const ENTITY_WRITE_CAPABILITY: Partial<Record<string, CapabilityKey | CapabilityKey[]>> = {
    barber: 'barber.write',
    shop: 'shop.write',
    service: 'service.write',
    shift: 'booking.provider.tools',
    time_block: 'booking.provider.tools',
    shop_member: 'staff.manage',
    staff_service_config: 'staff.manage',
    shop_inventory_item: 'inventory.manage',
    shop_expense: 'expenses.manage',
    barber_video: 'booking.provider.tools',
    inspiration_post: ['article.write', 'booking.provider.tools'],
    promo_code: 'promotion.write',
};

function entityWriteCapabilities(entity: string): CapabilityKey[] | 'admin-only' | null {
    if (ADMIN_ONLY_ENTITY_WRITES.has(entity)) return 'admin-only';
    const mapped = ENTITY_WRITE_CAPABILITY[entity];
    if (!mapped) return null;
    return Array.isArray(mapped) ? mapped : [mapped];
}

/** Build request capability context (async for company commerce flag). */
export async function buildCapabilityContextForUser(user: {
    id: string;
    role?: string | null;
    account_type?: string | null;
}): Promise<CapabilityContext> {
    const companyCommerceEnabled = await resolveCompanyCommerceEnabled(user);
    return capabilityContextFromUser({ ...user, companyCommerceEnabled });
}

/**
 * Returns true when the reply was sent (caller should return early).
 */
export async function denyGenericEntityWriteUnlessCapable(
    entity: string,
    request: AuthedRequest,
    reply: FastifyReply,
): Promise<boolean> {
    const user = request.user;
    if (!user?.id) {
        reply.status(401).send({ error: 'Unauthorized' });
        return true;
    }

    if (isAdminRole(user.role)) return false;

    const caps = entityWriteCapabilities(entity);
    if (caps === 'admin-only') {
        reply.status(403).send({ error: 'Admin access required for this resource' });
        return true;
    }
    if (caps === null) {
        reply.status(403).send({ error: 'Write not permitted for this resource' });
        return true;
    }

    if (caps.length === 0) {
        reply.status(403).send({ error: 'Admin access required for this resource' });
        return true;
    }

    const ctx = await buildCapabilityContextForUser(user);
    if (hasAnyCapability(ctx, caps)) return false;

    reply.status(403).send({ error: 'Insufficient permissions for this resource' });
    return true;
}

/** Sync check when context is already resolved (tests / internal). */
export function canWriteEntity(entity: string, ctx: CapabilityContext): boolean {
    if (isAdminRole(ctx.role)) return true;
    const caps = entityWriteCapabilities(entity);
    if (caps === 'admin-only') return false;
    if (!caps) return false;
    return hasAnyCapability(ctx, caps);
}
