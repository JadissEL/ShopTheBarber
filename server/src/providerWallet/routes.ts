import type { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma';
import { authenticateRequest } from '../auth/requestUser';
import {
    confirmCashBookingAsProvider,
    createTopUpCheckoutSession,
    getCashAvailability,
    getProviderWalletDashboard,
    grantPromotionalCredit,
    refundPlatformFeeOnCancel,
    searchProviderWallets,
    updateCashSettings,
    type AuthUser,
} from './logic';
import { triggerWaitlistAfterCancel } from '../domain/waitlist/triggerOnCancel';

async function requireAuth(request: Parameters<typeof authenticateRequest>[0], reply: Parameters<typeof authenticateRequest>[1]) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    return request.user as AuthUser;
}

async function requireAdmin(request: Parameters<typeof authenticateRequest>[0], reply: Parameters<typeof authenticateRequest>[1]) {
    const user = await requireAuth(request, reply);
    if (!user) return null;
    if (user.role !== 'admin') {
        reply.status(403).send({ error: 'Forbidden' });
        return null;
    }
    return user;
}

export async function providerWalletRoutes(fastify: FastifyInstance) {
    fastify.get<{ Querystring: { barber_id?: string; shop_id?: string } }>(
        '/api/provider-wallet/cash-availability',
        async (request, reply) => {
            const { barber_id, shop_id } = request.query;
            if (!barber_id) {
                return reply.status(400).send({ error: 'barber_id is required' });
            }
            return getCashAvailability(barber_id, shop_id ?? null);
        }
    );

    fastify.get<{ Querystring: { shop_id?: string } }>('/api/provider-wallet/me', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        try {
            return await getProviderWalletDashboard(user.id, user.role, request.query.shop_id);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load wallet';
            return reply.status(403).send({ error: msg });
        }
    });

    fastify.patch<{ Body: { accepts_cash_in_store: boolean; scope: 'barber' | 'shop'; shop_id?: string } }>(
        '/api/provider-wallet/settings',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            try {
                return await updateCashSettings(user.id, user.role, request.body);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to update settings';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{ Body: { amount: number; scope?: 'barber' | 'shop'; shop_id?: string } }>(
        '/api/provider-wallet/top-up',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            try {
                const body = request.body ?? {};
                return await createTopUpCheckoutSession(
                    user.id,
                    body.amount,
                    body.scope ?? 'barber',
                    body.shop_id
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Top-up failed';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{ Params: { bookingId: string } }>(
        '/api/provider-wallet/bookings/:bookingId/confirm',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            try {
                return await confirmCashBookingAsProvider(request.params.bookingId, user.id, user.role);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Confirm failed';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{ Params: { bookingId: string } }>(
        '/api/provider-wallet/bookings/:bookingId/cancel',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            try {
                const bookingId = request.params.bookingId;
                const booking = await prisma.bookings.findUnique({
                    where: { id: bookingId },
                    select: { barber_id: true, start_time: true, end_time: true },
                });
                await refundPlatformFeeOnCancel(bookingId);
                await prisma.bookings.update({
                    where: { id: bookingId },
                    data: { status: 'cancelled', updated_at: new Date().toISOString() },
                });
                if (booking) {
                    await triggerWaitlistAfterCancel({
                        ...booking,
                        status: 'cancelled',
                    }).catch(() => { /* non-blocking */ });
                }
                return { success: true };
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Cancel failed';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{ Params: { walletId: string }; Body: { amount?: number; reason?: string } }>(
        '/api/admin/provider-wallets/:walletId/promotional-credit',
        async (request, reply) => {
            const admin = await requireAdmin(request, reply);
            if (!admin) return;
            const amount = request.body?.amount;
            if (typeof amount !== 'number' || amount <= 0) {
                return reply.status(400).send({ error: 'amount must be a positive number' });
            }
            try {
                return await grantPromotionalCredit({
                    walletId: request.params.walletId,
                    amount,
                    reason: request.body?.reason,
                    actorId: admin.id,
                });
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to grant credit';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.get<{ Querystring: { q?: string } }>(
        '/api/admin/provider-wallets/search',
        async (request, reply) => {
            const admin = await requireAdmin(request, reply);
            if (!admin) return;
            const q = request.query.q?.trim() ?? '';
            if (q.length < 2) {
                return reply.status(400).send({ error: 'q must be at least 2 characters' });
            }
            try {
                return { wallets: await searchProviderWallets(q) };
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Search failed';
                return reply.status(500).send({ error: msg });
            }
        }
    );
}
