import { prisma } from '../db/prisma';
import { CLIENT_LATE_GRACE_MINUTES } from '../domain/booking/clientLatePolicy';
import { appendLedgerEntry } from '../domain/ledger/append';
import { logger } from '../lib/logger';
import { sendEmail } from '../logic/email';
import { computeNoShowFee, resolveProviderPaymentPolicy } from './policy';
import { chargeOffSessionFee, handleFeePaymentIntentWebhook } from './offSessionCharge';

async function assertProviderOwnsBooking(bookingId: string, providerUserId: string) {
    const booking = await prisma.bookings.findUnique({
        where: { id: bookingId },
        include: { barber: { select: { user_id: true, id: true } } },
    });
    if (!booking) throw new Error('Booking not found');
    if (booking.barber.user_id !== providerUserId) {
        throw new Error('Only the assigned barber can perform this action');
    }
    return booking;
}

export async function markBookingNoShow(bookingId: string, providerUserId: string) {
    const booking = await assertProviderOwnsBooking(bookingId, providerUserId);

    if (booking.status === 'no_show') {
        return { already_marked: true, booking_id: bookingId };
    }
    if (['cancelled', 'completed'].includes(booking.status || '')) {
        throw new Error(`Cannot mark no-show on ${booking.status} booking`);
    }

    const startMs = new Date(booking.start_time).getTime();
    if (Number.isNaN(startMs)) throw new Error('Invalid booking start time');
    const graceMs = CLIENT_LATE_GRACE_MINUTES * 60 * 1000;
    if (Date.now() < startMs + graceMs) {
        throw new Error(`No-show can be marked ${CLIENT_LATE_GRACE_MINUTES} minutes after appointment start`);
    }

    const policy = await resolveProviderPaymentPolicy(booking.barber_id, booking.shop_id);
    const totalPrice = booking.price_at_booking ?? 0;
    const feeAmount = computeNoShowFee(totalPrice, policy);
    const now = new Date().toISOString();

    await prisma.bookings.update({
        where: { id: bookingId },
        data: {
            status: 'no_show',
            no_show_marked_at: now,
            no_show_marked_by: providerUserId,
            no_show_fee_amount: feeAmount > 0 ? feeAmount : null,
            no_show_fee_status: feeAmount > 0 && policy.no_show_protection_enabled ? 'pending' : 'waived',
            updated_at: now,
        },
    });

    await prisma.audit_logs.create({
        data: {
            action: 'BOOKING_NO_SHOW',
            resource_type: 'Booking',
            resource_id: bookingId,
            actor_id: providerUserId,
            details: JSON.stringify({ fee_amount: feeAmount, protection_enabled: policy.no_show_protection_enabled }),
        },
    });

    let chargeResult: { charged: boolean; mocked?: boolean; error?: string; payment_intent_id?: string } = {
        charged: false,
    };

    if (policy.no_show_protection_enabled && feeAmount > 0 && booking.client_id) {
        chargeResult = await chargeNoShowFee(bookingId, booking.client_id, feeAmount, booking.saved_payment_method_id);
    }

    if (feeAmount > 0 && policy.no_show_protection_enabled) {
        await appendLedgerEntry({
            entityType: 'booking',
            entityId: bookingId,
            eventType: 'deposit_forfeit',
            payload: {
                reason: 'no_show',
                fee_amount: feeAmount,
                fee_status: chargeResult.charged ? 'charged' : chargeResult.error ? 'failed' : 'pending',
            },
            actorId: providerUserId,
        }).catch(() => { /* non-blocking */ });
    }

    if (booking.client_id) {
        const client = await prisma.users.findUnique({
            where: { id: booking.client_id },
            select: { email: true, full_name: true },
        });
        if (client?.email) {
            sendEmail({
                to: client.email,
                subject: 'Appointment marked as no-show',
                template: 'no_show',
                data: {
                    clientName: client.full_name,
                    barberName: booking.barber_name || 'your barber',
                    date: new Date(booking.start_time).toLocaleDateString('en-US'),
                    time: new Date(booking.start_time).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                    }),
                    serviceName: booking.service_name || 'Appointment',
                    feeNote:
                        chargeResult.charged && feeAmount > 0
                            ? `A no-show fee of €${feeAmount.toFixed(2)} was charged to your card on file.`
                            : feeAmount > 0
                              ? `A no-show fee of €${feeAmount.toFixed(2)} may apply per the barber policy.`
                              : '',
                },
            }).catch(() => { /* non-blocking */ });
        }
    }

    if (booking.client_id) {
        const { onBookingNoShow } = await import('../domain/hooks/lifecycle');
        await onBookingNoShow(booking.client_id, booking.barber?.id ?? null);
    }

    return {
        booking_id: bookingId,
        status: 'no_show',
        fee_amount: feeAmount,
        fee_status: chargeResult.charged ? 'charged' : chargeResult.error ? 'failed' : 'waived',
        charge: chargeResult,
    };
}

export async function chargeNoShowFee(
    bookingId: string,
    clientId: string,
    feeAmount: number,
    savedPaymentMethodId?: string | null
): Promise<{ charged: boolean; mocked?: boolean; error?: string; payment_intent_id?: string }> {
    const result = await chargeOffSessionFee(
        bookingId,
        clientId,
        feeAmount,
        'no_show_fee',
        savedPaymentMethodId
    );

    if (result.mocked || !result.charged) {
        await prisma.bookings.update({
            where: { id: bookingId },
            data: {
                no_show_fee_status: result.mocked ? 'failed' : 'failed',
                updated_at: new Date().toISOString(),
            },
        });
        return result;
    }

    await prisma.bookings.update({
        where: { id: bookingId },
        data: {
            no_show_fee_status: 'charged',
            no_show_stripe_payment_intent_id: result.payment_intent_id,
            payment_status: 'paid',
            updated_at: new Date().toISOString(),
        },
    });
    await prisma.audit_logs.create({
        data: {
            action: 'NO_SHOW_FEE_CHARGED',
            resource_type: 'Booking',
            resource_id: bookingId,
            actor_id: 'system',
            details: JSON.stringify({ amount: feeAmount, payment_intent_id: result.payment_intent_id }),
        },
    });
    return result;
}

export async function handleNoShowFeePaymentIntent(paymentIntentId: string, succeeded: boolean) {
    return handleFeePaymentIntentWebhook(paymentIntentId, 'no_show_fee', succeeded);
}

export async function retryNoShowFee(bookingId: string, providerUserId: string) {
    const booking = await assertProviderOwnsBooking(bookingId, providerUserId);
    if (booking.status !== 'no_show') throw new Error('Booking is not marked no-show');
    if (booking.no_show_fee_status === 'charged') throw new Error('Fee already charged');

    const feeAmount = booking.no_show_fee_amount ?? 0;
    if (feeAmount <= 0) throw new Error('No fee amount on booking');

    if (!booking.client_id) throw new Error('No client on booking');

    const charge = await chargeNoShowFee(
        bookingId,
        booking.client_id,
        feeAmount,
        booking.saved_payment_method_id
    );
    return { booking_id: bookingId, charge };
}
