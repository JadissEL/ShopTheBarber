import { type FastifyInstance } from 'fastify';
import { authenticateRequest } from '../../auth/requestUser';
import { requireShopPermission } from '../../auth/shopPermissionGuard';
import { prisma } from '../../db/prisma';
import {
    assignBarberToChair,
    listShopChairs,
    setBarberBufferMinutes,
    upsertShopChair,
} from './logic';

async function requireShopOwner(request: any, reply: any, shopId: string) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    const user = request.user as { id: string; role?: string };
    if (user.role === 'admin') return user;
    const shop = await prisma.shops.findUnique({ where: { id: shopId }, select: { owner_id: true } });
    if (!shop || shop.owner_id !== user.id) {
        reply.status(403).send({ error: 'Shop owner access required' });
        return null;
    }
    return user;
}

async function requireBarberOwner(request: any, reply: any, barberId: string) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    const user = request.user as { id: string; role?: string };
    if (user.role === 'admin') return user;
    const barber = await prisma.barbers.findUnique({
        where: { id: barberId },
        select: { user_id: true },
    });
    if (!barber || barber.user_id !== user.id) {
        reply.status(403).send({ error: 'Barber access required' });
        return null;
    }
    return user;
}

export async function capacityRoutes(fastify: FastifyInstance) {
    fastify.get('/api/shops/:shopId/chairs', async (request, reply) => {
        const { shopId } = request.params as { shopId: string };
        try {
            return await listShopChairs(shopId);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load chairs';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.post<{ Params: { shopId: string } }>('/api/shops/:shopId/chairs', async (request, reply) => {
        const { shopId } = request.params;
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const allowed = await requireShopPermission(request, reply, shopId, 'shop:edit');
        if (!allowed) return;
        const body = request.body as { id?: string; name?: string; is_active?: boolean; sort_order?: number };
        if (!body.name?.trim()) return reply.status(400).send({ error: 'name is required' });
        try {
            return await upsertShopChair(shopId, {
                id: body.id,
                name: body.name,
                is_active: body.is_active,
                sort_order: body.sort_order,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to save chair';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.post('/api/chairs/:chairId/assignments', async (request, reply) => {
        const { chairId } = request.params as { chairId: string };
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string; role?: string };
        const chair = await prisma.shop_chairs.findUnique({
            where: { id: chairId },
            select: { shop_id: true },
        });
        if (!chair?.shop_id) {
            return reply.status(404).send({ error: 'Chair not found' });
        }
        const allowed = await requireShopPermission(request, reply, chair.shop_id, 'bookings:manage');
        if (!allowed) return;
        const body = request.body as {
            barber_id?: string;
            day_of_week?: string;
            effective_from?: string;
            effective_to?: string;
        };
        if (!body.barber_id) return reply.status(400).send({ error: 'barber_id is required' });
        try {
            return await assignBarberToChair({
                chairId,
                barberId: body.barber_id,
                dayOfWeek: body.day_of_week,
                effectiveFrom: body.effective_from,
                effectiveTo: body.effective_to,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to assign barber';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.put('/api/barbers/:barberId/capacity-settings', async (request, reply) => {
        const { barberId } = request.params as { barberId: string };
        const user = await requireBarberOwner(request, reply, barberId);
        if (!user) return;
        const body = request.body as { default_buffer_minutes?: number };
        try {
            return await setBarberBufferMinutes(barberId, body.default_buffer_minutes ?? 0);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to update capacity settings';
            return reply.status(500).send({ error: msg });
        }
    });
}
