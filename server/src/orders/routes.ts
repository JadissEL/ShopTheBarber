import { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { resolveOptionalUserId, resolveUserFromBearer } from '../auth/requestUser';

const VALID_FULFILLMENT = ['confirmed', 'preparing', 'in_transit', 'delivered'] as const;

export async function orderRoutes(fastify: FastifyInstance) {
    const getUserId = async (request: any): Promise<string | null> => {
        return await resolveOptionalUserId(request);
    };

    const getAuthPayload = async (request: any): Promise<{ id: string; role?: string } | null> => {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
        const user = await resolveUserFromBearer(authHeader.slice(7));
        return user ? { id: user.id, role: user.role } : null;
    };

    // GET /api/orders — list current user's orders (newest first)
    fastify.get('/api/orders', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Sign in to view orders' });
        try {
            const list = await prisma.orders.findMany({
                where: { user_id: userId },
                orderBy: { created_at: 'desc' },
            });
            return list.map((o) => ({ ...o, order_number: o.order_number || 'EMG-' + o.id.slice(-6).toUpperCase() }));
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    // GET /api/orders/:id — single order with items (only own order)
    fastify.get<{ Params: { id: string } }>('/api/orders/:id', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Sign in to view order' });
        const { id } = request.params;
        try {
            const order = await prisma.orders.findUnique({ where: { id } });
            if (!order) return reply.status(404).send({ error: 'Order not found' });
            if (order.user_id !== userId) return reply.status(404).send({ error: 'Order not found' });
            const items = await prisma.order_items.findMany({ where: { order_id: id } });
            const orderNumber = order.order_number || 'EMG-' + order.id.slice(-6).toUpperCase();
            return { ...order, order_number: orderNumber, items };
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    // PATCH /api/orders/:id — update fulfillment (admin only)
    fastify.patch<{ Params: { id: string }; Body: { fulfillment_status?: string; estimated_delivery_at?: string } }>('/api/orders/:id', async (request, reply) => {
        const payload = await getAuthPayload(request);
        if (!payload) return reply.status(401).send({ error: 'Unauthorized' });
        if (payload.role !== 'admin') return reply.status(403).send({ error: 'Admin only' });
        const { id } = request.params;
        const body = request.body as { fulfillment_status?: string; estimated_delivery_at?: string };
        const updates: Partial<{ fulfillment_status: string; estimated_delivery_at: string }> = {};
        if (body.fulfillment_status && VALID_FULFILLMENT.includes(body.fulfillment_status as any)) {
            updates.fulfillment_status = body.fulfillment_status;
        }
        if (body.estimated_delivery_at != null) updates.estimated_delivery_at = body.estimated_delivery_at;
        if (Object.keys(updates).length === 0) return reply.status(400).send({ error: 'No valid updates' });
        try {
            const existing = await prisma.orders.findUnique({ where: { id } });
            if (!existing) return reply.status(404).send({ error: 'Order not found' });
            const updated = await prisma.orders.update({ where: { id }, data: updates });
            return { ...updated, order_number: updated.order_number || 'EMG-' + updated.id.slice(-6).toUpperCase() };
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    // GET /api/admin/orders — list all orders (admin only), with customer email/name
    fastify.get('/api/admin/orders', async (request, reply) => {
        const payload = await getAuthPayload(request);
        if (!payload) return reply.status(401).send({ error: 'Unauthorized' });
        if (payload.role !== 'admin') return reply.status(403).send({ error: 'Admin only' });
        try {
            const orders = await prisma.orders.findMany({ orderBy: { created_at: 'desc' } });
            const userIds = [...new Set(orders.map((o) => o.user_id).filter(Boolean))];
            const users = userIds.length
                ? await prisma.users.findMany({ where: { id: { in: userIds } } })
                : [];
            const userMap = Object.fromEntries(users.map((u) => [u.id, u]));
            return orders.map((o) => {
                const u = userMap[o.user_id];
                return {
                    id: o.id,
                    user_id: o.user_id,
                    status: o.status,
                    payment_status: o.payment_status,
                    fulfillment_status: o.fulfillment_status,
                    estimated_delivery_at: o.estimated_delivery_at,
                    total: o.total,
                    created_at: o.created_at,
                    order_number: o.order_number || 'EMG-' + o.id.slice(-6).toUpperCase(),
                    user_email: u?.email ?? null,
                    user_name: u?.full_name ?? null,
                };
            });
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });
}
