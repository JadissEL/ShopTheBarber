import { prisma } from '../db/prisma';

export async function getWalletForUser(userId: string) {
    let wallet = await prisma.wallet_accounts.findUnique({
        where: { user_id: userId },
        include: {
            transactions: {
                orderBy: { created_at: 'desc' },
                take: 50,
            },
        },
    });

    if (!wallet) {
        wallet = await prisma.wallet_accounts.create({
            data: {
                id: crypto.randomUUID(),
                user_id: userId,
                balance: 0,
                currency: 'USD',
            },
            include: { transactions: true },
        });
    }

    return {
        balance: wallet.balance ?? 0,
        currency: wallet.currency ?? 'USD',
        transactions: wallet.transactions.map((t) => ({
            id: t.id,
            amount: t.amount,
            type: t.type,
            description: t.description,
            created_at: t.created_at,
        })),
    };
}
