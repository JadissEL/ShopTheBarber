import crypto from 'crypto';
import { type FastifyInstance } from 'fastify';
import { authenticateRequest } from '../auth/requestUser';
import { prisma } from '../db/prisma';
import { getClientCheckInPayload, recordBarberCheckIn } from './booking/qrCheckIn';
import {
    acceptWaitlistOffer,
    cancelWaitlistEntry,
    expireDueWaitlistOffers,
    joinWaitlist,
    listBarberWaitlistQueue,
    listMyPendingWaitlistOffers,
    listMyWaitlistEntries,
} from './waitlist/logic';
import { verifyCronSecret } from '../lib/cronAuth';
import { autoConfirmStalePendingBookings } from './booking/autoConfirm';
import { listLedgerEntries } from './ledger/list';
import { releaseExpiredReservations } from './marketplace/reservations';
import { expireDuePromotionalCredits } from './wallet/expirePromo';

export async function domainBookingRoutes(fastify: FastifyInstance) {
    fastify.post<{ Params: { id: string } }>('/api/bookings/:id/check-in', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const { id } = request.params;
        const body = request.body as { qr_token?: string; latitude?: number; longitude?: number };
        try {
            return await recordBarberCheckIn({
                bookingId: id,
                barberUserId: user.id,
                qrToken: body.qr_token,
                latitude: body.latitude,
                longitude: body.longitude,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Check-in failed';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.get<{ Params: { id: string } }>('/api/bookings/:id/check-in/qr', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const { id } = request.params;
        try {
            return await getClientCheckInPayload(id, user.id);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load QR';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.post('/api/admin/bookings/:id/emergency-cancel', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string; role?: string };
        if (user.role !== 'admin') {
            return reply.status(403).send({ error: 'Admin access required' });
        }
        const { id } = request.params as { id: string };
        const body = request.body as { reason?: string; notify_client?: boolean };
        const booking = await prisma.bookings.findUnique({
            where: { id },
            include: { barber: { select: { user_id: true, name: true } } },
        });
        if (!booking) return reply.status(404).send({ error: 'Booking not found' });
        if (['completed', 'cancelled', 'no_show'].includes(booking.status || '')) {
            return reply.status(400).send({ error: `Cannot cancel ${booking.status} booking` });
        }

        const now = new Date().toISOString();
        await prisma.bookings.update({
            where: { id },
            data: {
                status: 'cancelled',
                cancelled_by: 'admin',
                cancellation_tier: 'waived',
                notes: body.reason
                    ? `${booking.notes ?? ''}\n[Admin override] ${body.reason}`.trim()
                    : booking.notes,
                updated_at: now,
            },
        });

        if (body.notify_client !== false && booking.client_id) {
            await prisma.notifications.create({
                data: {
                    id: crypto.randomUUID(),
                    user_id: booking.client_id,
                    title: 'Booking cancelled',
                    content: body.reason || 'Your booking was cancelled by platform support. We apologize for the inconvenience.',
                    type: 'booking',
                },
            });
        }

        const { triggerWaitlistAfterCancel } = await import('./waitlist/triggerOnCancel');
        await triggerWaitlistAfterCancel({
            barber_id: booking.barber_id,
            start_time: booking.start_time,
            end_time: booking.end_time,
            status: 'cancelled',
        });

        return { cancelled: true, booking_id: id };
    });
}

export async function waitlistRoutes(fastify: FastifyInstance) {
    fastify.post('/api/waitlist/join', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const body = request.body as {
            barber_id?: string;
            shop_id?: string;
            service_id?: string;
            service_ids?: string[];
            slot_start?: string;
            preferred_time?: string;
        };
        if (!body.barber_id || !body.slot_start) {
            return reply.status(400).send({ error: 'barber_id and slot_start are required' });
        }
        const primaryServiceId =
            body.service_id ||
            (Array.isArray(body.service_ids) && body.service_ids.length > 0
                ? body.service_ids[0]
                : undefined);
        try {
            return await joinWaitlist({
                clientId: user.id,
                barberId: body.barber_id,
                shopId: body.shop_id,
                serviceId: primaryServiceId,
                serviceIds: body.service_ids,
                slotStart: body.slot_start,
                preferredTime: body.preferred_time,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to join waitlist';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.get('/api/waitlist/my-offers', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        try {
            const offers = await listMyPendingWaitlistOffers(user.id);
            return { offers };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load offers';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.get('/api/waitlist/my-entries', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        try {
            const entries = await listMyWaitlistEntries(user.id);
            return { entries };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load waitlist';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.post('/api/waitlist/entries/:entryId/leave', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const { entryId } = request.params as { entryId: string };
        try {
            return await cancelWaitlistEntry({ entryId, clientId: user.id });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to leave waitlist';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.get('/api/barbers/:barberId/waitlist', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const { barberId } = request.params as { barberId: string };
        try {
            const barber = await prisma.barbers.findUnique({
                where: { id: barberId },
                select: { user_id: true },
            });
            if (!barber || barber.user_id !== user.id) {
                return reply.status(403).send({ error: 'Forbidden' });
            }
            return { entries: await listBarberWaitlistQueue(barberId) };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load waitlist';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.post('/api/waitlist/offers/:offerId/accept', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { id: string };
        const { offerId } = request.params as { offerId: string };
        const body = (request.body ?? {}) as Record<string, unknown>;
        try {
            return await acceptWaitlistOffer({
                offerId,
                clientId: user.id,
                bookingPayload: body,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to accept offer';
            return reply.status(400).send({ error: msg });
        }
    });

    fastify.post('/api/cron/waitlist/expire-offers', async (request, reply) => {
        if (!verifyCronSecret(request)) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        try {
            return await expireDueWaitlistOffers();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to expire offers';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.post('/api/cron/bookings/auto-confirm', async (request, reply) => {
        if (!verifyCronSecret(request)) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        try {
            return await autoConfirmStalePendingBookings();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Auto-confirm failed';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.post('/api/cron/marketplace/expire-reservations', async (request, reply) => {
        if (!verifyCronSecret(request)) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        try {
            const expired = await releaseExpiredReservations();
            return { expired };
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to expire reservations';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.post('/api/cron/wallet/expire-promotional-credits', async (request, reply) => {
        if (!verifyCronSecret(request)) {
            return reply.status(401).send({ error: 'Unauthorized' });
        }
        try {
            return await expireDuePromotionalCredits();
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Promo expiry failed';
            return reply.status(500).send({ error: msg });
        }
    });

    fastify.get('/api/admin/ledger', async (request, reply) => {
        const ok = await authenticateRequest(request, reply);
        if (!ok) return;
        const user = request.user as { role?: string };
        if (user.role !== 'admin') {
            return reply.status(403).send({ error: 'Admin access required' });
        }
        const q = request.query as {
            limit?: string;
            offset?: string;
            event_type?: string;
            entity_type?: string;
            search?: string;
        };
        try {
            return await listLedgerEntries({
                limit: q.limit ? parseInt(q.limit, 10) : undefined,
                offset: q.offset ? parseInt(q.offset, 10) : undefined,
                event_type: q.event_type,
                entity_type: q.entity_type,
                search: q.search,
            });
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Failed to load ledger';
            return reply.status(500).send({ error: msg });
        }
    });
}
