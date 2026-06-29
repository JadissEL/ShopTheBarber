/** Provider wallet health tiers — internal only; see docs/specs/FINANCIAL_ECOSYSTEM.md */

export const WALLET_HEALTH_STATUSES = [
    'excellent',
    'good',
    'warning',
    'critical',
    'blocked',
] as const;

export type WalletHealthStatus = (typeof WALLET_HEALTH_STATUSES)[number];

export function computeWalletHealthStatus(balance: number): WalletHealthStatus {
    if (balance >= 250) return 'excellent';
    if (balance >= 50) return 'good';
    if (balance >= 10) return 'warning';
    if (balance >= -10) return 'critical';
    if (balance >= -20) return 'critical';
    return 'blocked';
}

export function blocksCashBookings(status: WalletHealthStatus): boolean {
    return status === 'blocked';
}

export function walletHealthLabel(status: WalletHealthStatus): string {
    switch (status) {
        case 'excellent':
            return 'Excellent';
        case 'good':
            return 'Good';
        case 'warning':
            return 'Warning';
        case 'critical':
            return 'Critical';
        case 'blocked':
            return 'Blocked';
    }
}

export function walletHealthTierRank(status: WalletHealthStatus): number {
    return WALLET_HEALTH_STATUSES.indexOf(status);
}

export function walletHealthWorsened(
    previous: WalletHealthStatus,
    next: WalletHealthStatus
): boolean {
    return walletHealthTierRank(next) > walletHealthTierRank(previous);
}
