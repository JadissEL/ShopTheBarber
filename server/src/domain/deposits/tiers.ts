/** Platform minimum deposit tiers — see docs/specs/FINANCIAL_ECOSYSTEM.md */

function roundMoney(n: number): number {
    return Math.round(n * 100) / 100;
}

export function getPlatformMinimumDeposit(servicePrice: number): number {
    const price = Math.max(0, servicePrice);
    if (price < 30) return 10;
    if (price < 50) return 15;
    if (price < 100) return 25;
    if (price < 200) return 50;
    if (price < 400) return 100;
    return roundMoney(price * 0.3);
}

/**
 * Effective deposit: max(platform minimum, barber policy amount).
 * Barber may never set below platform minimum.
 */
export function resolveEffectiveDeposit(params: {
    servicePrice: number;
    policyDepositAmount: number;
    depositEnabled: boolean;
}): number {
    if (!params.depositEnabled || params.servicePrice <= 0) return 0;
    const platformMin = getPlatformMinimumDeposit(params.servicePrice);
    const barberAmount = Math.max(0, params.policyDepositAmount);
    return roundMoney(Math.min(params.servicePrice, Math.max(platformMin, barberAmount)));
}

/** Percent-based policy deposit before tier floor is applied. */
export function policyDepositFromPercent(totalPrice: number, percent: number): number {
    if (totalPrice <= 0 || percent <= 0) return 0;
    return roundMoney(Math.min(totalPrice, (totalPrice * percent) / 100));
}
