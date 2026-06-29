import { randomUUID } from 'crypto';
import Stripe from 'stripe';
import { prisma } from '../db/prisma';
import { getStripeApiKey } from '../config/stripeKeys';
import { TIP_CONFIG } from './config';

let stripe: Stripe | null = null;

function getStripe(): Stripe | null {
    if (stripe) return stripe;
    const apiKey = getStripeApiKey();
    if (!apiKey || !apiKey.startsWith('sk_')) return null;
    stripe = new Stripe(apiKey, { apiVersion: '2025-01-27.acacia', typescript: true });
    return stripe;
}

function isRealConnectAccount(accountId: string | null | undefined): boolean {
    return !!accountId && accountId.startsWith('acct_') && !accountId.startsWith('acct_mock');
}

async function resolveTipRecipient(booking: {
    barber_id: string;
    shop_id: string | null;
    barber_name: string | null;
}) {
    const barber = await prisma.barbers.findUnique({ where: { id: booking.barber_id } });
    if (barber?.user_id) {
        return { recipientUserId: barber.user_id, recipientName: barber.name || booking.barber_name || 'Your barber' };
    }
    if (booking.shop_id) {
        const shop = await prisma.shops.findUnique({ where: { id: booking.shop_id } });
        if (shop?.owner_id) {
            return { recipientUserId: shop.owner_id, recipientName: shop.name || 'The shop' };
        }
    }
    throw new Error('Tip recipient is not configured for this booking');
}

function roundMoney(n: number): number {
    return Math.round(n * 100) / 100;
}

export async function getTipStatusForBooking(clientId: string, bookingId: string) {
    const booking = await prisma.bookings.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found');
    if (booking.client_id !== clientId) throw new Error('You can only tip on your own bookings');
    if (booking.status !== 'completed') {
        return {
            can_tip: false,
            reason: 'Tips are available after your appointment is marked completed',
            booking_status: booking.status,
        };
    }

    const existing = await prisma.booking_tips.findUnique({ where: { booking_id: bookingId } });
    if (existing?.status === 'paid') {
        return {
            can_tip: false,
            already_tipped: true,
            tip: {
                amount: existing.amount,
                currency: existing.currency,
                paid_at: existing.paid_at,
                message: existing.message,
            },
            service_price: booking.price_at_booking ?? 0,
        };
    }

    const { recipientName } = await resolveTipRecipient(booking);
    const servicePrice = booking.price_at_booking ?? 0;
    const presets = TIP_CONFIG.presetPercents.map((pct) => ({
        percent: pct,
        amount: roundMoney((servicePrice * pct) / 100),
    }));

    return {
        can_tip: true,
        already_tipped: false,
        pending_tip: existing?.status === 'pending' ? { id: existing.id, amount: existing.amount } : null,
        service_price: servicePrice,
        presets,
        preset_percents: [...TIP_CONFIG.presetPercents],
        min_amount: TIP_CONFIG.minAmount,
        max_amount: TIP_CONFIG.maxAmount,
        currency: TIP_CONFIG.currency,
        recipient_name: recipientName,
        barber_name: booking.barber_name,
        service_name: booking.service_name,
    };
}

export async function createTipCheckout(
    clientId: string,
    bookingId: string,
    opts: { amount?: number; percent?: number; message?: string; returnPath?: string }
) {
    const booking = await prisma.bookings.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found');
    if (booking.client_id !== clientId) throw new Error('You can only tip on your own bookings');
    if (booking.status !== 'completed') throw new Error('Tips are only available after service is completed');

    const paid = await prisma.booking_tips.findFirst({
        where: { booking_id: bookingId, status: 'paid' },
    });
    if (paid) throw new Error('You already tipped for this visit');

    const servicePrice = booking.price_at_booking ?? 0;
    let amount = opts.amount;
    if (opts.percent != null) {
        amount = roundMoney((servicePrice * opts.percent) / 100);
    }
    if (amount == null || Number.isNaN(amount)) throw new Error('amount or percent is required');
    amount = roundMoney(amount);
    if (amount < TIP_CONFIG.minAmount) throw new Error(`Minimum tip is $${TIP_CONFIG.minAmount}`);
    if (amount > TIP_CONFIG.maxAmount) throw new Error(`Maximum tip is $${TIP_CONFIG.maxAmount}`);

    const { recipientUserId, recipientName } = await resolveTipRecipient(booking);
    const recipient = await prisma.users.findUnique({ where: { id: recipientUserId } });

    const stripeClient = getStripe();
    if (!stripeClient) throw new Error('Stripe is not configured. Tips require payment setup.');

    const tipId = randomUUID();
    const message = opts.message?.trim().slice(0, 280) || null;
    const percentOfService =
        opts.percent ?? (servicePrice > 0 ? roundMoney((amount / servicePrice) * 100) : null);

    await prisma.booking_tips.upsert({
        where: { booking_id: bookingId },
        create: {
            id: tipId,
            booking_id: bookingId,
            client_id: clientId,
            recipient_user_id: recipientUserId,
            barber_id: booking.barber_id,
            shop_id: booking.shop_id,
            amount,
            currency: TIP_CONFIG.currency.toUpperCase(),
            percent_of_service: percentOfService,
            message,
            status: 'pending',
        },
        update: {
            amount,
            percent_of_service: percentOfService,
            message,
            status: 'pending',
            stripe_checkout_session_id: null,
            stripe_payment_intent_id: null,
        },
    });

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const returnPath = opts.returnPath || `Review?bookingId=${bookingId}`;
    const successUrl = `${frontend}/${returnPath}${returnPath.includes('?') ? '&' : '?'}tip=success`;
    const cancelUrl = `${frontend}/${returnPath}${returnPath.includes('?') ? '&' : '?'}tip=cancelled`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
            {
                price_data: {
                    currency: TIP_CONFIG.currency,
                    product_data: {
                        name: `Tip for ${recipientName}`,
                        description: `Thank-you tip, ${booking.service_name || 'Barber service'}`,
                    },
                    unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
            },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: tipId,
        metadata: {
            type: 'tip',
            tip_id: tipId,
            booking_id: bookingId,
            recipient_user_id: recipientUserId,
            client_id: clientId,
        },
    };

    if (
        isRealConnectAccount(recipient?.stripe_account_id) &&
        recipient?.stripe_connect_status === 'active'
    ) {
        sessionParams.payment_intent_data = {
            transfer_data: { destination: recipient.stripe_account_id! },
        };
    }

    const session = await stripeClient.checkout.sessions.create(sessionParams);

    await prisma.booking_tips.update({
        where: { id: tipId },
        data: { stripe_checkout_session_id: session.id },
    });

    return { url: session.url, tip_id: tipId, amount };
}

export async function markTipPaidFromCheckout(session: Stripe.Checkout.Session) {
    const tipId = session.metadata?.tip_id || session.client_reference_id;
    if (!tipId) return { processed: false, reason: 'no_tip_id' };

    const tip = await prisma.booking_tips.findUnique({ where: { id: tipId } });
    if (!tip) return { processed: false, reason: 'tip_not_found' };
    if (tip.status === 'paid') return { processed: true, tip_id: tipId, duplicate: true };

    const paidAt = new Date().toISOString();
    await prisma.booking_tips.update({
        where: { id: tipId },
        data: {
            status: 'paid',
            paid_at: paidAt,
            stripe_checkout_session_id: session.id,
            stripe_payment_intent_id:
                typeof session.payment_intent === 'string'
                    ? session.payment_intent
                    : session.payment_intent?.id ?? null,
        },
    });

    await prisma.audit_logs.create({
        data: {
            action: 'TIP_PAID',
            resource_type: 'BookingTip',
            resource_id: tipId,
            actor_id: 'system',
            details: JSON.stringify({
                booking_id: tip.booking_id,
                amount: tip.amount,
                recipient_user_id: tip.recipient_user_id,
                stripe_session_id: session.id,
            }),
        },
    });

    return { processed: true, tip_id: tipId };
}

export async function getProviderTipsSummary(userId: string, barberId?: string, shopId?: string) {
    const where =
        shopId != null
            ? { OR: [{ recipient_user_id: userId }, { shop_id: shopId, status: 'paid' }] }
            : barberId != null
              ? { OR: [{ recipient_user_id: userId }, { barber_id: barberId, status: 'paid' }] }
              : { recipient_user_id: userId, status: 'paid' };

    const tips = await prisma.booking_tips.findMany({
        where: { ...where, status: 'paid' },
        orderBy: { paid_at: 'desc' },
        take: 50,
    });

    const totalTips = tips.reduce((sum, t) => sum + t.amount, 0);
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const monthTips = tips.filter((t) => t.paid_at && new Date(t.paid_at) >= thisMonth);
    const tipsThisMonth = monthTips.reduce((sum, t) => sum + t.amount, 0);

    return {
        total_tips: roundMoney(totalTips),
        tips_this_month: roundMoney(tipsThisMonth),
        tip_count: tips.length,
        recent: tips.slice(0, 10).map((t) => ({
            id: t.id,
            amount: t.amount,
            paid_at: t.paid_at,
            message: t.message,
            booking_id: t.booking_id,
        })),
    };
}
