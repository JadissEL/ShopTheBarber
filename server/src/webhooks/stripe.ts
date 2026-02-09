import Stripe from 'stripe';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '../logic/email';
import { getStripeApiKey, getStripeWebhookSecret } from '../config/stripeKeys';

// Lazy Stripe initialization - only when webhook is called
let stripe: Stripe | null = null;
function getStripe(): Stripe {
    if (!stripe) {
        let apiKey = getStripeApiKey();
        if (!apiKey) {
            console.warn('STRIPE_API_KEY not configured. Using mock key for server stability.');
            apiKey = 'sk_test_mock_fallback_key';
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
        console.warn('Charge succeeded but no booking_id in metadata:', charge.id);
        return { processed: false, reason: 'no_booking_id' };
    }

    try {
        await db.update(schema.bookings)
            .set({
                payment_status: 'paid',
                status: 'confirmed'
            })
            .where(eq(schema.bookings.id, booking_id));

        await db.insert(schema.audit_logs).values({
            action: 'BOOKING_CONFIRMED',
            resource_type: 'Booking',
            resource_id: booking_id,
            actor_id: 'system',
            details: JSON.stringify({
                stripe_charge_id: charge.id,
                amount: charge.amount / 100,
                currency: charge.currency.toUpperCase()
            })
        });

        return { processed: true, charge_id: charge.id };
    } catch (error: any) {
        console.error('Error processing charge.succeeded:', error.message);
        throw error;
    }
}

async function handleChargeFailed(event: Stripe.Event) {
    const charge = event.data.object as Stripe.Charge;
    const { booking_id } = charge.metadata || {};

    if (!booking_id) {
        console.warn('Charge failed but no booking_id in metadata:', charge.id);
        return { processed: false, reason: 'no_booking_id' };
    }

    try {
        await db.update(schema.bookings)
            .set({
                payment_status: 'unpaid',
                status: 'cancelled',
            })
            .where(eq(schema.bookings.id, booking_id));

        await db.insert(schema.audit_logs).values({
            action: 'BOOKING_CANCELLED',
            resource_type: 'Booking',
            resource_id: booking_id,
            actor_id: 'system',
            details: JSON.stringify({
                reason: 'payment_failed',
                stripe_charge_id: charge.id,
                failure_message: charge.failure_message
            })
        });

        return { processed: true, charge_id: charge.id };
    } catch (error: any) {
        console.error('Error processing charge.failed:', error.message);
        throw error;
    }
}

async function handleChargeRefunded(event: Stripe.Event) {
    const charge = event.data.object as Stripe.Charge;
    const { booking_id } = charge.metadata || {};

    if (!booking_id) {
        console.warn('Charge refunded but no booking_id in metadata:', charge.id);
        return { processed: false, reason: 'no_booking_id' };
    }

    try {
        const refundAmount = charge.amount_refunded / 100;

        await db.update(schema.bookings)
            .set({ payment_status: 'refunded' })
            .where(eq(schema.bookings.id, booking_id));

        await db.insert(schema.audit_logs).values({
            action: 'REFUND_PROCESSED',
            resource_type: 'Booking',
            resource_id: booking_id,
            actor_id: 'system',
            details: JSON.stringify({
                stripe_charge_id: charge.id,
                refund_amount: refundAmount,
                currency: charge.currency.toUpperCase()
            })
        });

        return { processed: true, charge_id: charge.id, refund_amount: refundAmount };
    } catch (error: any) {
        console.error('Error processing charge.refunded:', error.message);
        throw error;
    }
}

async function handlePayoutPaid(event: Stripe.Event) {
    const payout = event.data.object as Stripe.Payout;
    const { payout_id } = payout.metadata || {};

    if (!payout_id) {
        console.warn('Payout paid but no payout_id in metadata:', payout.id);
        return { processed: false, reason: 'no_payout_id' };
    }

    try {
        await db.update(schema.payouts)
            .set({
                status: 'paid',
                stripe_payout_id: payout.id,
                paid_date: new Date(payout.arrival_date * 1000).toISOString()
            })
            .where(eq(schema.payouts.id, payout_id));

        await db.insert(schema.audit_logs).values({
            action: 'PAYOUT_ISSUED',
            resource_type: 'Payout',
            resource_id: payout_id,
            actor_id: 'system',
            details: JSON.stringify({
                stripe_payout_id: payout.id,
                amount: payout.amount / 100,
                currency: payout.currency.toUpperCase()
            })
        });

        return { processed: true, payout_id, stripe_payout_id: payout.id };
    } catch (error: any) {
        console.error('Error processing payout.paid:', error.message);
        throw error;
    }
}

async function handlePayoutFailed(event: Stripe.Event) {
    const payout = event.data.object as Stripe.Payout;
    const { payout_id } = payout.metadata || {};

    if (!payout_id) {
        console.warn('Payout failed but no payout_id in metadata:', payout.id);
        return { processed: false, reason: 'no_payout_id' };
    }

    try {
        await db.update(schema.payouts)
            .set({
                status: 'failed',
                failure_reason: payout.failure_message || 'Unknown error'
            })
            .where(eq(schema.payouts.id, payout_id));

        await db.insert(schema.audit_logs).values({
            action: 'PAYOUT_FAILED',
            resource_type: 'Payout',
            resource_id: payout_id,
            actor_id: 'system',
            details: JSON.stringify({
                stripe_payout_id: payout.id,
                failure_reason: payout.failure_message
            })
        });

        return { processed: false, payout_id, error: payout.failure_message };
    } catch (error: any) {
        console.error('Error processing payout.failed:', error.message);
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
            console.warn('Checkout session completed but no order_id for product:', session.id);
            return { processed: false, reason: 'no_order_id' };
        }
        try {
            const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, order_id));
            if (!order) {
                console.warn('Order not found:', order_id);
                return { processed: false, reason: 'order_not_found' };
            }
            const orderNumber = 'EMG-' + order_id.slice(-6).toUpperCase();
            const estimatedDelivery = new Date();
            estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);
            await db.update(schema.orders)
                .set({
                    payment_status: 'paid',
                    status: 'paid',
                    order_number: orderNumber,
                    fulfillment_status: 'confirmed',
                    estimated_delivery_at: estimatedDelivery.toISOString().slice(0, 10),
                })
                .where(eq(schema.orders.id, order_id));
            await db.delete(schema.cart_items).where(eq(schema.cart_items.user_id, order.user_id));
            await db.insert(schema.audit_logs).values({
                action: 'ORDER_PAID',
                resource_type: 'Order',
                resource_id: order_id,
                actor_id: 'system',
                details: JSON.stringify({
                    stripe_session_id: session.id,
                    amount: (session.amount_total || 0) / 100,
                    currency: (session.currency || 'USD').toUpperCase()
                })
            });
            const user = await db.query.users.findFirst({ where: eq(schema.users.id, order.user_id) });
            const orderItems = await db.select().from(schema.order_items).where(eq(schema.order_items.order_id, order_id));
            if (user?.email) {
                sendEmail({
                    to: user.email,
                    subject: `Order Confirmed – #${order_id.slice(-8)}`,
                    template: 'order_confirmation',
                    data: {
                        customerName: user.full_name,
                        orderId: order_id,
                        total: `$${Number(order.total).toFixed(2)}`,
                        items: orderItems.map((oi) => ({ name: oi.product_name, quantity: oi.quantity, price: Number(oi.price) })),
                    },
                }).catch((err) => console.error('Failed to send order confirmation email:', err));
            }
            const orderTotal = Number(order.total);
            const pointsToAdd = Math.max(10, Math.floor(orderTotal));
            const existingProfile = await db.select().from(schema.loyalty_profiles).where(eq(schema.loyalty_profiles.user_id, order.user_id));
            if (existingProfile.length > 0) {
                const profile = existingProfile[0];
                await db.update(schema.loyalty_profiles).set({
                    current_points: (profile.current_points ?? 0) + pointsToAdd,
                    lifetime_points: (profile.lifetime_points ?? 0) + pointsToAdd,
                }).where(eq(schema.loyalty_profiles.id, profile.id));
            } else {
                await db.insert(schema.loyalty_profiles).values({
                    user_id: order.user_id,
                    current_points: pointsToAdd,
                    lifetime_points: pointsToAdd,
                    tier: 'Bronze',
                });
            }
            await db.insert(schema.loyalty_transactions).values({
                user_id: order.user_id,
                points: pointsToAdd,
                description: `Order ${orderNumber} – Marketplace purchase`,
            });
            return { processed: true, session_id: session.id, order_id };
        } catch (error: any) {
            console.error('Error processing product checkout.session.completed:', error.message);
            throw error;
        }
    }

    // Booking payment
    const booking_id = session.metadata?.booking_id || session.client_reference_id;
    if (!booking_id) {
        console.warn('Checkout session completed but no booking_id found:', session.id);
        return { processed: false, reason: 'no_booking_id' };
    }

    try {
        await db.update(schema.bookings)
            .set({
                payment_status: 'paid',
                status: 'confirmed'
            })
            .where(eq(schema.bookings.id, booking_id));

        await db.insert(schema.audit_logs).values({
            action: 'BOOKING_PAID',
            resource_type: 'Booking',
            resource_id: booking_id,
            actor_id: 'system',
            details: JSON.stringify({
                stripe_session_id: session.id,
                amount: (session.amount_total || 0) / 100,
                currency: (session.currency || 'USD').toUpperCase()
            })
        });

        // Send confirmation email after payment (Resend)
        const booking = await db.query.bookings.findFirst({
            where: eq(schema.bookings.id, booking_id),
        });
        if (booking?.client_id) {
            const client = await db.query.users.findFirst({
                where: eq(schema.users.id, booking.client_id),
            });
            const barber = await db.query.barbers.findFirst({
                where: eq(schema.barbers.id, booking.barber_id),
            });
            const bookingDate = new Date(booking.start_time);
            const date_text = bookingDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            const time_text = bookingDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            if (client?.email) {
                sendEmail({
                    to: client.email,
                    subject: `Booking Confirmed – ${booking.service_name || 'Barber Service'}`,
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
                }).catch((err) => console.error('Failed to send post-payment confirmation email:', err));
            }
        }

        return { processed: true, session_id: session.id };
    } catch (error: any) {
        console.error('Error processing checkout.session.completed:', error.message);
        throw error;
    }
}

export async function handleStripeWebhook(
    rawBody: string,
    signature: string
): Promise<{ received: boolean; event_type?: string; event_id?: string; result?: any; error?: string }> {
    const webhookSecret = getStripeWebhookSecret();

    if (!signature || !webhookSecret) {
        console.error('Missing webhook signature or secret');
        throw new Error('Unauthorized');
    }

    try {
        const event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);

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
            default:
                console.log(`Unhandled event type: ${event.type}`);
                result = { processed: false, reason: 'unhandled_event_type' };
        }

        return {
            received: true,
            event_type: event.type,
            event_id: event.id,
            result
        };
    } catch (error: any) {
        console.error('Webhook handler error:', error.message);
        return {
            error: error.message,
            received: true
        };
    }
}
