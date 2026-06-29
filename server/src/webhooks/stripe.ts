import Stripe from 'stripe';
import { prisma } from '../db/prisma';
import { sendEmail } from '../logic/email';
import { getStripeApiKey, getStripeWebhookSecret } from '../config/stripeKeys';
import { logger } from '../lib/logger';

let stripe: Stripe | null = null;
function getStripe(): Stripe {
    if (!stripe) {
        const apiKey = getStripeApiKey();
        if (!apiKey) {
            throw new Error('STRIPE_API_KEY is not configured. Webhook cannot process without a valid Stripe key.');
        }
        stripe = new Stripe(apiKey, {
            apiVersion: '2025-01-27.acacia',
            typescript: true,
        });
    }
    return stripe;
}

/**
 * Stripe Webhook Handler
 * 
 * Processes marketplace payment events from Stripe
 * - Verifies webhook signature for security
 * - Updates booking payment status
 * - Creates audit logs for compliance
 * - Idempotent (safe to retry)
 */

async function handleChargeSucceeded(event: Stripe.Event) {
    const charge = event.data.object as Stripe.Charge;
    const { booking_id } = charge.metadata || {};

    if (!booking_id) {
        logger.warn(`Charge succeeded but no booking_id in metadata: ${charge.id}`);
        return { processed: false, reason: 'no_booking_id' };
    }

    try {
        await prisma.bookings.updateMany({
            where: { id: booking_id },
            data: {
                payment_status: 'paid',
                status: 'confirmed'
            }
        });

        await prisma.audit_logs.create({
            data: {
                action: 'BOOKING_CONFIRMED',
                resource_type: 'Booking',
                resource_id: booking_id,
                actor_id: 'system',
                details: JSON.stringify({
                    stripe_charge_id: charge.id,
                    amount: charge.amount / 100,
                    currency: charge.currency.toUpperCase()
                })
            }
        });

        return { processed: true, charge_id: charge.id };
    } catch (error: any) {
        logger.error('Error processing charge.succeeded', error);
        throw error;
    }
}

async function handleChargeFailed(event: Stripe.Event) {
    const charge = event.data.object as Stripe.Charge;
    const { booking_id } = charge.metadata || {};

    if (!booking_id) {
        logger.warn(`Charge failed but no booking_id in metadata: ${charge.id}`);
        return { processed: false, reason: 'no_booking_id' };
    }

    try {
        await prisma.bookings.updateMany({
            where: { id: booking_id },
            data: {
                payment_status: 'unpaid',
                status: 'cancelled',
            }
        });

        await prisma.audit_logs.create({
            data: {
                action: 'BOOKING_CANCELLED',
                resource_type: 'Booking',
                resource_id: booking_id,
                actor_id: 'system',
                details: JSON.stringify({
                    reason: 'payment_failed',
                    stripe_charge_id: charge.id,
                    failure_message: charge.failure_message
                })
            }
        });

        return { processed: true, charge_id: charge.id };
    } catch (error: any) {
        logger.error('Error processing charge.failed', error);
        throw error;
    }
}

async function handleChargeRefunded(event: Stripe.Event) {
    const charge = event.data.object as Stripe.Charge;
    const { booking_id } = charge.metadata || {};

    if (!booking_id) {
        logger.warn(`Charge refunded but no booking_id in metadata: ${charge.id}`);
        return { processed: false, reason: 'no_booking_id' };
    }

    try {
        const refundAmount = charge.amount_refunded / 100;

        await prisma.bookings.updateMany({
            where: { id: booking_id },
            data: { payment_status: 'refunded' }
        });

        await prisma.audit_logs.create({
            data: {
                action: 'REFUND_PROCESSED',
                resource_type: 'Booking',
                resource_id: booking_id,
                actor_id: 'system',
                details: JSON.stringify({
                    stripe_charge_id: charge.id,
                    refund_amount: refundAmount,
                    currency: charge.currency.toUpperCase()
                })
            }
        });

        return { processed: true, charge_id: charge.id, refund_amount: refundAmount };
    } catch (error: any) {
        logger.error('Error processing charge.refunded', error);
        throw error;
    }
}

async function handlePayoutPaid(event: Stripe.Event) {
    const payout = event.data.object as Stripe.Payout;
    const { payout_id } = payout.metadata || {};

    if (!payout_id) {
        logger.warn(`Payout paid but no payout_id in metadata: ${payout.id}`);
        return { processed: false, reason: 'no_payout_id' };
    }

    try {
        await prisma.payouts.updateMany({
            where: { id: payout_id },
            data: {
                status: 'paid',
                stripe_payout_id: payout.id,
                paid_date: new Date(payout.arrival_date * 1000).toISOString()
            }
        });

        await prisma.audit_logs.create({
            data: {
                action: 'PAYOUT_ISSUED',
                resource_type: 'Payout',
                resource_id: payout_id,
                actor_id: 'system',
                details: JSON.stringify({
                    stripe_payout_id: payout.id,
                    amount: payout.amount / 100,
                    currency: payout.currency.toUpperCase()
                })
            }
        });

        return { processed: true, payout_id, stripe_payout_id: payout.id };
    } catch (error: any) {
        logger.error('Error processing payout.paid', error);
        throw error;
    }
}

async function handlePayoutFailed(event: Stripe.Event) {
    const payout = event.data.object as Stripe.Payout;
    const { payout_id } = payout.metadata || {};

    if (!payout_id) {
        logger.warn(`Payout failed but no payout_id in metadata: ${payout.id}`);
        return { processed: false, reason: 'no_payout_id' };
    }

    try {
        await prisma.payouts.updateMany({
            where: { id: payout_id },
            data: {
                status: 'failed',
                failure_reason: payout.failure_message || 'Unknown error'
            }
        });

        await prisma.audit_logs.create({
            data: {
                action: 'PAYOUT_FAILED',
                resource_type: 'Payout',
                resource_id: payout_id,
                actor_id: 'system',
                details: JSON.stringify({
                    stripe_payout_id: payout.id,
                    failure_reason: payout.failure_message
                })
            }
        });

        return { processed: false, payout_id, error: payout.failure_message };
    } catch (error: any) {
        logger.error('Error processing payout.failed', error);
        throw error;
    }
}

async function handleCheckoutSessionCompleted(event: Stripe.Event) {
    const session = event.data.object as Stripe.Checkout.Session;
    const type = session.metadata?.type;

    // Product order (marketplace checkout)
    if (type === 'product') {
        const order_id = session.metadata?.order_id || session.client_reference_id;
        if (!order_id) {
            logger.warn(`Checkout session completed but no order_id for product: ${session.id}`);
            return { processed: false, reason: 'no_order_id' };
        }
        try {
            const order = await prisma.orders.findUnique({ where: { id: order_id } });
            if (!order) {
                logger.warn(`Order not found: ${order_id}`);
                return { processed: false, reason: 'order_not_found' };
            }
            const orderNumber = `EMG-${  order_id.slice(-6).toUpperCase()}`;
            const estimatedDelivery = new Date();
            estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
            await prisma.orders.update({
                where: { id: order_id },
                data: {
                    payment_status: 'paid',
                    status: 'paid',
                    order_number: orderNumber,
                    fulfillment_status: 'confirmed',
                    estimated_delivery_at: estimatedDelivery.toISOString().slice(0, 10),
                }
            });
            await prisma.cart_items.deleteMany({ where: { user_id: order.user_id } });
            const { finalizeReservationsForUser } = await import('../domain/marketplace/reservations');
            await finalizeReservationsForUser(order.user_id).catch(() => { /* non-blocking */ });
            const { createFulfillmentsForOrder } = await import('../shipping/logic');
            await createFulfillmentsForOrder(order_id);
            await prisma.audit_logs.create({
                data: {
                    action: 'ORDER_PAID',
                    resource_type: 'Order',
                    resource_id: order_id,
                    actor_id: 'system',
                    details: JSON.stringify({
                        stripe_session_id: session.id,
                        amount: (session.amount_total || 0) / 100,
                        currency: (session.currency || 'USD').toUpperCase()
                    })
                }
            });
            const user = await prisma.users.findFirst({ where: { id: order.user_id } });
            const orderItems = await prisma.order_items.findMany({ where: { order_id } });
            if (user?.email) {
                sendEmail({
                    to: user.email,
                    subject: `Order Confirmed - #${order_id.slice(-8)}`,
                    template: 'order_confirmation',
                    data: {
                        customerName: user.full_name,
                        orderId: order_id,
                        total: `$${Number(order.total).toFixed(2)}`,
                        items: orderItems.map((oi) => ({ name: oi.product_name, quantity: oi.quantity, price: Number(oi.price) })),
                    },
                }).catch(() => { /* email failure is non-blocking */ });
            }
            const orderTotal = Number(order.total);
            const { awardPointsForMarketplaceOrder } = await import('../loyalty/logic');
            await awardPointsForMarketplaceOrder(order.user_id, order_id, orderTotal);

            const { trackProductEventInternal } = await import('../productAnalytics/track');
            trackProductEventInternal({
                event_name: 'marketplace_order_paid',
                user_id: order.user_id,
                properties: {
                    order_id,
                    stripe_session_id: session.id,
                    amount_eur: (session.amount_total || 0) / 100,
                },
            });

            return { processed: true, session_id: session.id, order_id };
        } catch (error: any) {
            logger.error('Error processing product checkout.session.completed', error);
            throw error;
        }
    }

    // Tip payment (post-service pourboire)
    if (type === 'tip') {
        const { markTipPaidFromCheckout } = await import('../tips/logic');
        return markTipPaidFromCheckout(session);
    }

    // Provider fee wallet top-up
    if (type === 'provider_wallet_topup') {
        const { creditWalletFromTopUp } = await import('../providerWallet/logic');
        return creditWalletFromTopUp(session);
    }

    // Language program waitlist deposit (20% non-refundable)
    if (type === 'language_program_waitlist_deposit') {
        const { confirmWaitlistDepositFromCheckout } = await import('../languagePrograms/logic');
        return confirmWaitlistDepositFromCheckout(session);
    }

    // Booking deposit (partial payment at booking)
    if (type === 'booking_deposit') {
        const { confirmBookingDepositFromCheckout } = await import('../paymentProtection/checkout');
        return confirmBookingDepositFromCheckout(session);
    }

    // Card authorization hold at booking
    if (type === 'booking_auth_hold') {
        const { confirmBookingAuthHoldFromCheckout } = await import('../paymentProtection/checkout');
        return confirmBookingAuthHoldFromCheckout(session);
    }

    // Save card on file
    if (type === 'save_card' || type === 'save_card_booking') {
        const { confirmSaveCardFromCheckout } = await import('../paymentProtection/checkout');
        return confirmSaveCardFromCheckout(session);
    }

    // Provider fixed-fee plan (commission waiver)
    if (type === 'provider_fixed_fee') {
        const { confirmFixedFeeFromCheckout } = await import('../fixedFee/logic');
        return confirmFixedFeeFromCheckout(session);
    }

    // Gift card purchase
    if (type === 'gift_card_purchase') {
        const { confirmGiftCardFromCheckout } = await import('../giftCards/checkout');
        return confirmGiftCardFromCheckout(session);
    }

    // Booking payment (full or with card saved for future use)
    const booking_id = session.metadata?.booking_id || session.client_reference_id;
    if (!booking_id) {
        logger.warn(`Checkout session completed but no booking_id found: ${session.id}`);
        return { processed: false, reason: 'no_booking_id' };
    }

    try {
        let syncUserId = session.metadata?.user_id;
        if (!syncUserId && booking_id) {
            const b = await prisma.bookings.findUnique({
                where: { id: booking_id },
                select: { client_id: true },
            });
            syncUserId = b?.client_id ?? undefined;
        }
        if (syncUserId && (session.payment_intent || session.setup_intent)) {
            try {
                const sessionWithUser = {
                    ...session,
                    metadata: { ...session.metadata, user_id: syncUserId },
                } as Stripe.Checkout.Session;
                const { syncPaymentMethodFromCheckoutSession } = await import('../paymentProtection/stripeCustomer');
                await syncPaymentMethodFromCheckoutSession(sessionWithUser);
            } catch (syncErr) {
                logger.warn('[stripe] card sync on booking payment failed', { booking_id, syncErr });
            }
        }

        await prisma.bookings.updateMany({
            where: { id: booking_id },
            data: {
                payment_status: 'paid',
                status: 'confirmed'
            }
        });

        const { trackProductEventInternal } = await import('../productAnalytics/track');
        trackProductEventInternal({
            event_name: 'booking_paid',
            user_id: syncUserId ?? null,
            properties: {
                booking_id,
                stripe_session_id: session.id,
                amount_eur: (session.amount_total || 0) / 100,
            },
        });

        await prisma.audit_logs.create({
            data: {
                action: 'BOOKING_PAID',
                resource_type: 'Booking',
                resource_id: booking_id,
                actor_id: 'system',
                details: JSON.stringify({
                    stripe_session_id: session.id,
                    amount: (session.amount_total || 0) / 100,
                    currency: (session.currency || 'USD').toUpperCase()
                })
            }
        });

        // Send confirmation email after payment (Resend)
        const booking = await prisma.bookings.findFirst({
            where: { id: booking_id },
        });
        if (booking?.client_id) {
            const client = await prisma.users.findFirst({
                where: { id: booking.client_id },
            });
            const barber = await prisma.barbers.findFirst({
                where: { id: booking.barber_id },
            });
            const bookingDate = new Date(booking.start_time);
            const date_text = bookingDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const time_text = bookingDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            if (client?.email) {
                sendEmail({
                    to: client.email,
                    subject: `Booking Confirmed - ${booking.service_name || 'Barber Service'}`,
                    template: 'confirmation',
                    data: {
                        clientName: client.full_name || booking.client_name,
                        barberName: barber?.name || booking.barber_name || 'Your Barber',
                        date: date_text,
                        time: time_text,
                        serviceName: booking.service_name || 'Barber Service',
                        location: 'At the shop',
                        price: `${booking.price_at_booking ?? 0} EUR`,
                    },
                }).catch(() => { /* email failure is non-blocking */ });
            }
        }

        return { processed: true, session_id: session.id };
    } catch (error: any) {
        logger.error('Error processing checkout.session.completed', error);
        throw error;
    }
}

async function handlePaymentIntentSucceeded(event: Stripe.Event) {
    const intent = event.data.object as Stripe.PaymentIntent;
    if (intent.metadata?.type === 'no_show_fee') {
        const { handleNoShowFeePaymentIntent } = await import('../paymentProtection/noShow');
        return handleNoShowFeePaymentIntent(intent.id, true);
    }
    if (intent.metadata?.type === 'cancellation_fee') {
        const { handleFeePaymentIntentWebhook } = await import('../paymentProtection/offSessionCharge');
        return handleFeePaymentIntentWebhook(intent.id, 'cancellation_fee', true);
    }
    return { processed: false, reason: 'unhandled_intent' };
}

async function handlePaymentIntentFailed(event: Stripe.Event) {
    const intent = event.data.object as Stripe.PaymentIntent;
    if (intent.metadata?.type === 'no_show_fee') {
        const { handleNoShowFeePaymentIntent } = await import('../paymentProtection/noShow');
        return handleNoShowFeePaymentIntent(intent.id, false);
    }
    if (intent.metadata?.type === 'cancellation_fee') {
        const { handleFeePaymentIntentWebhook } = await import('../paymentProtection/offSessionCharge');
        return handleFeePaymentIntentWebhook(intent.id, 'cancellation_fee', false);
    }
    return { processed: false, reason: 'unhandled_intent' };
}

export async function handleStripeWebhook(
    rawBody: string | Buffer,
    signature: string
): Promise<{ received: boolean; event_type?: string; event_id?: string; result?: any }> {
    const webhookSecret = getStripeWebhookSecret();

    if (!signature || !webhookSecret) {
        logger.error('Missing webhook signature or secret');
        throw new Error('Unauthorized');
    }

    const payload = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
    const event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);

    let result;
    switch (event.type) {
        case 'charge.succeeded':
            result = await handleChargeSucceeded(event);
            break;
        case 'checkout.session.completed':
            result = await handleCheckoutSessionCompleted(event);
            break;
        case 'charge.failed':
            result = await handleChargeFailed(event);
            break;
        case 'charge.refunded':
            result = await handleChargeRefunded(event);
            break;
        case 'payout.paid':
            result = await handlePayoutPaid(event);
            break;
        case 'payout.failed':
            result = await handlePayoutFailed(event);
            break;
        case 'payment_intent.succeeded':
            result = await handlePaymentIntentSucceeded(event);
            break;
        case 'payment_intent.payment_failed':
            result = await handlePaymentIntentFailed(event);
            break;
        default:
            logger.info(`Unhandled Stripe event type: ${event.type}`);
            result = { processed: false, reason: 'unhandled_event_type' };
    }

    return {
        received: true,
        event_type: event.type,
        event_id: event.id,
        result,
    };
}
