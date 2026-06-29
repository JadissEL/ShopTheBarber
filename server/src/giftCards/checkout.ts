import Stripe from 'stripe';
import { getStripeApiKey } from '../config/stripeKeys';
import { purchaseGiftCard } from './logic';
import { sendEmail } from '../logic/email';
import { prisma } from '../db/prisma';
import { logger } from '../lib/logger';

function getStripeClient(): Stripe {
    const apiKey = getStripeApiKey();
    if (!apiKey?.startsWith('sk_')) {
        throw new Error('Stripe is not configured for gift card purchases');
    }
    return new Stripe(apiKey, { apiVersion: '2025-01-27.acacia', typescript: true });
}

function frontendBaseUrl(): string {
    return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export async function createGiftCardCheckoutSession(params: {
    purchaserId: string;
    amount: number;
    recipientEmail?: string;
    currency?: string;
}) {
    if (params.amount < 10 || params.amount > 500) {
        throw new Error('Gift card amount must be between €10 and €500');
    }

    const currency = (params.currency ?? 'EUR').toLowerCase();
    const base = frontendBaseUrl();
    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency,
                    product_data: {
                        name: 'ShopTheBarber Gift Card',
                        description: params.recipientEmail
                            ? `Digital gift for ${params.recipientEmail}`
                            : 'Digital grooming gift card — redeem to wallet or share the code',
                    },
                    unit_amount: Math.round(params.amount * 100),
                },
                quantity: 1,
            },
        ],
        success_url: `${base}/GiftCards?purchase=success`,
        cancel_url: `${base}/GiftCards?purchase=cancelled`,
        metadata: {
            type: 'gift_card_purchase',
            purchaser_id: params.purchaserId,
            amount: String(params.amount),
            recipient_email: params.recipientEmail ?? '',
            currency: params.currency ?? 'EUR',
        },
    });

    if (!session.url) {
        throw new Error('Failed to create Stripe checkout session');
    }

    return { url: session.url, session_id: session.id };
}

export async function confirmGiftCardFromCheckout(session: Stripe.Checkout.Session) {
    if (session.metadata?.type !== 'gift_card_purchase') {
        return { processed: false, reason: 'wrong_type' };
    }

    const purchaserId = session.metadata.purchaser_id;
    const amount = parseFloat(session.metadata.amount || '0');
    const recipientEmail = session.metadata.recipient_email?.trim() || undefined;
    const currency = session.metadata.currency || 'EUR';

    if (!purchaserId || Number.isNaN(amount) || amount < 10) {
        return { processed: false, reason: 'invalid_metadata' };
    }

    const existing = await prisma.audit_logs.findFirst({
        where: {
            action: 'GIFT_CARD_PURCHASED',
            details: { contains: session.id },
        },
    });
    if (existing) {
        return { processed: true, reason: 'already_processed', session_id: session.id };
    }

    const card = await purchaseGiftCard({
        purchaserId,
        amount,
        recipientEmail,
        currency,
    });

    await prisma.audit_logs.create({
        data: {
            action: 'GIFT_CARD_PURCHASED',
            resource_type: 'GiftCard',
            resource_id: card.id,
            actor_id: purchaserId,
            details: JSON.stringify({
                stripe_session_id: session.id,
                code: card.code,
                amount,
                currency,
            }),
        },
    });

    const purchaser = await prisma.users.findUnique({
        where: { id: purchaserId },
        select: { email: true, full_name: true },
    });

    if (recipientEmail) {
        sendEmail({
            to: recipientEmail,
            subject: 'You received a ShopTheBarber gift card',
            template: 'gift_card_received',
            data: {
                code: card.code,
                amount: `€${amount.toFixed(2)}`,
                senderName: purchaser?.full_name || 'Someone special',
            },
        }).catch((err) => logger.warn('[gift-card] recipient email failed', { err }));
    }

    if (purchaser?.email) {
        sendEmail({
            to: purchaser.email,
            subject: 'Your gift card purchase is confirmed',
            template: 'gift_card_purchased',
            data: {
                code: card.code,
                amount: `€${amount.toFixed(2)}`,
            },
        }).catch((err) => logger.warn('[gift-card] purchaser email failed', { err }));
    }

    return { processed: true, session_id: session.id, card_id: card.id, code: card.code };
}
