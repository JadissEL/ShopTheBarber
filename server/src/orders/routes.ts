import { type FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { resolveOptionalUserId, resolveUserFromBearer } from '../auth/requestUser';
import { updateFulfillment, FULFILLMENT_STATUSES } from '../shipping/logic';

export async function orderRoutes(fastify: FastifyInstance) {
    const getUserId = async (request: { headers: { authorization?: string } }): Promise<string | null> => {
        return await resolveOptionalUserId(request);
    };

    const getAuthPayload = async (request: { headers: { authorization?: string } }): Promise<{ id: string; role?: string } | null> => {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
        const user = await resolveUserFromBearer(authHeader.slice(7));
        return user ? { id: user.id, role: user.role } : null;
    };

    // GET /api/orders, list current user's orders (newest first)
    fastify.get('/api/orders', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Sign in to view orders' });
        try {
            const list = await prisma.orders.findMany({
                where: { user_id: userId },
                orderBy: { created_at: 'desc' },
            });
            return list.map((o) => ({ ...o, order_number: o.order_number || `EMG-${  o.id.slice(-6).toUpperCase()}` }));
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to list orders';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    // GET /api/orders/:id, single order with items + fulfillments (only own order)
    fastify.get<{ Params: { id: string } }>('/api/orders/:id', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Sign in to view order' });
        const { id } = request.params;
        try {
            const order = await prisma.orders.findUnique({ where: { id } });
            if (!order) return reply.status(404).send({ error: 'Order not found' });
            if (order.user_id !== userId) return reply.status(404).send({ error: 'Order not found' });
            const [items, fulfillments] = await Promise.all([
                prisma.order_items.findMany({ where: { order_id: id } }),
                prisma.order_fulfillments.findMany({ where: { order_id: id } }),
            ]);
            const orderNumber = order.order_number || `EMG-${  order.id.slice(-6).toUpperCase()}`;
            return { ...order, order_number: orderNumber, items, fulfillments };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to fetch order';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    // PATCH /api/orders/:id, update fulfillment (admin: whole order; sellers use /api/shipping/fulfillments/:id)
    fastify.patch<{ Params: { id: string }; Body: { fulfillment_status?: string; estimated_delivery_at?: string; tracking_number?: string; carrier?: string } }>('/api/orders/:id', async (request, reply) => {
        const payload = await getAuthPayload(request);
        if (!payload) return reply.status(401).send({ error: 'Unauthorized' });
        if (payload.role !== 'admin') return reply.status(403).send({ error: 'Admin only, sellers use /api/shipping/fulfillments/:id' });
        const { id } = request.params;
        const body = request.body;
        try {
            const existing = await prisma.orders.findUnique({ where: { id } });
            if (!existing) return reply.status(404).send({ error: 'Order not found' });

            const fulfillments = await prisma.order_fulfillments.findMany({ where: { order_id: id } });
            if (fulfillments.length > 0 && body.fulfillment_status) {
                for (const f of fulfillments) {
                    await updateFulfillment(payload.id, payload.role, f.id, {
                        fulfillment_status: body.fulfillment_status as (typeof FULFILLMENT_STATUSES)[number],
                        tracking_number: body.tracking_number,
                        carrier: body.carrier,
                        estimated_delivery_at: body.estimated_delivery_at,
                    });
                }
                const updated = await prisma.orders.findUnique({ where: { id } });
                return { ...updated!, order_number: updated!.order_number || `EMG-${  updated!.id.slice(-6).toUpperCase()}` };
            }

            const updates: Partial<{ fulfillment_status: string; estimated_delivery_at: string; tracking_number: string; carrier: string }> = {};
            if (body.fulfillment_status && (FULFILLMENT_STATUSES as readonly string[]).includes(body.fulfillment_status)) {
                updates.fulfillment_status = body.fulfillment_status;
            }
            if (body.estimated_delivery_at != null) updates.estimated_delivery_at = body.estimated_delivery_at;
            if (body.tracking_number != null) updates.tracking_number = body.tracking_number;
            if (body.carrier != null) updates.carrier = body.carrier;
            if (Object.keys(updates).length === 0) return reply.status(400).send({ error: 'No valid updates' });

            const updated = await prisma.orders.update({ where: { id }, data: updates });
            return { ...updated, order_number: updated.order_number || `EMG-${  updated.id.slice(-6).toUpperCase()}` };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to update order';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });

    // GET /api/admin/orders, list all orders (admin only), with customer email/name
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
                    tracking_number: o.tracking_number,
                    carrier: o.carrier,
                    total: o.total,
                    created_at: o.created_at,
                    order_number: o.order_number || `EMG-${  o.id.slice(-6).toUpperCase()}`,
                    user_email: u?.email ?? null,
                    user_name: u?.full_name ?? null,
                };
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to list admin orders';
            fastify.log.error(e);
            return reply.status(500).send({ error: msg });
        }
    });
}
