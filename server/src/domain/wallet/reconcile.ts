import crypto from 'crypto';
import { prisma } from '../../db/prisma';
import { isFinancialTrustSchemaError } from '../schemaGuard';

export async function reconcileProviderWallet(walletId: string) {
    const wallet = await prisma.provider_fee_wallets.findUnique({
        where: { id: walletId },
        include: { transactions: { select: { amount: true } } },
    });
    if (!wallet) return null;

    const txSum = wallet.transactions.reduce((s, t) => s + (t.amount ?? 0), 0);
    const actual = wallet.balance ?? 0;
    const delta = Math.round((actual - txSum) * 100) / 100;
    const status = Math.abs(delta) < 0.01 ? 'ok' : 'mismatch';

    await prisma.wallet_reconciliation_runs.create({
        data: {
            id: crypto.randomUUID(),
            wallet_id: walletId,
            wallet_kind: 'provider_fee',
            expected_balance: txSum,
            actual_balance: actual,
            delta,
            status,
        },
    });

    return { wallet_id: walletId, expected: txSum, actual, delta, status };
}

export async function reconcileAllProviderWallets(limit = 50) {
    try {
        const wallets = await prisma.provider_fee_wallets.findMany({ take: limit, select: { id: true } });
        const results = [];
        let mismatches = 0;
        for (const w of wallets) {
            const r = await reconcileProviderWallet(w.id);
            if (r && r.status === 'mismatch') mismatches += 1;
            if (r) results.push(r);
        }
        return { scanned: results.length, mismatches, results };
    } catch (err) {
        if (isFinancialTrustSchemaError(err)) return { scanned: 0, mismatches: 0, schema_pending: true };
        throw err;
    }
}

export async function listRecentWalletReconciliationRuns(limit = 50, mismatchesOnly = false) {
    try {
        const runs = await prisma.wallet_reconciliation_runs.findMany({
            where: mismatchesOnly ? { status: 'mismatch' } : undefined,
            orderBy: { created_at: 'desc' },
            take: limit,
        });
        return runs;
    } catch (err) {
        if (isFinancialTrustSchemaError(err)) return [];
        throw err;
    }
}
