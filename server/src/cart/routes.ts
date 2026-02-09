import { FastifyInstance } from 'fastify';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function cartRoutes(fastify: FastifyInstance) {
    const getUserId = async (request: any, reply: any): Promise<string | null> => {
        try {
            await request.jwtVerify();
            const payload = request.user as { id: string };
            return payload.id;
        } catch {
            return null;
        }
    };

    // GET /api/cart — list cart items with product details (requires auth)
    fastify.get('/api/cart', async (request, reply) => {
        const userId = await getUserId(request, reply);
        if (!userId) {
            return reply.status(401).send({ error: 'Sign in to view your cart' });
        }
        try {
            const items = await db.select().from(schema.cart_items).where(eq(schema.cart_items.user_id, userId));
            const productIds = [...new Set(items.map((i) => i.product_id))];
            if (productIds.length === 0) {
                return items.map((i) => ({ ...i, product: null }));
            }
            const products = await db.select().from(schema.products).where(inArray(schema.products.id, productIds));
            const productMap = Object.fromEntries(products.map((p) => [p.id, p]));
            return items.map((item) => {
                const product = productMap[item.product_id];
                return {
                    id: item.id,
                    user_id: item.user_id,
                    product_id: item.product_id,
                    quantity: item.quantity,
                    created_at: item.created_at,
                    product: product
                        ? {
                            id: product.id,
                            name: product.name,
                            description: product.description,
                            price: product.price,
                            image_url: product.image_url,
                            category: product.category,
                            vendor_name: product.vendor_name,
                        }
                        : null,
                };
            });
        } catch (e: any) {
            fastify.log.error(e);
            const msg = (e?.message || '').toLowerCase();
            const schemaError = msg.includes('no such table') || msg.includes('sqlite_error') || e?.code === 'SQLITE_ERROR';
            if (schemaError) {
                return reply.status(503).send({
                    error: 'Database schema not ready',
                    hint: "Run 'npm run push' and optionally 'npm run seed' in the server folder."
                });
            }
            return reply.status(500).send({ error: e.message });
        }
    });

    // POST /api/cart — add or update quantity (requires auth)
    fastify.post('/api/cart', async (request, reply) => {
        const userId = await getUserId(request, reply);
        if (!userId) {
            return reply.status(401).send({ error: 'Sign in to add to cart' });
        }
        const body = request.body as { product_id: string; quantity?: number };
        if (!body.product_id) {
            return reply.status(400).send({ error: 'product_id is required' });
        }
        const quantity = Math.max(1, Math.min(99, body.quantity ?? 1));
        try {
            const existing = await db.select().from(schema.cart_items).where(
                and(eq(schema.cart_items.user_id, userId), eq(schema.cart_items.product_id, body.product_id))
            );
            const now = new Date().toISOString();
            if (existing.length > 0) {
                const updated = await db
                    .update(schema.cart_items)
                    .set({ quantity: existing[0].quantity + quantity, updated_at: now })
                    .where(eq(schema.cart_items.id, existing[0].id))
                    .returning()
                    .get();
                return updated;
            }
            const inserted = await db
                .insert(schema.cart_items)
                .values({ user_id: userId, product_id: body.product_id, quantity })
                .returning()
                .get();
            return inserted;
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    // PATCH /api/cart/:productId — set quantity (requires auth)
    fastify.patch<{ Params: { productId: string }; Body: { quantity: number } }>('/api/cart/:productId', async (request, reply) => {
        const userId = await getUserId(request, reply);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const { productId } = request.params;
        const body = request.body as { quantity?: number };
        const quantity = body.quantity ?? 1;
        if (quantity < 1) {
            await db.delete(schema.cart_items).where(
                and(eq(schema.cart_items.user_id, userId), eq(schema.cart_items.product_id, productId))
            );
            return { deleted: true };
        }
        try {
            const existing = await db.select().from(schema.cart_items).where(
                and(eq(schema.cart_items.user_id, userId), eq(schema.cart_items.product_id, productId))
            );
            if (existing.length === 0) {
                return reply.status(404).send({ error: 'Cart item not found' });
            }
            const updated = await db
                .update(schema.cart_items)
                .set({ quantity: Math.min(99, quantity), updated_at: new Date().toISOString() })
                .where(eq(schema.cart_items.id, existing[0].id))
                .returning()
                .get();
            return updated;
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });

    // DELETE /api/cart/:productId — remove line (requires auth)
    fastify.delete<{ Params: { productId: string } }>('/api/cart/:productId', async (request, reply) => {
        const userId = await getUserId(request, reply);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const { productId } = request.params;
        await db.delete(schema.cart_items).where(
            and(eq(schema.cart_items.user_id, userId), eq(schema.cart_items.product_id, productId))
        );
        return { ok: true };
    });

    // DELETE /api/cart — clear cart (requires auth)
    fastify.delete('/api/cart', async (request, reply) => {
        const userId = await getUserId(request, reply);
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        await db.delete(schema.cart_items).where(eq(schema.cart_items.user_id, userId));
        return { ok: true };
    });
}
