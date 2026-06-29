import crypto from 'crypto';
import { prisma } from '../db/prisma';
import {
    computeCancellationOutcome,
    resolveProviderPaymentPolicy,
} from '../paymentProtection/policy';

function normalizePhoneDigits(phone: string | null | undefined): string {
    return (phone ?? '').replace(/\D/g, '');
}

export async function findGuestBookingByToken(token: string) {
    if (!token || token.length < 20) return null;
    return prisma.bookings.findFirst({
        where: { guest_access_token: token, client_id: null },
        include: {
            barber: { select: { id: true, name: true, user_id: true, image_url: true, location: true } },
            group_guests: { orderBy: { sort_order: 'asc' } },
        },
    });
}

export async function getGuestCancellationPreview(token: string) {
    const booking = await findGuestBookingByToken(token);
    if (!booking) throw new Error('Booking not found');

    if (['completed', 'cancelled', 'no_show'].includes(booking.status || '')) {
        throw new Error(`Cannot cancel ${booking.status} booking`);
    }

    const policy = await resolveProviderPaymentPolicy(booking.barber_id, booking.shop_id);
    const outcome = computeCancellationOutcome(booking, policy, 'client');

    return {
        booking_id: booking.id,
        status: booking.status,
        date_text: booking.date_text,
        time_text: booking.time_text,
        tier: outcome.tier,
        fee_amount: outcome.fee_amount,
        refund_amount: 0,
        refund_percent: outcome.refund_percent,
        reason: outcome.reason,
        hours_until_appointment: outcome.hours_until_appointment,
        is_guest: true,
        pay_at_shop: booking.payment_method === 'cash_at_store',
        policy_note:
            outcome.fee_amount > 0
                ? 'You have not paid online. Any late-cancel fee may be discussed with your barber in shop.'
                : undefined,
    };
}

export async function cancelGuestBooking(token: string) {
    const booking = await findGuestBookingByToken(token);
    if (!booking) throw new Error('Booking not found');

    if (['completed', 'cancelled', 'no_show'].includes(booking.status || '')) {
        throw new Error(`Cannot cancel ${booking.status} booking`);
    }

    const policy = await resolveProviderPaymentPolicy(booking.barber_id, booking.shop_id);
    const outcome = computeCancellationOutcome(booking, policy, 'client');
    const now = new Date().toISOString();

    await prisma.bookings.update({
        where: { id: booking.id },
        data: {
            status: 'cancelled',
            cancelled_by: 'client',
            cancellation_tier: outcome.tier,
            cancellation_fee_amount: outcome.fee_amount > 0 ? outcome.fee_amount : null,
            cancellation_fee_status: outcome.fee_amount > 0 ? 'not_applicable' : 'waived',
            cancellation_refund_amount: null,
            updated_at: now,
        },
    });

    await prisma.audit_logs.create({
        data: {
            action: 'GUEST_BOOKING_CANCELLED',
            resource_type: 'Booking',
            resource_id: booking.id,
            actor_id: null,
            details: JSON.stringify({
                guest_token: token.slice(0, 8),
                tier: outcome.tier,
                fee_amount: outcome.fee_amount,
                reason: outcome.reason,
            }),
        },
    }).catch(() => { /* non-blocking */ });

    if (booking.barber?.user_id) {
        await prisma.notifications.create({
            data: {
                id: crypto.randomUUID(),
                user_id: booking.barber.user_id,
                title: 'Guest booking cancelled',
                content: `${booking.service_name || 'Appointment'} on ${booking.date_text} at ${booking.time_text} was cancelled by the guest.`,
                type: 'booking',
            },
        }).catch(() => { /* non-blocking */ });
    }

    return {
        cancelled: true,
        booking_id: booking.id,
        tier: outcome.tier,
        fee_amount: outcome.fee_amount,
        reason: outcome.reason,
    };
}

export async function claimGuestBookingForUser(token: string, userId: string) {
    const booking = await prisma.bookings.findFirst({
        where: { guest_access_token: token, client_id: null },
    });
    if (!booking) throw new Error('Booking not found or already linked to an account');

    await prisma.bookings.update({
        where: { id: booking.id },
        data: {
            client_id: userId,
            guest_access_token: null,
            updated_at: new Date().toISOString(),
        },
    });

    return { booking_id: booking.id, linked: true };
}

export async function claimPendingGuestBookingsForUser(userId: string) {
    const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { phone: true, email: true },
    });
    if (!user) return { linked_count: 0, booking_ids: [] as string[] };

    const userPhone = normalizePhoneDigits(user.phone);
    const userEmail = user.email?.trim().toLowerCase() ?? '';

    if (!userPhone && !userEmail) {
        return { linked_count: 0, booking_ids: [] as string[] };
    }

    const pending = await prisma.bookings.findMany({
        where: {
            client_id: null,
            guest_access_token: { not: null },
            OR: [
                ...(userEmail ? [{ client_email: userEmail }] : []),
                ...(user.phone ? [{ client_phone: user.phone }] : []),
            ],
        },
        take: 10,
        orderBy: { created_at: 'desc' },
    });

    const linkedIds: string[] = [];
    for (const booking of pending) {
        const phoneMatch =
            userPhone.length >= 8 &&
            booking.client_phone &&
            normalizePhoneDigits(booking.client_phone) === userPhone;
        const emailMatch =
            userEmail.length > 0 &&
            booking.client_email &&
            booking.client_email.trim().toLowerCase() === userEmail;

        if (!phoneMatch && !emailMatch) continue;

        await prisma.bookings.update({
            where: { id: booking.id },
            data: {
                client_id: userId,
                guest_access_token: null,
                updated_at: new Date().toISOString(),
            },
        });
        linkedIds.push(booking.id);
    }

    return { linked_count: linkedIds.length, booking_ids: linkedIds };
}

export async function claimGuestBookingsByTokens(userId: string, tokens: string[]) {
    const unique = [...new Set(tokens.filter((t) => typeof t === 'string' && t.length >= 20))];
    const linked: string[] = [];
    for (const token of unique) {
        try {
            const result = await claimGuestBookingForUser(token, userId);
            linked.push(result.booking_id);
        } catch {
            /* skip invalid or already claimed */
        }
    }
    return { linked_count: linked.length, booking_ids: linked };
}
