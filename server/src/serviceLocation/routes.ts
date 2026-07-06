import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { authenticateRequest } from '../auth/requestUser';
import { canAccessBookingProviderTools } from '../auth/platformRbac';
import { assertShopManager } from '../shop/logic';
import {
    assertAtLeastOneServiceLocation,
    getServiceLocationModes,
    offersMobileService,
    offersShopService,
} from '../lib/serviceLocation';
import { MOBILE_SERVICE_LABEL } from '../mobileService/routes';

export const SHOP_SERVICE_LABEL = 'In-shop visits';

function serializeServiceLocations(entity: {
    id: string;
    name?: string | null;
    offers_shop_service?: boolean | null;
    offers_mobile_service?: boolean | null;
}) {
    const modes = getServiceLocationModes(entity);
    return {
        id: entity.id,
        name: entity.name ?? null,
        offers_shop_service: modes.shop,
        offers_mobile_service: modes.mobile,
        shop_label: SHOP_SERVICE_LABEL,
        mobile_label: MOBILE_SERVICE_LABEL,
        shop_only: modes.shop_only,
        mobile_only: modes.mobile_only,
        both: modes.both,
    };
}

async function resolveProviderShop(userId: string, barberShopId?: string | null) {
    if (barberShopId) {
        const shop = await prisma.shops.findUnique({
            where: { id: barberShopId },
            select: {
                id: true,
                name: true,
                offers_shop_service: true,
                offers_mobile_service: true,
                owner_id: true,
            },
        });
        if (shop) return shop;
    }
    return prisma.shops.findFirst({
        where: { owner_id: userId },
        select: {
            id: true,
            name: true,
            offers_shop_service: true,
            offers_mobile_service: true,
            owner_id: true,
        },
    });
}

export async function serviceLocationRoutes(fastify: FastifyInstance) {
    fastify.get('/api/service-location/config', async () => ({
        shop_label: SHOP_SERVICE_LABEL,
        mobile_label: MOBILE_SERVICE_LABEL,
        description:
            'Barbers and shops choose in-shop, at-home, or both. Clients only see booking options that match what you offer.',
    }));

    fastify.get('/api/provider/service-locations', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user!;

        if (!canAccessBookingProviderTools(user.role, user.account_type)) {
            return reply.status(403).send({ error: 'Booking provider access required' });
        }

        const barber = await prisma.barbers.findFirst({ where: { user_id: user.id } });
        const shop = await resolveProviderShop(user.id, barber?.shop_id);

        return {
            barber: barber
                ? serializeServiceLocations(barber)
                : {
                      id: null,
                      offers_shop_service: true,
                      offers_mobile_service: false,
                      shop_only: true,
                      mobile_only: false,
                      both: false,
                  },
            shop: shop ? serializeServiceLocations(shop) : null,
        };
    });

    fastify.put<{
        Body: { offers_shop_service?: boolean; offers_mobile_service?: boolean };
    }>('/api/provider/barber/service-locations', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user!;

        const wantsShop = request.body?.offers_shop_service;
        const wantsMobile = request.body?.offers_mobile_service;

        let barber = await prisma.barbers.findFirst({ where: { user_id: user.id } });
        if (!barber && canAccessBookingProviderTools(user.role, user.account_type)) {
            barber = await prisma.barbers.create({
                data: {
                    user_id: user.id,
                    name: user.full_name || user.email || 'Barber',
                    offers_shop_service: wantsShop !== false,
                    offers_mobile_service: wantsMobile === true,
                },
            });
        }
        if (!barber) return reply.status(404).send({ error: 'Barber profile not found' });
        if (barber.user_id !== user.id && user.role !== 'admin') {
            return reply.status(403).send({ error: 'Not allowed' });
        }

        const nextShop = wantsShop !== undefined ? wantsShop : offersShopService(barber);
        const nextMobile = wantsMobile !== undefined ? wantsMobile : offersMobileService(barber);

        try {
            assertAtLeastOneServiceLocation(nextShop, nextMobile);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Invalid service location settings';
            return reply.status(400).send({ error: msg });
        }

        const updated = await prisma.barbers.update({
            where: { id: barber.id },
            data: {
                ...(wantsShop !== undefined ? { offers_shop_service: wantsShop } : {}),
                ...(wantsMobile !== undefined ? { offers_mobile_service: wantsMobile } : {}),
                updated_at: new Date().toISOString(),
            },
        });

        return serializeServiceLocations(updated);
    });

    fastify.put<{
        Params: { shopId: string };
        Body: { offers_shop_service?: boolean; offers_mobile_service?: boolean };
    }>('/api/provider/shop/:shopId/service-locations', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user!;

        const { shopId } = request.params;
        const shop = await prisma.shops.findUnique({ where: { id: shopId } });
        if (!shop) return reply.status(404).send({ error: 'Shop not found' });

        const isOwner = shop.owner_id === user.id;
        if (!isOwner && user.role !== 'admin') {
            await assertShopManager(user, shopId, request.entityScopeCache);
        }

        const wantsShop = request.body?.offers_shop_service;
        const wantsMobile = request.body?.offers_mobile_service;
        const nextShop = wantsShop !== undefined ? wantsShop : offersShopService(shop);
        const nextMobile = wantsMobile !== undefined ? wantsMobile : offersMobileService(shop);

        try {
            assertAtLeastOneServiceLocation(nextShop, nextMobile);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Invalid service location settings';
            return reply.status(400).send({ error: msg });
        }

        const updated = await prisma.shops.update({
            where: { id: shopId },
            data: {
                ...(wantsShop !== undefined ? { offers_shop_service: wantsShop } : {}),
                ...(wantsMobile !== undefined ? { offers_mobile_service: wantsMobile } : {}),
                updated_at: new Date().toISOString(),
            },
        });

        return serializeServiceLocations(updated);
    });

    fastify.get<{ Params: { id: string } }>('/api/barbers/:id/service-locations', async (request, reply) => {
        const barber = await prisma.barbers.findUnique({
            where: { id: request.params.id },
            select: { id: true, name: true, offers_shop_service: true, offers_mobile_service: true, shop_id: true },
        });
        if (!barber) return reply.status(404).send({ error: 'Barber not found' });
        return serializeServiceLocations(barber);
    });

    fastify.get<{ Params: { id: string } }>('/api/shops/:id/service-locations', async (request, reply) => {
        const shop = await prisma.shops.findUnique({
            where: { id: request.params.id },
            select: { id: true, name: true, offers_shop_service: true, offers_mobile_service: true },
        });
        if (!shop) return reply.status(404).send({ error: 'Shop not found' });
        return serializeServiceLocations(shop);
    });
}
