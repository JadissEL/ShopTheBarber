import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { authenticateRequest } from '../auth/requestUser';
import { assertShopManager } from '../shop/logic';
import {
    getChildrenFriendlyConfig,
    serializeChildrenFriendlySettings,
    serializeEffectiveChildrenFriendly,
} from './logic';

type AuthUser = { id: string; email?: string; role?: string; full_name?: string };

type AuthedRequest = {
    user?: AuthUser;
    entityScopeCache?: Parameters<typeof assertShopManager>[2];
};

async function requireAuth(
    request: Parameters<typeof authenticateRequest>[0],
    reply: Parameters<typeof authenticateRequest>[1]
): Promise<AuthUser | null> {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    return (request as AuthedRequest).user ?? null;
}

function parseBodyFlag(body: { children_friendly?: unknown }): boolean {
    return body.children_friendly === true;
}

export async function childrenFriendlyRoutes(fastify: FastifyInstance) {
    fastify.get('/api/children-friendly/config', async (_request, reply) => {
        return reply.send(getChildrenFriendlyConfig());
    });

    fastify.get('/api/provider/children-friendly', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        if (!['barber', 'shop_owner', 'admin', 'provider'].includes(user.role ?? '')) {
            return reply.status(403).send({ error: 'Provider access required' });
        }

        const barber = await prisma.barbers.findFirst({ where: { user_id: user.id } });
        let shop: { id: string; name: string; children_friendly: boolean | null } | null = null;

        if (barber?.shop_id) {
            shop = await prisma.shops.findUnique({
                where: { id: barber.shop_id },
                select: { id: true, name: true, children_friendly: true },
            });
        }
        if (!shop) {
            shop = await prisma.shops.findFirst({
                where: { owner_id: user.id },
                select: { id: true, name: true, children_friendly: true },
            });
        }

        return {
            barber: barber
                ? serializeChildrenFriendlySettings({
                      id: barber.id,
                      name: barber.name,
                      children_friendly: barber.children_friendly,
                  })
                : null,
            shop: shop ? serializeChildrenFriendlySettings(shop) : null,
        };
    });

    fastify.put<{ Body: { children_friendly?: boolean } }>(
        '/api/provider/barber/children-friendly',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            const flag = parseBodyFlag(request.body ?? {});

            let barber = await prisma.barbers.findFirst({ where: { user_id: user.id } });
            if (!barber && ['barber', 'shop_owner', 'provider'].includes(user.role ?? '')) {
                barber = await prisma.barbers.create({
                    data: {
                        user_id: user.id,
                        name: user.full_name || user.email || 'Barber',
                        children_friendly: flag,
                    },
                });
            }
            if (!barber) return reply.status(404).send({ error: 'Barber profile not found' });
            if (barber.user_id !== user.id && user.role !== 'admin') {
                return reply.status(403).send({ error: 'Not allowed' });
            }

            const updated = await prisma.barbers.update({
                where: { id: barber.id },
                data: { children_friendly: flag, updated_at: new Date().toISOString() },
            });
            return serializeChildrenFriendlySettings(updated);
        }
    );

    fastify.put<{ Params: { shopId: string }; Body: { children_friendly?: boolean } }>(
        '/api/provider/shop/:shopId/children-friendly',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            const { shopId } = request.params;
            const flag = parseBodyFlag(request.body ?? {});

            const shop = await prisma.shops.findUnique({ where: { id: shopId } });
            if (!shop) return reply.status(404).send({ error: 'Shop not found' });

            const isOwner = shop.owner_id === user.id;
            if (!isOwner && user.role !== 'admin') {
                await assertShopManager(user, shopId, (request as AuthedRequest).entityScopeCache);
            }

            const updated = await prisma.shops.update({
                where: { id: shopId },
                data: { children_friendly: flag, updated_at: new Date().toISOString() },
            });
            return serializeChildrenFriendlySettings(updated);
        }
    );

    fastify.get<{ Params: { id: string } }>('/api/barbers/:id/children-friendly', async (request, reply) => {
        const { id } = request.params;
        const barber = await prisma.barbers.findUnique({ where: { id } });
        if (!barber) return reply.status(404).send({ error: 'Barber not found' });

        let shop: { children_friendly: boolean | null; name: string } | null = null;
        if (barber.shop_id) {
            shop = await prisma.shops.findUnique({
                where: { id: barber.shop_id },
                select: { children_friendly: true, name: true },
            });
        }
        return serializeEffectiveChildrenFriendly(barber, shop);
    });

    fastify.get<{ Params: { id: string } }>('/api/shops/:id/children-friendly', async (request, reply) => {
        const { id } = request.params;
        const shop = await prisma.shops.findUnique({ where: { id } });
        if (!shop) return reply.status(404).send({ error: 'Shop not found' });
        return serializeChildrenFriendlySettings(shop);
    });
}
