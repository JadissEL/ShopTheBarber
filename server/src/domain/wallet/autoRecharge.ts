import crypto from 'crypto';
import { prisma } from '../../db/prisma';
import { isFinancialTrustSchemaError } from '../schemaGuard';

/** Phase 2 optional auto-recharge — nudge when below threshold (Stripe charge in Phase 3). */
export async function processAutoRechargeCandidates(limit = 20) {
    try {
        const users = await prisma.users.findMany({
            where: { auto_recharge_enabled: true },
            take: limit,
            select: {
                id: true,
                auto_recharge_threshold: true,
                auto_recharge_amount: true,
                provider_fee_wallets: { where: { shop_id: null }, take: 1 },
            },
        });

        let nudged = 0;
        for (const u of users) {
            const wallet = u.provider_fee_wallets[0];
            if (!wallet) continue;
            const threshold = u.auto_recharge_threshold ?? 10;
            if ((wallet.balance ?? 0) >= threshold) continue;

            await prisma.notifications.create({
                data: {
                    id: crypto.randomUUID(),
                    user_id: u.id,
                    title: 'Wallet below auto-recharge threshold',
                    content: `Balance €${(wallet.balance ?? 0).toFixed(2)} is below €${threshold}. Top up €${u.auto_recharge_amount ?? 50} to stay active.`,
                    type: 'wallet',
                },
            }).catch(() => {});
            nudged += 1;
        }

        return { checked: users.length, nudged };
    } catch (err) {
        if (isFinancialTrustSchemaError(err)) return { checked: 0, nudged: 0, schema_pending: true };
        throw err;
    }
}
