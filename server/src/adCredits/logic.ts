import crypto from 'crypto';
import { prisma } from '../db/prisma';
import { appendLedgerEntry } from '../domain/ledger/append';

export async function getOrCreateAdCreditWallet(userId: string) {
    let wallet = await prisma.ad_credit_wallets.findUnique({ where: { user_id: userId } });
    if (!wallet) {
        wallet = await prisma.ad_credit_wallets.create({
            data: { id: crypto.randomUUID(), user_id: userId, balance: 0, currency: 'EUR' },
        });
    }
    return wallet;
}

export async function grantAdCredits(params: { userId: string; amount: number; reason: string; actorId?: string }) {
    if (params.amount <= 0) throw new Error('Amount must be positive');
    const wallet = await getOrCreateAdCreditWallet(params.userId);
    const newBalance = (wallet.balance ?? 0) + params.amount;

    await prisma.$transaction([
        prisma.ad_credit_wallets.update({
            where: { id: wallet.id },
            data: { balance: newBalance, updated_at: new Date().toISOString() },
        }),
        prisma.ad_credit_transactions.create({
            data: {
                id: crypto.randomUUID(),
                wallet_id: wallet.id,
                amount: params.amount,
                type: 'grant',
                description: params.reason,
            },
        }),
    ]);

    await appendLedgerEntry({
        entityType: 'ad_credit_wallet',
        entityId: wallet.id,
        eventType: 'promotional_credit',
        payload: { amount: params.amount, reason: params.reason },
        actorId: params.actorId ?? 'system',
    }).catch(() => {});

    return { balance: newBalance };
}

export async function spendAdCredits(params: { userId: string; amount: number; description: string }) {
    const wallet = await prisma.ad_credit_wallets.findUnique({ where: { user_id: params.userId } });
    if (!wallet || (wallet.balance ?? 0) < params.amount) throw new Error('Insufficient ad credits');

    const newBalance = (wallet.balance ?? 0) - params.amount;
    await prisma.$transaction([
        prisma.ad_credit_wallets.update({
            where: { id: wallet.id },
            data: { balance: newBalance, updated_at: new Date().toISOString() },
        }),
        prisma.ad_credit_transactions.create({
            data: {
                id: crypto.randomUUID(),
                wallet_id: wallet.id,
                amount: -params.amount,
                type: 'spend',
                description: params.description,
            },
        }),
    ]);

    return { balance: newBalance };
}
