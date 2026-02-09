import { FastifyInstance } from 'fastify';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const VALID_FULFILLMENT = ['confirmed', 'preparing', 'in_transit', 'delivered'] as const;

export async function orderRoutes(fastify: FastifyInstance) {
    const getUserId = async (request: any): Promise<string | null> => {
        try {
            await request.jwtVerify();
            const payload = request.user as { id: string };
            return payload.id;
        } catch {
            return null;
        }
    };

    const getAuthPayload = async (request: any): Promise<{ id: string; role?: string } | null> => {
        try {
            await request.jwtVerify();
            return request.user as { id: string; role?: string };
        } catch {
            return null;
        }
    };

    // GET /api/orders — list current user's orders (newest first)
    fastify.get('/api/orders', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Sign in to view orders' });
        try {
            const list = await db.select().from(schema.orders).where(eq(schema.orders.user_id, userId)).orderBy(desc(schema.orders.created_at));
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
            const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, id));
            if (!order) return reply.status(404).send({ error: 'Order not found' });
            if (order.user_id !== userId) return reply.status(404).send({ error: 'Order not found' });
            const items = await db.select().from(schema.order_items).where(eq(schema.order_items.order_id, id));
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
            const updated = await db.update(schema.orders).set(updates).where(eq(schema.orders.id, id)).returning().get();
            if (!updated) return reply.status(404).send({ error: 'Order not found' });
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
            const rows = await db
                .select({
                    id: schema.orders.id,
                    user_id: schema.orders.user_id,
                    status: schema.orders.status,
                    payment_status: schema.orders.payment_status,
                    fulfillment_status: schema.orders.fulfillment_status,
                    estimated_delivery_at: schema.orders.estimated_delivery_at,
                    total: schema.orders.total,
                    created_at: schema.orders.created_at,
                    order_number: schema.orders.order_number,
                    user_email: schema.users.email,
                    user_name: schema.users.full_name,
                })
                .from(schema.orders)
                .leftJoin(schema.users, eq(schema.orders.user_id, schema.users.id))
                .orderBy(desc(schema.orders.created_at));
            return rows.map((o) => ({
                ...o,
                order_number: o.order_number || 'EMG-' + o.id.slice(-6).toUpperCase(),
            }));
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });
}
