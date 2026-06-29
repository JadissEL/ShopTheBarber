import { prisma } from '../../db/prisma';
import { sendEmail } from '../../logic/email';
import {
    computeWalletHealthStatus,
    walletHealthLabel,
    walletHealthWorsened,
    type WalletHealthStatus,
} from './health';

const NUDGE_STATUSES: WalletHealthStatus[] = ['warning', 'critical', 'blocked'];

export async function syncProviderWalletHealth(walletId: string) {
    const wallet = await prisma.provider_fee_wallets.findUnique({
        where: { id: walletId },
        include: { user: { select: { email: true, full_name: true } } },
    });
    if (!wallet) return null;

    const balance = wallet.balance ?? 0;
    const healthStatus = computeWalletHealthStatus(balance);
    const previous = (wallet.health_status as WalletHealthStatus) || 'good';

    if (wallet.health_status === healthStatus) return healthStatus;

    await prisma.provider_fee_wallets.update({
        where: { id: walletId },
        data: { health_status: healthStatus },
    });

    const worsened = walletHealthWorsened(previous, healthStatus);
    if (worsened && NUDGE_STATUSES.includes(healthStatus) && wallet.user?.email) {
        sendEmail({
            to: wallet.user.email,
            subject: `Wallet health: ${walletHealthLabel(healthStatus)} — top up recommended`,
            template: 'wallet_health',
            data: {
                providerName: wallet.user.full_name || 'there',
                healthLabel: walletHealthLabel(healthStatus),
                balance: balance.toFixed(2),
                currency: wallet.currency ?? 'EUR',
                cashBlocked: healthStatus === 'blocked',
            },
        }).catch(() => { /* non-blocking */ });
    }

    return healthStatus;
}

export async function syncProviderWalletHealthByUser(userId: string, shopId?: string | null) {
    const wallet = await prisma.provider_fee_wallets.findFirst({
        where: shopId ? { user_id: userId, shop_id: shopId } : { user_id: userId, shop_id: null },
    });
    if (!wallet) return null;
    return syncProviderWalletHealth(wallet.id);
}
