import { type FastifyInstance } from 'fastify';
import { authenticateRequest } from '../auth/requestUser';
import { createTipCheckout, getProviderTipsSummary, getTipStatusForBooking } from './logic';

export async function tipRoutes(fastify: FastifyInstance) {
    fastify.get<{ Params: { bookingId: string } }>(
        '/api/tips/booking/:bookingId',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user as { id: string };
            try {
                return await getTipStatusForBooking(user.id, request.params.bookingId);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to load tip status';
                const status = msg.includes('not found') ? 404 : 400;
                return reply.status(status).send({ error: msg });
            }
        }
    );

    fastify.post<{
        Body: {
            booking_id?: string;
            amount?: number;
            percent?: number;
            message?: string;
            return_path?: string;
        };
    }>('/api/tips/create-checkout', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const bookingId = request.body?.booking_id?.trim();
        if (!bookingId) return reply.status(400).send({ error: 'booking_id is required' });
        try {
            return await createTipCheckout(user.id, bookingId, {
                amount: request.body?.amount,
                percent: request.body?.percent,
                message: request.body?.message,
                returnPath: request.body?.return_path,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to create tip checkout';
            const code = msg.includes('Stripe') ? 503 : 400;
            return reply.status(code).send({ error: msg });
        }
    });

    fastify.get<{ Querystring: { barber_id?: string; shop_id?: string } }>(
        '/api/tips/provider/summary',
        async (request, reply) => {
            const ok = await authenticateRequest(request, reply);
            if (!ok) return;
            const user = request.user as { id: string };
            try {
                return await getProviderTipsSummary(
                    user.id,
                    request.query.barber_id,
                    request.query.shop_id
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to load tips summary';
                return reply.status(500).send({ error: msg });
            }
        }
    );
}
