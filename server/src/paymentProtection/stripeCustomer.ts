import crypto from 'crypto';
import Stripe from 'stripe';
import { prisma } from '../db/prisma';
import { getStripeApiKey } from '../config/stripeKeys';
import { logger } from '../lib/logger';
import { isPaymentProtectionSchemaError } from './schemaGuard';

let stripe: Stripe | null = null;

export function getStripeClient(): Stripe {
    if (!stripe) {
        const key = getStripeApiKey();
        if (!key?.startsWith('sk_')) {
            throw new Error('Stripe is not configured');
        }
        stripe = new Stripe(key, { apiVersion: '2025-01-27.acacia', typescript: true });
    }
    return stripe;
}

export function isStripeConfigured(): boolean {
    const key = getStripeApiKey();
    return !!key?.startsWith('sk_');
}

export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
    const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, email: true, full_name: true, stripe_customer_id: true },
    });
    if (!user) throw new Error('User not found');
    if (user.stripe_customer_id) return user.stripe_customer_id;

    const client = getStripeClient();
    const customer = await client.customers.create({
        email: user.email,
        name: user.full_name ?? undefined,
        metadata: { user_id: userId },
    });

    await prisma.users.update({
        where: { id: userId },
        data: { stripe_customer_id: customer.id, updated_at: new Date().toISOString() },
    });

    return customer.id;
}

export async function clientHasSavedCard(userId: string): Promise<boolean> {
    try {
        const count = await prisma.client_payment_methods.count({ where: { user_id: userId } });
        return count > 0;
    } catch (err) {
        if (isPaymentProtectionSchemaError(err)) return false;
        throw err;
    }
}

export async function getDefaultPaymentMethodId(userId: string): Promise<string | null> {
    const row = await prisma.client_payment_methods.findFirst({
        where: { user_id: userId },
        orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });
    return row?.stripe_payment_method_id ?? null;
}

export async function persistPaymentMethodFromStripe(
    userId: string,
    paymentMethodId: string,
    setDefault = true
): Promise<void> {
    const client = getStripeClient();
    const pm = await client.paymentMethods.retrieve(paymentMethodId);
    if (pm.type !== 'card' || !pm.card) {
        throw new Error('Only card payment methods are supported');
    }

    const existing = await prisma.client_payment_methods.findUnique({
        where: { stripe_payment_method_id: paymentMethodId },
    });

    if (setDefault) {
        await prisma.client_payment_methods.updateMany({
            where: { user_id: userId },
            data: { is_default: false },
        });
    }

    const data = {
        user_id: userId,
        stripe_payment_method_id: paymentMethodId,
        card_brand: pm.card.brand ?? null,
        card_last4: pm.card.last4 ?? null,
        card_exp_month: pm.card.exp_month ?? null,
        card_exp_year: pm.card.exp_year ?? null,
        is_default: setDefault,
    };

    if (existing) {
        await prisma.client_payment_methods.update({
            where: { id: existing.id },
            data,
        });
    } else {
        await prisma.client_payment_methods.create({
            data: { id: crypto.randomUUID(), ...data },
        });
    }
}

export async function attachPaymentMethodToCustomer(
    userId: string,
    paymentMethodId: string
): Promise<void> {
    const customerId = await getOrCreateStripeCustomer(userId);
    const client = getStripeClient();
    try {
        await client.paymentMethods.attach(paymentMethodId, { customer: customerId });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : '';
        if (!msg.includes('already been attached')) throw err;
    }
    await persistPaymentMethodFromStripe(userId, paymentMethodId, true);
}

export async function syncPaymentMethodFromCheckoutSession(
    session: Stripe.Checkout.Session
): Promise<{ user_id: string; payment_method_id: string | null }> {
    const userId = session.metadata?.user_id;
    if (!userId) throw new Error('Missing user_id in checkout metadata');

    const client = getStripeClient();
    let paymentMethodId: string | null = null;

    if (session.setup_intent) {
        const setupIntentId =
            typeof session.setup_intent === 'string'
                ? session.setup_intent
                : session.setup_intent.id;
        const setupIntent = await client.setupIntents.retrieve(setupIntentId);
        paymentMethodId =
            typeof setupIntent.payment_method === 'string'
                ? setupIntent.payment_method
                : setupIntent.payment_method?.id ?? null;
    } else if (session.payment_intent) {
        const piId =
            typeof session.payment_intent === 'string'
                ? session.payment_intent
                : session.payment_intent.id;
        const pi = await client.paymentIntents.retrieve(piId);
        paymentMethodId =
            typeof pi.payment_method === 'string' ? pi.payment_method : pi.payment_method?.id ?? null;
    }

    if (paymentMethodId) {
        await attachPaymentMethodToCustomer(userId, paymentMethodId);
    }

    return { user_id: userId, payment_method_id: paymentMethodId };
}

export async function listClientPaymentMethods(userId: string) {
    const rows = await prisma.client_payment_methods.findMany({
        where: { user_id: userId },
        orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
    });
    return rows.map((r) => ({
        id: r.id,
        stripe_payment_method_id: r.stripe_payment_method_id,
        brand: r.card_brand,
        last4: r.card_last4,
        exp_month: r.card_exp_month,
        exp_year: r.card_exp_year,
        is_default: r.is_default === true,
    }));
}

export async function deleteClientPaymentMethod(userId: string, methodId: string): Promise<void> {
    const row = await prisma.client_payment_methods.findFirst({
        where: { id: methodId, user_id: userId },
    });
    if (!row) throw new Error('Payment method not found');

    if (isStripeConfigured()) {
        try {
            await getStripeClient().paymentMethods.detach(row.stripe_payment_method_id);
        } catch (err: unknown) {
            logger.warn('[paymentProtection] detach failed', {
                pm: row.stripe_payment_method_id,
                error: err instanceof Error ? err.message : err,
            });
        }
    }

    await prisma.client_payment_methods.delete({ where: { id: row.id } });

    const remaining = await prisma.client_payment_methods.findFirst({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
    });
    if (remaining && !remaining.is_default) {
        await prisma.client_payment_methods.update({
            where: { id: remaining.id },
            data: { is_default: true },
        });
    }
}
