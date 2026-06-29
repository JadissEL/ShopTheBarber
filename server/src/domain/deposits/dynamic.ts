import { getPlatformMinimumDeposit, resolveEffectiveDeposit } from './tiers';

/**
 * Dynamic deposit adjustment based on client reliability (Phase 2).
 * High reliability → up to 25% reduction (never below platform floor).
 * Low reliability → up to 100% of service price.
 */
export function applyDynamicDepositAdjustment(params: {
    servicePrice: number;
    policyDepositAmount: number;
    depositEnabled: boolean;
    reliabilityIndex: number;
    reputationLevel?: string;
}): number {
    const base = resolveEffectiveDeposit({
        servicePrice: params.servicePrice,
        policyDepositAmount: params.policyDepositAmount,
        depositEnabled: params.depositEnabled,
    });
    if (!params.depositEnabled || base <= 0) return 0;

    const platformMin = getPlatformMinimumDeposit(params.servicePrice);
    const reliability = params.reliabilityIndex ?? 100;

    if (reliability < 50) {
        return Math.min(params.servicePrice, Math.max(base, params.servicePrice * 0.75));
    }
    if (reliability < 70) {
        return Math.min(params.servicePrice, Math.max(base, base * 1.25));
    }

    let discountPct = 0;
    if (reliability >= 95) discountPct = 0.25;
    else if (reliability >= 85) discountPct = 0.15;
    else if (reliability >= 75) discountPct = 0.1;

    const levelBoost: Record<string, number> = {
        gold: 0.05,
        platinum: 0.08,
        diamond: 0.1,
        legend: 0.12,
    };
    discountPct += levelBoost[params.reputationLevel ?? ''] ?? 0;
    discountPct = Math.min(0.3, discountPct);

    const adjusted = Math.max(platformMin, base * (1 - discountPct));
    return Math.round(Math.min(params.servicePrice, adjusted) * 100) / 100;
}
