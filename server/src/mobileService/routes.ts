import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { authenticateRequest } from '../auth/requestUser';
import {
    assertAtLeastOneServiceLocation,
    offersShopService,
} from '../lib/serviceLocation';

export const MOBILE_SERVICE_LABEL = 'At-home visits';

export async function mobileServiceRoutes(fastify: FastifyInstance) {
    fastify.get('/api/mobile-service/config', async () => ({
        label: MOBILE_SERVICE_LABEL,
        description:
            'Offer grooming at the client\'s home, office, or hotel. You appear in mobile barber search and on the homepage.',
    }));

    fastify.get('/api/provider/mobile-service', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user!;
        if (!['barber', 'shop_owner', 'admin', 'provider'].includes(user.role ?? '')) {
            return reply.status(403).send({ error: 'Provider access required' });
        }

        const barber = await prisma.barbers.findFirst({ where: { user_id: user.id } });
        return {
            barber_id: barber?.id ?? null,
            offers_mobile_service: barber?.offers_mobile_service ?? false,
        };
    });

    fastify.put<{ Body: { offers_mobile_service?: boolean } }>(
        '/api/provider/barber/mobile-service',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user!;
            const flag = request.body?.offers_mobile_service === true;

            let barber = await prisma.barbers.findFirst({ where: { user_id: user.id } });
            const nextShop = offersShopService(barber ?? {});
            const nextMobile = flag;
            try {
                assertAtLeastOneServiceLocation(nextShop, nextMobile);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Invalid service location settings';
                return reply.status(400).send({ error: msg });
            }

            if (!barber && ['barber', 'shop_owner', 'provider'].includes(user.role ?? '')) {
                barber = await prisma.barbers.create({
                    data: {
                        user_id: user.id,
                        name: user.full_name || user.email || 'Barber',
                        offers_mobile_service: flag,
                    },
                });
            }
            if (!barber) return reply.status(404).send({ error: 'Barber profile not found' });
            if (barber.user_id !== user.id && user.role !== 'admin') {
                return reply.status(403).send({ error: 'Not allowed' });
            }

            const updated = await prisma.barbers.update({
                where: { id: barber.id },
                data: { offers_mobile_service: flag, updated_at: new Date().toISOString() },
            });

            return {
                barber_id: updated.id,
                offers_mobile_service: updated.offers_mobile_service ?? false,
            };
        }
    );

    fastify.get<{ Params: { id: string } }>('/api/barbers/:id/mobile-service', async (request, reply) => {
        const barber = await prisma.barbers.findUnique({
            where: { id: request.params.id },
            select: { id: true, offers_mobile_service: true, name: true },
        });
        if (!barber) return reply.status(404).send({ error: 'Barber not found' });
        return {
            barber_id: barber.id,
            offers_mobile_service: barber.offers_mobile_service ?? false,
            label: MOBILE_SERVICE_LABEL,
        };
    });
}
