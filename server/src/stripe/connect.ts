import Stripe from 'stripe';
import { prisma } from '../db/prisma';
import { getStripeApiKey, isUsableStripeApiKey } from '../config/stripeKeys';

function getStripeClient(): Stripe {
    const apiKey = getStripeApiKey();
    if (!isUsableStripeApiKey(apiKey)) {
        throw new Error('Stripe is not configured. Set STRIPE_API_KEY on the server.');
    }
    return new Stripe(apiKey, { apiVersion: '2025-01-27.acacia', typescript: true });
}

function frontendBaseUrl(): string {
    return (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
}

export async function initiateStripeConnectForUser(userId: string) {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    const stripe = getStripeClient();
    let accountId = user.stripe_account_id;

    if (!accountId) {
        const account = await stripe.accounts.create({
            type: 'express',
            email: user.email ?? undefined,
            metadata: { user_id: userId },
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
        });
        accountId = account.id;
        await prisma.users.update({
            where: { id: userId },
            data: {
                stripe_account_id: accountId,
                stripe_connect_status: 'pending',
                updated_at: new Date().toISOString(),
            },
        });
    }

    const base = frontendBaseUrl();
    const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${base}/ProviderSettings?tab=payments&connect=refresh`,
        return_url: `${base}/ProviderSettings?tab=payments&connect=success`,
        type: 'account_onboarding',
    });

    return { url: accountLink.url, accountId };
}

export async function checkStripeConnectStatusForUser(userId: string) {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user?.stripe_account_id) {
        return {
            isConnected: false,
            status: user?.stripe_connect_status || 'unconnected',
            accountId: null as string | null,
        };
    }

    const apiKey = getStripeApiKey();
    if (!isUsableStripeApiKey(apiKey)) {
        const status = user.stripe_connect_status || 'pending';
        return {
            isConnected: status === 'active',
            status,
            accountId: user.stripe_account_id,
        };
    }

    const stripe = getStripeClient();
    const account = await stripe.accounts.retrieve(user.stripe_account_id);
    let status = 'pending';
    if (account.charges_enabled && account.payouts_enabled && account.details_submitted) {
        status = 'active';
    } else if (account.details_submitted) {
        status = 'restricted';
    }

    if (status !== user.stripe_connect_status) {
        await prisma.users.update({
            where: { id: userId },
            data: { stripe_connect_status: status, updated_at: new Date().toISOString() },
        });
    }

    return {
        isConnected: status === 'active',
        status,
        accountId: user.stripe_account_id,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
    };
}
