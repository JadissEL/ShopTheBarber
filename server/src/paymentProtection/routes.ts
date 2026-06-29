import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { authenticateRequest, resolveOptionalUserId } from '../auth/requestUser';
import {
    createBookingProtectionCheckout,
    createSaveCardCheckout,
    captureBookingAuthorization,
    releaseBookingAuthorization,
    getPaymentProtectionPreview,
} from './checkout';
import { cancelBookingWithPaymentCleanup, getBookingPaymentStatus } from './status';
import { getCancellationPreview } from './cancellation';
import {
    deleteClientPaymentMethod,
    listClientPaymentMethods,
    isStripeConfigured,
} from './stripeCustomer';
import { markBookingNoShow, retryNoShowFee } from './noShow';
import { serializePolicyForPublic, resolveProviderPaymentPolicy } from './policy';

async function requireAuth(request: Parameters<typeof authenticateRequest>[0], reply: Parameters<typeof authenticateRequest>[1]) {
    const ok = await authenticateRequest(request, reply);
    if (!ok) return null;
    return request.user as { id: string; role?: string | null };
}

async function getBarberForUser(userId: string) {
    return prisma.barbers.findFirst({ where: { user_id: userId } });
}

const policyPatchSchema = z.object({
    scope: z.enum(['barber', 'shop']),
    shop_id: z.string().uuid().optional(),
    card_on_file_required: z.boolean().optional(),
    booking_deposit_enabled: z.boolean().optional(),
    booking_deposit_percent: z.number().min(0).max(100).optional(),
    booking_deposit_flat_amount: z.number().min(0).nullable().optional(),
    booking_auth_hold_enabled: z.boolean().optional(),
    no_show_protection_enabled: z.boolean().optional(),
    no_show_fee_percent: z.number().min(0).max(100).nullable().optional(),
    no_show_fee_flat_amount: z.number().min(0).nullable().optional(),
    late_cancel_protection_enabled: z.boolean().optional(),
    late_cancel_full_refund_hours: z.number().min(0).max(168).optional(),
    late_cancel_no_refund_hours: z.number().min(0).max(168).optional(),
    late_cancel_fee_percent: z.number().min(0).max(100).optional(),
});

export async function paymentProtectionRoutes(fastify: FastifyInstance) {
    /** Public preview for booking confirmation step */
    fastify.get<{
        Querystring: {
            barber_id: string;
            shop_id?: string;
            total_price: string;
            payment_method?: string;
        };
    }>('/api/payment-protection/preview', async (request, reply) => {
        const { barber_id, shop_id, total_price, payment_method } = request.query;
        if (!barber_id || !total_price) {
            return reply.status(400).send({ error: 'barber_id and total_price are required' });
        }
        const total = parseFloat(total_price);
        if (Number.isNaN(total)) return reply.status(400).send({ error: 'Invalid total_price' });

        let userId: string | null = null;
        try {
            userId = await resolveOptionalUserId(request);
        } catch {
            userId = null;
        }

        const preview = await getPaymentProtectionPreview(
            barber_id,
            shop_id ?? null,
            total,
            payment_method || 'online',
            userId
        );
        return {
            ...preview,
            policy: serializePolicyForPublic(preview.policy),
            stripe_configured: isStripeConfigured(),
        };
    });

    /** Provider payment protection settings */
    fastify.get<{ Querystring: { shop_id?: string } }>(
        '/api/payment-protection/settings',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            const barber = await getBarberForUser(user.id);
            if (!barber) return reply.status(403).send({ error: 'Barber profile required' });

            const shopId = request.query.shop_id ?? barber.shop_id;
            const policy = await resolveProviderPaymentPolicy(barber.id, shopId);

            const barberRow = await prisma.barbers.findUnique({
                where: { id: barber.id },
                select: {
                    card_on_file_required: true,
                    booking_deposit_enabled: true,
                    booking_deposit_percent: true,
                    booking_deposit_flat_amount: true,
                    booking_auth_hold_enabled: true,
                    no_show_protection_enabled: true,
                    no_show_fee_percent: true,
                    no_show_fee_flat_amount: true,
                    late_cancel_protection_enabled: true,
                    late_cancel_full_refund_hours: true,
                    late_cancel_no_refund_hours: true,
                    late_cancel_fee_percent: true,
                },
            });

            let shopRow = null;
            if (shopId) {
                shopRow = await prisma.shops.findUnique({
                    where: { id: shopId },
                    select: {
                        id: true,
                        name: true,
                        card_on_file_required: true,
                        booking_deposit_enabled: true,
                        booking_deposit_percent: true,
                        booking_deposit_flat_amount: true,
                        booking_auth_hold_enabled: true,
                        no_show_protection_enabled: true,
                        no_show_fee_percent: true,
                        no_show_fee_flat_amount: true,
                        late_cancel_protection_enabled: true,
                        late_cancel_full_refund_hours: true,
                        late_cancel_no_refund_hours: true,
                        late_cancel_fee_percent: true,
                    },
                });
            }

            return {
                effective_policy: serializePolicyForPublic(policy),
                barber: barberRow,
                shop: shopRow,
                stripe_configured: isStripeConfigured(),
            };
        }
    );

    fastify.patch('/api/payment-protection/settings', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        const parsed = policyPatchSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: parsed.error.flatten() });
        }

        const barber = await getBarberForUser(user.id);
        if (!barber) return reply.status(403).send({ error: 'Barber profile required' });

        const data: Record<string, unknown> = { updated_at: new Date().toISOString() };
        const fields = [
            'card_on_file_required',
            'booking_deposit_enabled',
            'booking_deposit_percent',
            'booking_deposit_flat_amount',
            'booking_auth_hold_enabled',
            'no_show_protection_enabled',
            'no_show_fee_percent',
            'no_show_fee_flat_amount',
            'late_cancel_protection_enabled',
            'late_cancel_full_refund_hours',
            'late_cancel_no_refund_hours',
            'late_cancel_fee_percent',
        ] as const;

        for (const f of fields) {
            if (parsed.data[f] !== undefined) {
                data[f] = parsed.data[f];
            }
        }

        // Deposit and auth hold are mutually exclusive
        if (data.booking_deposit_enabled === true) {
            data.booking_auth_hold_enabled = false;
        }
        if (data.booking_auth_hold_enabled === true) {
            data.booking_deposit_enabled = false;
        }
        if (data.no_show_protection_enabled === true && data.card_on_file_required === undefined) {
            data.card_on_file_required = true;
        }

        if (parsed.data.scope === 'shop') {
            const shopId = parsed.data.shop_id ?? barber.shop_id;
            if (!shopId) return reply.status(400).send({ error: 'shop_id required for shop scope' });
            const shop = await prisma.shops.findFirst({ where: { id: shopId, owner_id: user.id } });
            if (!shop) return reply.status(403).send({ error: 'You do not own this shop' });
            await prisma.shops.update({ where: { id: shopId }, data });
            const policy = await resolveProviderPaymentPolicy(barber.id, shopId);
            return { scope: 'shop', shop_id: shopId, policy: serializePolicyForPublic(policy) };
        }

        await prisma.barbers.update({ where: { id: barber.id }, data });
        const policy = await resolveProviderPaymentPolicy(barber.id, barber.shop_id);
        return { scope: 'barber', policy: serializePolicyForPublic(policy) };
    });

    /** Client saved cards */
    fastify.get('/api/payment-methods', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        const methods = await listClientPaymentMethods(user.id);
        return { methods, stripe_configured: isStripeConfigured() };
    });

    fastify.post('/api/payment-methods/setup-checkout', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        try {
            return await createSaveCardCheckout(user.id);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to start card setup';
            return reply.status(503).send({ error: msg });
        }
    });

    fastify.delete<{ Params: { id: string } }>('/api/payment-methods/:id', async (request, reply) => {
        const user = await requireAuth(request, reply);
        if (!user) return;
        try {
            await deleteClientPaymentMethod(user.id, request.params.id);
            return { success: true };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to remove card';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.post<{ Body: { bookingId: string } }>(
        '/api/payment-protection/booking-checkout',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            const bookingId = request.body?.bookingId;
            if (!bookingId) return reply.status(400).send({ error: 'bookingId is required' });
            try {
                return await createBookingProtectionCheckout(bookingId, user.id);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Checkout failed';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.get<{ Params: { bookingId: string } }>(
        '/api/payment-protection/bookings/:bookingId/payment-status',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            try {
                return await getBookingPaymentStatus(request.params.bookingId, user.id);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to load payment status';
                const code = msg.includes('Unauthorized') || msg.includes('not found') ? 403 : 400;
                return reply.status(code).send({ error: msg });
            }
        }
    );

    fastify.get<{ Params: { bookingId: string } }>(
        '/api/payment-protection/bookings/:bookingId/cancel-preview',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            try {
                return await getCancellationPreview(
                    request.params.bookingId,
                    user.id,
                    user.role
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to load cancel preview';
                const code = msg.includes('Unauthorized') || msg.includes('not found') ? 403 : 400;
                return reply.status(code).send({ error: msg });
            }
        }
    );

    fastify.post<{ Params: { bookingId: string } }>(
        '/api/payment-protection/bookings/:bookingId/cancel',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            try {
                return await cancelBookingWithPaymentCleanup(
                    request.params.bookingId,
                    user.id,
                    user.role
                );
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Cancel failed';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    /** Provider: mark no-show + charge fee */
    fastify.post<{ Params: { bookingId: string } }>(
        '/api/payment-protection/bookings/:bookingId/no-show',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            try {
                return await markBookingNoShow(request.params.bookingId, user.id);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Failed to mark no-show';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{ Params: { bookingId: string } }>(
        '/api/payment-protection/bookings/:bookingId/retry-no-show-fee',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            try {
                return await retryNoShowFee(request.params.bookingId, user.id);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Retry failed';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{ Params: { bookingId: string } }>(
        '/api/payment-protection/bookings/:bookingId/capture',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            try {
                return await captureBookingAuthorization(request.params.bookingId, user.id);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Capture failed';
                return reply.status(400).send({ error: msg });
            }
        }
    );

    fastify.post<{ Params: { bookingId: string } }>(
        '/api/payment-protection/bookings/:bookingId/release-auth',
        async (request, reply) => {
            const user = await requireAuth(request, reply);
            if (!user) return;
            const booking = await prisma.bookings.findUnique({
                where: { id: request.params.bookingId },
                include: { barber: { select: { user_id: true } } },
            });
            if (!booking) return reply.status(404).send({ error: 'Booking not found' });
            if (booking.barber.user_id !== user.id && booking.client_id !== user.id) {
                return reply.status(403).send({ error: 'Unauthorized' });
            }
            try {
                return await releaseBookingAuthorization(request.params.bookingId);
            } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Release failed';
                return reply.status(400).send({ error: msg });
            }
        }
    );
}
