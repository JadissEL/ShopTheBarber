import crypto from 'crypto';
import { prisma } from '../db/prisma';
import { appendLedgerEntry } from '../domain/ledger/append';

function generateGiftCode(): string {
    return `GIFT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export async function purchaseGiftCard(params: {
    purchaserId: string;
    amount: number;
    recipientEmail?: string;
    currency?: string;
}) {
    if (params.amount < 10 || params.amount > 500) {
        throw new Error('Gift card amount must be between €10 and €500');
    }

    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);

    let code = generateGiftCode();
    for (let i = 0; i < 5; i++) {
        const exists = await prisma.gift_cards.findUnique({ where: { code } });
        if (!exists) break;
        code = generateGiftCode();
    }

    const card = await prisma.gift_cards.create({
        data: {
            id: crypto.randomUUID(),
            code,
            purchaser_id: params.purchaserId,
            recipient_email: params.recipientEmail ?? null,
            original_amount: params.amount,
            balance: params.amount,
            currency: params.currency ?? 'EUR',
            expiry_date: expiry.toISOString(),
            status: 'active',
        },
    });

    await appendLedgerEntry({
        entityType: 'gift_card',
        entityId: card.id,
        eventType: 'manual_adjustment',
        payload: { action: 'gift_card_purchased', amount: params.amount, code },
        actorId: params.purchaserId,
    }).catch(() => {});

    return card;
}

export async function redeemGiftCard(params: { code: string; userId: string; amount: number }) {
    const card = await prisma.gift_cards.findUnique({ where: { code: params.code.toUpperCase().trim() } });
    if (!card || card.status !== 'active') throw new Error('Invalid or inactive gift card');
    if (card.expiry_date && new Date(card.expiry_date) < new Date()) {
        throw new Error('Gift card expired');
    }
    if ((card.balance ?? 0) < params.amount) throw new Error('Insufficient gift card balance');

    const newBalance = (card.balance ?? 0) - params.amount;
    await prisma.gift_cards.update({
        where: { id: card.id },
        data: {
            balance: newBalance,
            status: newBalance <= 0 ? 'redeemed' : 'active',
        },
    });

    let wallet = await prisma.wallet_accounts.findUnique({ where: { user_id: params.userId } });
    if (!wallet) {
        wallet = await prisma.wallet_accounts.create({
            data: { id: crypto.randomUUID(), user_id: params.userId, balance: 0, currency: card.currency ?? 'EUR' },
        });
    }

    await prisma.wallet_accounts.update({
        where: { id: wallet.id },
        data: { balance: (wallet.balance ?? 0) + params.amount, updated_at: new Date().toISOString() },
    });

    await prisma.wallet_transactions.create({
        data: {
            id: crypto.randomUUID(),
            wallet_id: wallet.id,
            user_id: params.userId,
            amount: params.amount,
            type: 'gift_card_redeem',
            description: `Redeemed ${card.code}`,
        },
    });

    await appendLedgerEntry({
        entityType: 'gift_card',
        entityId: card.id,
        eventType: 'manual_adjustment',
        payload: { action: 'gift_card_redeemed', amount: params.amount, user_id: params.userId },
        actorId: params.userId,
    }).catch(() => {});

    return { redeemed: params.amount, remaining: newBalance };
}

export async function listUserGiftCards(userId: string) {
    return prisma.gift_cards.findMany({
        where: {
            OR: [{ purchaser_id: userId }, { recipient_email: { not: null } }],
            status: { in: ['active', 'redeemed'] },
        },
        orderBy: { created_at: 'desc' },
        take: 50,
    });
}

export async function getGiftCardBalance(code: string) {
    const card = await prisma.gift_cards.findUnique({
        where: { code: code.toUpperCase().trim() },
        select: { balance: true, status: true, expiry_date: true, currency: true },
    });
    if (!card) throw new Error('Gift card not found');
    return card;
}
