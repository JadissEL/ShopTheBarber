import type Stripe from 'stripe';
import { prisma } from '../db/prisma';
import { appendLedgerEntry } from '../domain/ledger/append';
import { logger } from '../lib/logger';
import {
    computeDepositAmount,
    resolveBookingPaymentRequirement,
    resolveProviderPaymentPolicy,
} from './policy';
import {
    clientHasSavedCard,
    getOrCreateStripeCustomer,
    getStripeClient,
    isStripeConfigured,
    syncPaymentMethodFromCheckoutSession,
} from './stripeCustomer';
import { isPaymentProtectionSchemaError, DISABLED_PAYMENT_POLICY } from './schemaGuard';

const frontendUrl = () =>
    (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

async function loadBookingForClient(bookingId: string, userId: string) {
    const booking = await prisma.bookings.findFirst({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found');
    if (booking.client_id !== userId) throw new Error('You can only pay for your own bookings');
    return booking;
}

function bookingDescription(booking: {
    service_name: string | null;
    barber_name: string | null;
    start_time: string;
}): string {
    const when = new Date(booking.start_time).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
    return `${booking.service_name || 'Appointment'} with ${booking.barber_name || 'your barber'}, ${when}`;
}

/** Public policy + computed amounts for booking confirmation UI */
export async function getPaymentProtectionPreview(
    barberId: string,
    shopId: string | null | undefined,
    totalPrice: number,
    paymentMethod: string,
    userId?: string | null
) {
    try {
        const hasCard = userId ? await clientHasSavedCard(userId) : false;
        const requirement = await resolveBookingPaymentRequirement(
            barberId,
            shopId,
            totalPrice,
            paymentMethod,
            hasCard,
            userId ?? null
        );
        return {
            policy: requirement.policy,
            next_step: requirement.next_step,
            deposit_amount: requirement.deposit_amount,
            balance_due: requirement.balance_due,
            authorization_amount: requirement.authorization_amount,
            requires_card_on_file: requirement.requires_card_on_file,
            has_saved_card: hasCard,
            schema_not_ready: false,
        };
    } catch (err) {
        if (isPaymentProtectionSchemaError(err)) {
            return {
                policy: DISABLED_PAYMENT_POLICY,
                next_step: 'none' as const,
                deposit_amount: null,
                balance_due: null,
                authorization_amount: null,
                requires_card_on_file: false,
                has_saved_card: false,
                schema_not_ready: true,
            };
        }
        throw err;
    }
}

/** Stripe Checkout, save card on file (Setup mode) */
export async function createSaveCardCheckout(userId: string) {
    if (!isStripeConfigured()) throw new Error('Stripe is not configured');
    const customerId = await getOrCreateStripeCustomer(userId);
    const session = await getStripeClient().checkout.sessions.create({
        mode: 'setup',
        customer: customerId,
        payment_method_types: ['card'],
        success_url: `${frontendUrl()}/AccountSettings?card=success`,
        cancel_url: `${frontendUrl()}/AccountSettings?card=cancelled`,
        metadata: { type: 'save_card', user_id: userId },
    });
    return { url: session.url, session_id: session.id };
}

/** After booking, deposit, auth hold, save card, or full payment checkout */
export async function createBookingProtectionCheckout(bookingId: string, userId: string) {
    if (!isStripeConfigured()) throw new Error('Stripe is not configured');

    const booking = await loadBookingForClient(bookingId, userId);
    const totalPrice = booking.price_at_booking ?? 0;
    const hasCard = await clientHasSavedCard(userId);
    const requirement = await resolveBookingPaymentRequirement(
        booking.barber_id,
        booking.shop_id,
        totalPrice,
        booking.payment_method || 'online',
        hasCard,
        userId
    );

    if (requirement.next_step === 'none') {
        return { url: null, step: 'none' as const };
    }

    const customerId = await getOrCreateStripeCustomer(userId);
    const stripe = getStripeClient();
    const desc = bookingDescription(booking);
    const successUrl = `${frontendUrl()}/Dashboard?status=success&bookingId=${bookingId}`;
    const cancelUrl = `${frontendUrl()}/UserBookings?payment=cancelled&bookingId=${bookingId}`;

    if (requirement.next_step === 'save_card') {
        const session = await stripe.checkout.sessions.create({
            mode: 'setup',
            customer: customerId,
            payment_method_types: ['card'],
            success_url: `${successUrl}&step=card_saved`,
            cancel_url: cancelUrl,
            metadata: { type: 'save_card_booking', user_id: userId, booking_id: bookingId },
        });
        await prisma.bookings.update({
            where: { id: bookingId },
            data: { stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() },
        });
        return { url: session.url, step: 'save_card' as const };
    }

    if (requirement.next_step === 'deposit' && requirement.deposit_amount) {
        const depositAmount = requirement.deposit_amount;
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Booking deposit',
                            description: `${desc}, deposit (balance €${(requirement.balance_due ?? 0).toFixed(2)} due at visit)`,
                        },
                        unit_amount: Math.round(depositAmount * 100),
                    },
                    quantity: 1,
                },
            ],
            payment_intent_data: {
                setup_future_usage: 'off_session',
                metadata: { type: 'booking_deposit', booking_id: bookingId },
            },
            success_url: `${successUrl}&step=deposit_paid`,
            cancel_url: cancelUrl,
            metadata: {
                type: 'booking_deposit',
                booking_id: bookingId,
                user_id: userId,
                deposit_amount: String(depositAmount),
            },
        });

        await prisma.bookings.update({
            where: { id: bookingId },
            data: {
                stripe_checkout_session_id: session.id,
                deposit_amount: depositAmount,
                deposit_payment_status: 'unpaid',
                balance_due: requirement.balance_due,
                updated_at: new Date().toISOString(),
            },
        });

        return { url: session.url, step: 'deposit' as const, deposit_amount: depositAmount };
    }

    if (requirement.next_step === 'auth_hold' && requirement.authorization_amount) {
        const authAmount = requirement.authorization_amount;
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: 'Card authorization',
                            description: `${desc}, hold only (charged after your visit)`,
                        },
                        unit_amount: Math.round(authAmount * 100),
                    },
                    quantity: 1,
                },
            ],
            payment_intent_data: {
                capture_method: 'manual',
                setup_future_usage: 'off_session',
                metadata: { type: 'booking_auth_hold', booking_id: bookingId },
            },
            success_url: `${successUrl}&step=auth_held`,
            cancel_url: cancelUrl,
            metadata: {
                type: 'booking_auth_hold',
                booking_id: bookingId,
                user_id: userId,
                authorization_amount: String(authAmount),
            },
        });

        await prisma.bookings.update({
            where: { id: bookingId },
            data: {
                stripe_checkout_session_id: session.id,
                authorization_amount: authAmount,
                authorization_status: 'pending',
                balance_due: authAmount,
                updated_at: new Date().toISOString(),
            },
        });

        return { url: session.url, step: 'auth_hold' as const, authorization_amount: authAmount };
    }

    // Full payment (legacy path)
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'eur',
                    product_data: { name: booking.service_name || 'Barber Service', description: desc },
                    unit_amount: Math.round(totalPrice * 100),
                },
                quantity: 1,
            },
        ],
        payment_intent_data: {
            setup_future_usage: requirement.requires_card_on_file ? 'off_session' : undefined,
            metadata: { booking_id: bookingId },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: { booking_id: bookingId, barber_id: booking.barber_id, shop_id: booking.shop_id || '', user_id: userId },
    });

    return { url: session.url, step: 'full_payment' as const };
}

export async function confirmBookingDepositFromCheckout(session: Stripe.Checkout.Session) {
    const bookingId = session.metadata?.booking_id;
    if (!bookingId) return { processed: false, reason: 'no_booking_id' };

    const depositAmount = parseFloat(session.metadata?.deposit_amount || '0');
    const paymentIntentId =
        typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

    try {
        if (session.metadata?.user_id) {
            await syncPaymentMethodFromCheckoutSession(session);
        }
    } catch (err) {
        logger.warn('[paymentProtection] card sync after deposit failed', { bookingId, err });
    }

    const booking = await prisma.bookings.findUnique({ where: { id: bookingId } });
    const balanceDue =
        booking?.price_at_booking != null
            ? Math.max(0, booking.price_at_booking - depositAmount)
            : null;

    await prisma.bookings.update({
        where: { id: bookingId },
        data: {
            deposit_payment_status: 'paid',
            deposit_amount: depositAmount || booking?.deposit_amount,
            balance_due: balanceDue,
            payment_status: balanceDue && balanceDue > 0 ? 'partial' : 'paid',
            status: 'confirmed',
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: paymentIntentId,
            updated_at: new Date().toISOString(),
        },
    });

    await prisma.audit_logs.create({
        data: {
            action: 'BOOKING_DEPOSIT_PAID',
            resource_type: 'Booking',
            resource_id: bookingId,
            actor_id: 'system',
            details: JSON.stringify({
                stripe_session_id: session.id,
                deposit_amount: depositAmount,
                balance_due: balanceDue,
            }),
        },
    });

    await appendLedgerEntry({
        entityType: 'booking',
        entityId: bookingId,
        eventType: 'deposit_lock',
        payload: {
            amount: depositAmount,
            balance_due: balanceDue,
            stripe_session_id: session.id,
            payment_intent_id: paymentIntentId,
        },
        actorId: session.metadata?.user_id ?? null,
    }).catch(() => { /* non-blocking */ });

    return { processed: true, booking_id: bookingId };
}

export async function confirmBookingAuthHoldFromCheckout(session: Stripe.Checkout.Session) {
    const bookingId = session.metadata?.booking_id;
    if (!bookingId) return { processed: false, reason: 'no_booking_id' };

    const paymentIntentId =
        typeof session.payment_intent === 'string'
            ? session.payment_intent
            : session.payment_intent?.id ?? null;

    try {
        if (session.metadata?.user_id) {
            await syncPaymentMethodFromCheckoutSession(session);
        }
    } catch (err) {
        logger.warn('[paymentProtection] card sync after auth hold failed', { bookingId, err });
    }

    const authAmount = parseFloat(session.metadata?.authorization_amount || '0');

    await prisma.bookings.update({
        where: { id: bookingId },
        data: {
            authorization_status: 'authorized',
            authorization_amount: authAmount || undefined,
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id: paymentIntentId,
            payment_status: 'authorized',
            status: 'confirmed',
            updated_at: new Date().toISOString(),
        },
    });

    await prisma.audit_logs.create({
        data: {
            action: 'BOOKING_AUTH_HOLD',
            resource_type: 'Booking',
            resource_id: bookingId,
            actor_id: 'system',
            details: JSON.stringify({
                stripe_session_id: session.id,
                authorization_amount: authAmount,
                payment_intent_id: paymentIntentId,
            }),
        },
    });

    await appendLedgerEntry({
        entityType: 'booking',
        entityId: bookingId,
        eventType: 'deposit_lock',
        payload: {
            kind: 'authorization_hold',
            amount: authAmount,
            stripe_session_id: session.id,
            payment_intent_id: paymentIntentId,
        },
        actorId: session.metadata?.user_id ?? null,
    }).catch(() => { /* non-blocking */ });

    return { processed: true, booking_id: bookingId };
}

export async function confirmSaveCardFromCheckout(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.user_id;
    if (!userId) return { processed: false, reason: 'no_user_id' };

    const { payment_method_id } = await syncPaymentMethodFromCheckoutSession(session);
    const bookingId = session.metadata?.booking_id;

    if (bookingId) {
        const booking = await prisma.bookings.findUnique({ where: { id: bookingId } });
        if (booking?.client_id) {
            const req = await resolveBookingPaymentRequirement(
                booking.barber_id,
                booking.shop_id,
                booking.price_at_booking ?? 0,
                booking.payment_method || 'online',
                true,
                booking.client_id
            );
            const stillNeedsPayment =
                req.next_step === 'deposit' ||
                req.next_step === 'auth_hold' ||
                (req.next_step === 'full_payment' && booking.payment_method !== 'cash_at_store');

            await prisma.bookings.update({
                where: { id: bookingId },
                data: {
                    saved_payment_method_id: payment_method_id,
                    status: stillNeedsPayment ? 'pending' : 'confirmed',
                    updated_at: new Date().toISOString(),
                },
            });
        } else {
            await prisma.bookings.update({
                where: { id: bookingId },
                data: {
                    saved_payment_method_id: payment_method_id,
                    updated_at: new Date().toISOString(),
                },
            });
        }
    }

    return { processed: true, user_id: userId, booking_id: bookingId ?? null };
}

/** Capture authorized amount when visit completes */
export async function captureBookingAuthorization(bookingId: string, providerUserId: string) {
    const booking = await prisma.bookings.findUnique({
        where: { id: bookingId },
        include: { barber: { select: { user_id: true } } },
    });
    if (!booking) throw new Error('Booking not found');
    if (booking.barber.user_id !== providerUserId) {
        throw new Error('Only the assigned barber can capture payment');
    }
    if (booking.authorization_status !== 'authorized' || !booking.stripe_payment_intent_id) {
        throw new Error('No authorized payment to capture');
    }

    const stripe = getStripeClient();
    const intent = await stripe.paymentIntents.capture(booking.stripe_payment_intent_id);

    await prisma.bookings.update({
        where: { id: bookingId },
        data: {
            authorization_status: 'captured',
            payment_status: 'paid',
            status: 'completed',
            updated_at: new Date().toISOString(),
        },
    });

    const { maybeTriggerReviewRequestOnCompletion } = await import('../reviews/requestLogic');
    await maybeTriggerReviewRequestOnCompletion(bookingId, booking.status, 'completed');

    return { captured: true, amount: (intent.amount_received || 0) / 100 };
}

/** Release authorization on cancellation */
export async function releaseBookingAuthorization(bookingId: string) {
    const booking = await prisma.bookings.findUnique({ where: { id: bookingId } });
    if (!booking?.stripe_payment_intent_id) return { released: false };
    if (booking.authorization_status !== 'authorized') return { released: false };

    const stripe = getStripeClient();
    await stripe.paymentIntents.cancel(booking.stripe_payment_intent_id);

    await prisma.bookings.update({
        where: { id: bookingId },
        data: {
            authorization_status: 'released',
            payment_status: 'refunded',
            updated_at: new Date().toISOString(),
        },
    });

    return { released: true };
}

/** Apply payment protection fields when booking is created */
export async function applyPaymentProtectionToBooking(
    bookingId: string,
    barberId: string,
    shopId: string | null | undefined,
    totalPrice: number,
    paymentMethod: string,
    clientId: string
) {
    const hasCard = await clientHasSavedCard(clientId);
    const requirement = await resolveBookingPaymentRequirement(
        barberId,
        shopId,
        totalPrice,
        paymentMethod,
        hasCard,
        clientId
    );

    const defaultPm = hasCard ? await import('./stripeCustomer').then((m) => m.getDefaultPaymentMethodId(clientId)) : null;

    await prisma.bookings.update({
        where: { id: bookingId },
        data: {
            deposit_amount: requirement.deposit_amount,
            deposit_payment_status:
                requirement.deposit_amount && requirement.deposit_amount > 0 ? 'unpaid' : 'none',
            balance_due: requirement.balance_due,
            authorization_amount: requirement.authorization_amount,
            authorization_status: requirement.authorization_amount ? 'none' : 'none',
            saved_payment_method_id: defaultPm,
            updated_at: new Date().toISOString(),
        },
    });

    return requirement;
}

export { computeDepositAmount, resolveProviderPaymentPolicy };
