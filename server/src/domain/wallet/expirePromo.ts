import { prisma } from '../../db/prisma';
import { appendLedgerEntry } from '../ledger/append';
import { isFinancialTrustSchemaError } from '../schemaGuard';

/** Expire promotional wallet credits past promotional_expires_at (default 12-month grants). */
export async function expireDuePromotionalCredits() {
    try {
        const now = new Date().toISOString();
        const due = await prisma.provider_fee_wallets.findMany({
            where: {
                promotional_expires_at: { lt: now },
                promotional_balance: { gt: 0 },
            },
            take: 50,
        });

        for (const wallet of due) {
            const promo = wallet.promotional_balance ?? 0;
            const purchased = wallet.purchased_balance ?? 0;
            if (promo <= 0) continue;

            await prisma.provider_fee_wallets.update({
                where: { id: wallet.id },
                data: {
                    promotional_balance: 0,
                    balance: purchased,
                    promotional_expires_at: null,
                    updated_at: now,
                },
            });

            await appendLedgerEntry({
                entityType: 'provider_fee_wallet',
                entityId: wallet.id,
                eventType: 'manual_adjustment',
                payload: {
                    reason: 'promotional_credit_expired',
                    expired_amount: promo,
                    purchased_balance: purchased,
                },
                actorId: 'system',
            }).catch(() => { /* non-blocking */ });
        }

        return { expired: due.length };
    } catch (err) {
        if (isFinancialTrustSchemaError(err)) return { expired: 0, schema_pending: true };
        throw err;
    }
}
