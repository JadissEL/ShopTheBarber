import { prisma } from '../db/prisma';
import { logger } from '../lib/logger';
import {
    getDefaultPaymentMethodId,
    getOrCreateStripeCustomer,
    getStripeClient,
    isStripeConfigured,
} from './stripeCustomer';

export type OffSessionChargeResult = {
    charged: boolean;
    mocked?: boolean;
    error?: string;
    payment_intent_id?: string;
};

/** Charge a saved card off-session (no-show, late cancellation, etc.) */
export async function chargeOffSessionFee(
    bookingId: string,
    clientId: string,
    feeAmount: number,
    feeType: 'no_show_fee' | 'cancellation_fee',
    savedPaymentMethodId?: string | null
): Promise<OffSessionChargeResult> {
    if (!isStripeConfigured()) {
        logger.warn(`[${feeType}] Stripe not configured`, { bookingId, feeAmount });
        return { charged: false, mocked: true, error: 'Stripe not configured' };
    }

    const paymentMethodId =
        savedPaymentMethodId || (await getDefaultPaymentMethodId(clientId));
    if (!paymentMethodId) {
        return { charged: false, error: 'No card on file for client' };
    }

    try {
        const customerId = await getOrCreateStripeCustomer(clientId);
        const stripe = getStripeClient();
        const intent = await stripe.paymentIntents.create({
            amount: Math.round(feeAmount * 100),
            currency: 'eur',
            customer: customerId,
            payment_method: paymentMethodId,
            off_session: true,
            confirm: true,
            metadata: { type: feeType, booking_id: bookingId },
            description:
                feeType === 'cancellation_fee'
                    ? `Cancellation fee, booking ${bookingId.slice(-8)}`
                    : `No-show fee, booking ${bookingId.slice(-8)}`,
        });

        if (intent.status === 'succeeded') {
            return { charged: true, payment_intent_id: intent.id };
        }

        return { charged: false, error: `Payment status: ${intent.status}`, payment_intent_id: intent.id };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Off-session charge failed';
        logger.error(`[${feeType}] charge failed`, { bookingId, error: message });
        return { charged: false, error: message };
    }
}

export async function refundPaymentIntent(
    paymentIntentId: string,
    amount: number
): Promise<{ refunded: boolean; refund_id?: string; error?: string }> {
    if (!isStripeConfigured()) {
        return { refunded: false, error: 'Stripe not configured' };
    }
    if (amount <= 0) return { refunded: true };

    try {
        const stripe = getStripeClient();
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount: Math.round(amount * 100),
        });
        return { refunded: true, refund_id: refund.id };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Refund failed';
        logger.error('[paymentProtection] refund failed', { paymentIntentId, error: message });
        return { refunded: false, error: message };
    }
}

export async function capturePartialAuthorization(
    paymentIntentId: string,
    captureAmount: number
): Promise<{ captured: boolean; error?: string }> {
    if (!isStripeConfigured()) {
        return { captured: false, error: 'Stripe not configured' };
    }
    try {
        const stripe = getStripeClient();
        await stripe.paymentIntents.capture(paymentIntentId, {
            amount_to_capture: Math.round(captureAmount * 100),
        });
        return { captured: true };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Capture failed';
        return { captured: false, error: message };
    }
}

export async function handleFeePaymentIntentWebhook(
    paymentIntentId: string,
    feeType: 'no_show_fee' | 'cancellation_fee',
    succeeded: boolean
) {
    const stripe = getStripeClient();
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.metadata?.type !== feeType) return { processed: false };

    const bookingId = intent.metadata.booking_id;
    if (!bookingId) return { processed: false };

    if (feeType === 'no_show_fee') {
        await prisma.bookings.update({
            where: { id: bookingId },
            data: {
                no_show_fee_status: succeeded ? 'charged' : 'failed',
                no_show_stripe_payment_intent_id: paymentIntentId,
                updated_at: new Date().toISOString(),
            },
        });
    } else {
        await prisma.bookings.update({
            where: { id: bookingId },
            data: {
                cancellation_fee_status: succeeded ? 'charged' : 'failed',
                cancellation_stripe_payment_intent_id: paymentIntentId,
                updated_at: new Date().toISOString(),
            },
        });
    }

    return { processed: true, booking_id: bookingId };
}
