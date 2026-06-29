import { prisma } from '../db/prisma';
import { appendLedgerEntry } from '../domain/ledger/append';
import { logger } from '../lib/logger';
import { releaseBookingAuthorization } from './checkout';
import {
    computeCancellationOutcome,
    getCollectedBookingAmount,
    resolveProviderPaymentPolicy,
    type CancellationOutcome,
} from './policy';
import {
    capturePartialAuthorization,
    chargeOffSessionFee,
    refundPaymentIntent,
} from './offSessionCharge';

export async function getCancellationPreview(bookingId: string, userId: string, userRole?: string | null) {
    const booking = await prisma.bookings.findUnique({
        where: { id: bookingId },
        include: {
            barber: { select: { user_id: true } },
            shop: { select: { owner_id: true } },
        },
    });
    if (!booking) throw new Error('Booking not found');

    const isClient = booking.client_id === userId;
    const isProvider = booking.barber.user_id === userId;
    const isShopOwner = booking.shop?.owner_id === userId;
    const isAdmin = userRole === 'admin';
    if (!isClient && !isProvider && !isShopOwner && !isAdmin) throw new Error('Unauthorized');

    if (['completed', 'cancelled', 'no_show'].includes(booking.status || '')) {
        throw new Error(`Cannot preview cancellation for ${booking.status} booking`);
    }

    const cancelledBy = isProvider || isShopOwner || isAdmin ? 'provider' : 'client';
    const policy = await resolveProviderPaymentPolicy(booking.barber_id, booking.shop_id);
    const outcome = computeCancellationOutcome(booking, policy, cancelledBy);

    return {
        booking_id: bookingId,
        cancelled_by: cancelledBy,
        policy: {
            late_cancel_protection_enabled: policy.late_cancel_protection_enabled,
            late_cancel_full_refund_hours: policy.late_cancel_full_refund_hours,
            late_cancel_no_refund_hours: policy.late_cancel_no_refund_hours,
            late_cancel_fee_percent: policy.late_cancel_fee_percent,
        },
        tier: outcome.tier,
        refund_amount: outcome.refund_amount,
        fee_amount: outcome.fee_amount,
        refund_percent: outcome.refund_percent,
        reason: outcome.reason,
        hours_until_appointment: outcome.hours_until_appointment,
        collected_amount: getCollectedBookingAmount(booking),
        deposit_paid: booking.deposit_payment_status === 'paid',
        has_auth_hold: booking.authorization_status === 'authorized',
    };
}

async function applyStripeCancellation(
    booking: {
        id: string;
        client_id: string | null;
        stripe_payment_intent_id: string | null;
        authorization_status: string | null;
        deposit_payment_status: string | null;
        payment_status: string | null;
        deposit_amount: number | null;
        price_at_booking: number | null;
        authorization_amount: number | null;
        saved_payment_method_id: string | null;
    },
    outcome: CancellationOutcome
): Promise<{
    fee_status: string;
    refund_id?: string;
    charge?: { charged: boolean; error?: string; payment_intent_id?: string };
}> {
    const collected = getCollectedBookingAmount(booking);
    let feeStatus = outcome.fee_amount > 0 ? 'retained' : 'waived';
    let refundId: string | undefined;
    let chargeResult: { charged: boolean; error?: string; payment_intent_id?: string } | undefined;

    if (booking.authorization_status === 'authorized' && booking.stripe_payment_intent_id) {
        if (outcome.tier === 'full_refund' || outcome.tier === 'waived' || outcome.fee_amount === 0) {
            await releaseBookingAuthorization(booking.id);
            feeStatus = 'waived';
        } else if (outcome.fee_amount > 0) {
            const cap = await capturePartialAuthorization(
                booking.stripe_payment_intent_id,
                outcome.fee_amount
            );
            feeStatus = cap.captured ? 'retained' : 'failed';
        }
        return { fee_status: feeStatus, charge: chargeResult };
    }

    if (booking.stripe_payment_intent_id && outcome.refund_amount > 0) {
        const refund = await refundPaymentIntent(
            booking.stripe_payment_intent_id,
            outcome.refund_amount
        );
        if (refund.refunded) {
            refundId = refund.refund_id;
            feeStatus =
                outcome.fee_amount > 0
                    ? collected > outcome.refund_amount
                        ? 'retained'
                        : 'deposit_forfeited'
                    : 'waived';
        } else {
            logger.warn('[cancellation] refund failed', { bookingId: booking.id, error: refund.error });
            feeStatus = outcome.fee_amount > 0 ? 'retained' : 'failed';
        }
    } else if (outcome.fee_amount > 0 && collected === 0 && booking.client_id) {
        chargeResult = await chargeOffSessionFee(
            booking.id,
            booking.client_id,
            outcome.fee_amount,
            'cancellation_fee',
            booking.saved_payment_method_id
        );
        feeStatus = chargeResult.charged ? 'charged' : 'failed';
    } else if (outcome.fee_amount > 0 && collected > 0 && outcome.refund_amount === 0) {
        feeStatus = 'deposit_forfeited';
    }

    return { fee_status: feeStatus, refund_id: refundId, charge: chargeResult };
}

export async function cancelBookingWithPaymentCleanup(bookingId: string, userId: string, userRole?: string | null) {
    const booking = await prisma.bookings.findUnique({
        where: { id: bookingId },
        include: {
            barber: { select: { user_id: true } },
            shop: { select: { owner_id: true } },
        },
    });
    if (!booking) throw new Error('Booking not found');

    const isClient = booking.client_id === userId;
    const isProvider = booking.barber.user_id === userId;
    const isShopOwner = booking.shop?.owner_id === userId;
    const isAdmin = userRole === 'admin';
    if (!isClient && !isProvider && !isShopOwner && !isAdmin) throw new Error('Unauthorized');

    if (['completed', 'cancelled', 'no_show'].includes(booking.status || '')) {
        throw new Error(`Cannot cancel ${booking.status} booking`);
    }

    const cancelledBy = isProvider || isShopOwner || isAdmin ? 'provider' : 'client';
    const policy = await resolveProviderPaymentPolicy(booking.barber_id, booking.shop_id);
    const outcome = computeCancellationOutcome(booking, policy, cancelledBy);

    const stripeResult = await applyStripeCancellation(booking, outcome);
    const now = new Date().toISOString();

    let paymentStatus = booking.payment_status;
    if (outcome.refund_amount > 0) {
        paymentStatus = outcome.fee_amount > 0 ? 'partial' : 'refunded';
    } else if (outcome.fee_amount > 0 && stripeResult.fee_status === 'charged') {
        paymentStatus = 'paid';
    } else if (outcome.fee_amount > 0) {
        paymentStatus = booking.deposit_payment_status === 'paid' ? 'partial' : paymentStatus;
    }

    await prisma.bookings.update({
        where: { id: bookingId },
        data: {
            status: 'cancelled',
            cancelled_by: cancelledBy,
            cancellation_tier: outcome.tier,
            cancellation_fee_amount: outcome.fee_amount > 0 ? outcome.fee_amount : null,
            cancellation_fee_status: stripeResult.fee_status,
            cancellation_refund_amount: outcome.refund_amount > 0 ? outcome.refund_amount : null,
            cancellation_stripe_refund_id: stripeResult.refund_id ?? null,
            cancellation_stripe_payment_intent_id: stripeResult.charge?.payment_intent_id ?? null,
            payment_status: paymentStatus,
            updated_at: now,
        },
    });

    await prisma.audit_logs.create({
        data: {
            action: 'BOOKING_CANCELLED',
            resource_type: 'Booking',
            resource_id: bookingId,
            actor_id: userId,
            details: JSON.stringify({
                by: cancelledBy,
                tier: outcome.tier,
                refund_amount: outcome.refund_amount,
                fee_amount: outcome.fee_amount,
                reason: outcome.reason,
                fee_status: stripeResult.fee_status,
            }),
        },
    });

    const hadDepositProtection =
        booking.deposit_payment_status === 'paid' ||
        booking.authorization_status === 'authorized' ||
        Boolean(booking.stripe_payment_intent_id);
    if (hadDepositProtection) {
        if (outcome.refund_amount > 0) {
            await appendLedgerEntry({
                entityType: 'booking',
                entityId: bookingId,
                eventType: 'deposit_release',
                payload: {
                    refund_amount: outcome.refund_amount,
                    tier: outcome.tier,
                    cancelled_by: cancelledBy,
                    refund_id: stripeResult.refund_id ?? null,
                },
                actorId: userId,
            }).catch(() => { /* non-blocking */ });
        }
        if (outcome.fee_amount > 0) {
            await appendLedgerEntry({
                entityType: 'booking',
                entityId: bookingId,
                eventType: 'deposit_forfeit',
                payload: {
                    fee_amount: outcome.fee_amount,
                    tier: outcome.tier,
                    cancelled_by: cancelledBy,
                    fee_status: stripeResult.fee_status,
                },
                actorId: userId,
            }).catch(() => { /* non-blocking */ });
        }
    }

    const { triggerWaitlistAfterCancel } = await import('../domain/waitlist/triggerOnCancel');
    await triggerWaitlistAfterCancel({
        barber_id: booking.barber_id,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: 'cancelled',
    }).catch(() => { /* non-blocking */ });

    const isLateClientCancel =
        cancelledBy === 'client' &&
        !['full_refund', 'waived'].includes(outcome.tier);
    const { onBookingCancelled } = await import('../domain/hooks/lifecycle');
    await onBookingCancelled(
        booking.client_id,
        booking.barber_id,
        isLateClientCancel
    ).catch(() => { /* non-blocking */ });

    return {
        cancelled: true,
        booking_id: bookingId,
        cancelled_by: cancelledBy,
        tier: outcome.tier,
        refund_amount: outcome.refund_amount,
        fee_amount: outcome.fee_amount,
        fee_status: stripeResult.fee_status,
        reason: outcome.reason,
        charge: stripeResult.charge,
    };
}
