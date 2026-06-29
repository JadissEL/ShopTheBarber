import { prisma } from '../db/prisma';
import { type ShopPermission, roleHasPermission, normalizeLegacyRole } from './shopRbac';
import type { FastifyReply, FastifyRequest } from 'fastify';

export async function resolveShopMemberRole(userId: string, shopId: string): Promise<string | null> {
    const shop = await prisma.shops.findUnique({ where: { id: shopId }, select: { owner_id: true } });
    if (shop?.owner_id === userId) return 'owner';

    const member = await prisma.shop_members.findFirst({
        where: { shop_id: shopId, user_id: userId, status: 'active' },
        select: { role: true },
    });
    if (!member?.role) return null;
    return normalizeLegacyRole(member.role);
}

export async function userHasShopPermission(
    userId: string,
    shopId: string,
    permission: ShopPermission,
    userRole?: string | null
): Promise<boolean> {
    if (userRole === 'admin') return true;
    const role = await resolveShopMemberRole(userId, shopId);
    if (!role) return false;
    return roleHasPermission(role, permission);
}

export async function requireShopPermission(
    request: FastifyRequest,
    reply: FastifyReply,
    shopId: string,
    permission: ShopPermission
): Promise<boolean> {
    const user = request.user as { id: string; role?: string } | undefined;
    if (!user?.id) {
        reply.status(401).send({ error: 'Unauthorized' });
        return false;
    }
    const allowed = await userHasShopPermission(user.id, shopId, permission, user.role);
    if (!allowed) {
        reply.status(403).send({ error: 'Insufficient shop permissions', required: permission });
        return false;
    }
    return true;
}
