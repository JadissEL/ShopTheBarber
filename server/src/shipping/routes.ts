import { type FastifyInstance } from 'fastify';
import { authenticateRequest } from '../auth/requestUser';
import {
    createSavedAddress,
    deleteSavedAddress,
    getSellerShippingProfile,
    listSavedAddresses,
    listSellerOrders,
    setDefaultAddress,
    updateFulfillment,
    updateSavedAddress,
    upsertSellerShippingProfile,
    updateBuyerOrderShipping,
} from './logic';

export async function shippingRoutes(fastify: FastifyInstance) {
    // --- Buyer saved addresses ---
    fastify.get('/api/shipping/addresses', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        return listSavedAddresses(user.id);
    });

    fastify.post<{ Body: Record<string, unknown> }>('/api/shipping/addresses', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        try {
            return await createSavedAddress(user.id, request.body as Parameters<typeof createSavedAddress>[1]);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to save address';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
        '/api/shipping/addresses/:id',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user as { id: string };
            try {
                return await updateSavedAddress(user.id, request.params.id, request.body);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to update address';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.delete<{ Params: { id: string } }>('/api/shipping/addresses/:id', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        try {
            return await deleteSavedAddress(user.id, request.params.id);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to delete address';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.post<{ Params: { id: string } }>('/api/shipping/addresses/:id/default', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        try {
            return await setDefaultAddress(user.id, request.params.id);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to set default address';
            return reply.status(400).send({ error: msg });
        }
    });

    // --- Seller ship-from profile ---
    fastify.get<{ Querystring: { barber_id?: string; shop_id?: string } }>(
        '/api/shipping/seller-profile',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user as { id: string; role?: string };
            try {
                const profile = await getSellerShippingProfile(
                    user.id,
                    user.role,
                    request.query.barber_id,
                    request.query.shop_id
                );
                return profile ?? null;
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to load shipping profile';
                return reply.status(403).send({ error: msg });
            }
        }
    );

    fastify.put<{ Body: Record<string, unknown> }>('/api/shipping/seller-profile', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string; role?: string };
        try {
            return await upsertSellerShippingProfile(
                user.id,
                user.role,
                request.body as Parameters<typeof upsertSellerShippingProfile>[2]
            );
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to save shipping profile';
            const code = msg.includes('Unauthorized') ? 403 : 400;
            return reply.status(code).send({ error: msg });
        }
    });

    // --- Seller orders / fulfillment ---
    fastify.get('/api/shipping/seller/orders', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string; role?: string };
        try {
            return await listSellerOrders(user.id, user.role);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load seller orders';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.patch<{ Params: { id: string }; Body: Record<string, unknown> }>(
        '/api/shipping/fulfillments/:id',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user as { id: string; role?: string };
            try {
                return await updateFulfillment(user.id, user.role, request.params.id, request.body);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to update fulfillment';
                const code = msg.includes('Unauthorized') ? 403 : 400;
                return reply.status(code).send({ error: msg });
            }
        }
    );

    // --- Buyer update shipping on order (before shipped) ---
    fastify.patch<{ Params: { orderId: string }; Body: Record<string, unknown> }>(
        '/api/shipping/orders/:orderId/shipping',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user as { id: string };
            try {
                return await updateBuyerOrderShipping(user.id, request.params.orderId, request.body);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to update shipping';
                const code = msg.includes('Unauthorized') ? 403 : 400;
                return reply.status(code).send({ error: msg });
            }
        }
    );
}
