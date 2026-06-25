import { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { resolveOptionalUserId } from '../auth/requestUser';

export async function vaultRoutes(fastify: FastifyInstance) {
    const getUserId = async (request: any): Promise<string | null> => {
        return await resolveOptionalUserId(request);
    };

    // GET /api/vault/summary — total investment, points, quick replenish, vault history
    fastify.get('/api/vault/summary', async (request, reply) => {
        const userId = await getUserId(request);
        if (!userId) return reply.status(401).send({ error: 'Sign in to view your vault' });
        try {
            const paidOrders = await prisma.orders.findMany({
                where: { user_id: userId, payment_status: 'paid' },
                orderBy: { created_at: 'desc' },
            });

            const totalInvestment = paidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

            const loyalty = await prisma.loyalty_profiles.findMany({ where: { user_id: userId } });
            const pointsEarned = loyalty[0]?.current_points ?? loyalty[0]?.lifetime_points ?? 0;
            const pointsDisplay = Number(pointsEarned);

            const allOrderItems: { order_id: string; order_date: string; fulfillment_status: string; product_id: string; product_name: string; product_image_url: string | null; price: number; quantity: number; id: string }[] = [];
            for (const order of paidOrders) {
                const items = await prisma.order_items.findMany({ where: { order_id: order.id } });
                const orderDate = order.created_at || new Date().toISOString();
                const fulfillment = order.fulfillment_status || 'confirmed';
                for (const it of items) {
                    allOrderItems.push({
                        id: it.id,
                        order_id: order.id,
                        order_date: orderDate,
                        fulfillment_status: fulfillment,
                        product_id: it.product_id,
                        product_name: it.product_name,
                        product_image_url: it.product_image_url,
                        price: Number(it.price),
                        quantity: it.quantity,
                    });
                }
            }

            const productCounts: Record<string, { count: number; product_name: string; product_image_url: string | null; product_id: string }> = {};
            for (const row of allOrderItems) {
                const id = row.product_id;
                if (!productCounts[id]) {
                    productCounts[id] = { count: 0, product_name: row.product_name, product_image_url: row.product_image_url, product_id: id };
                }
                productCounts[id].count += row.quantity;
            }
            const replenishList = Object.values(productCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 8)
                .map((p) => ({
                    product_id: p.product_id,
                    product_name: p.product_name,
                    product_image_url: p.product_image_url,
                    replenish_frequency: p.count >= 3 ? 'EVERY 2 MONTHS' : p.count >= 2 ? 'EVERY 3 MONTHS' : 'EVERY 4 MONTHS',
                }));

            return {
                total_investment: Math.round(totalInvestment * 100) / 100,
                points_earned: pointsDisplay,
                quick_replenish: replenishList,
                vault_history: allOrderItems,
            };
        } catch (e: any) {
            fastify.log.error(e);
            return reply.status(500).send({ error: e.message });
        }
    });
}
