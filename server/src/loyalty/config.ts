/**
 * ShopTheBarber loyalty program, calibrated vs Booksy/Fresha/industry benchmarks:
 * - Earn: 1 point per $1 spent (standard)
 * - Return: ~2% effective (100 pts ≈ $2 off), sustainable 1.5-2.5% band
 * - First meaningful reward within 2-3 visits (~$40-50 avg ticket)
 * - Tier multipliers reward long-term clients without breaking margins
 */

export type LoyaltyTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export type LoyaltyReward = {
    id: string;
    title: string;
    description: string;
    points_cost: number;
    icon: string;
    reward_type: 'discount' | 'perk';
    discount_type?: 'fixed' | 'percentage';
    discount_value?: number;
};

export const LOYALTY_CONFIG = {
    /** Base earn rate, matches Terms of Service & Booksy/Fresha norm */
    points_per_dollar: 1,
    /** Redemption: 100 points = $2 cash value 2% effective loyalty cost */
    cents_per_point: 2,
    /** Retail/marketplace earn multiplier (Booksy pattern: 2× on products) */
    marketplace_multiplier: 2,
    min_spend_for_points: 5,
    points_expire_months: 12,
    tier_thresholds: {
        Bronze: 0,
        Silver: 500,
        Gold: 1500,
        Platinum: 3500,
    } satisfies Record<LoyaltyTier, number>,
    tier_multipliers: {
        Bronze: 1,
        Silver: 1.1,
        Gold: 1.25,
        Platinum: 1.5,
    } satisfies Record<LoyaltyTier, number>,
    rewards: [
        {
            id: 'discount_5',
            title: '$5 Off Any Service',
            description: 'Apply at checkout on your next booking',
            points_cost: 50,
            icon: '💰',
            reward_type: 'discount',
            discount_type: 'fixed',
            discount_value: 5,
        },
        {
            id: 'discount_10',
            title: '$10 Off Any Service',
            description: 'Best value after a few visits (~$100 spent)',
            points_cost: 100,
            icon: '💰',
            reward_type: 'discount',
            discount_type: 'fixed',
            discount_value: 10,
        },
        {
            id: 'beard_trim',
            title: 'Free Beard Trim',
            description: 'Redeem for a complimentary beard trim',
            points_cost: 120,
            icon: '🧔',
            reward_type: 'discount',
            discount_type: 'fixed',
            discount_value: 12,
        },
        {
            id: 'cut_15',
            title: '$15 Off Premium Service',
            description: 'Works on cuts, combos, and styling',
            points_cost: 150,
            icon: '✂️',
            reward_type: 'discount',
            discount_type: 'fixed',
            discount_value: 15,
        },
        {
            id: 'priority_30',
            title: 'Priority Booking, 30 Days',
            description: 'Early access to peak slots for one month',
            points_cost: 200,
            icon: '⭐',
            reward_type: 'perk',
        },
    ] satisfies LoyaltyReward[],
} as const;

export function tierFromLifetimePoints(lifetime: number): LoyaltyTier {
    if (lifetime >= LOYALTY_CONFIG.tier_thresholds.Platinum) return 'Platinum';
    if (lifetime >= LOYALTY_CONFIG.tier_thresholds.Gold) return 'Gold';
    if (lifetime >= LOYALTY_CONFIG.tier_thresholds.Silver) return 'Silver';
    return 'Bronze';
}

export function tierMultiplier(tier: string | null | undefined): number {
    const key = (tier ?? 'Bronze') as LoyaltyTier;
    return LOYALTY_CONFIG.tier_multipliers[key] ?? 1;
}

/** Points earned for a dollar amount at a given tier */
export function calculateEarnedPoints(
    amountUsd: number,
    tier: string | null | undefined,
    options?: { marketplace?: boolean }
): number {
    if (!Number.isFinite(amountUsd) || amountUsd < LOYALTY_CONFIG.min_spend_for_points) return 0;
    const mult = tierMultiplier(tier) * (options?.marketplace ? LOYALTY_CONFIG.marketplace_multiplier : 1);
    return Math.max(1, Math.floor(amountUsd * LOYALTY_CONFIG.points_per_dollar * mult));
}

/** Dollar value of a points balance for UI */
export function pointsToDollarValue(points: number): number {
    return Math.round(((points * LOYALTY_CONFIG.cents_per_point) / 100) * 100) / 100;
}

export function getRewardById(rewardId: string): LoyaltyReward | undefined {
    return LOYALTY_CONFIG.rewards.find((r) => r.id === rewardId);
}

export function getProgramPublicConfig() {
    return {
        ...LOYALTY_CONFIG,
        competitive_note:
            'Industry standard is 1 point per $1 (Booksy, Fresha). We return ~2% value, competitive without eroding margins.',
        points_per_dollar_display: '1 point per $1 spent on completed bookings',
        redemption_display: `100 points = $${(100 * LOYALTY_CONFIG.cents_per_point) / 100} off`,
        first_reward_hint: 'Most clients unlock their first $5 reward after 2-3 visits',
        tiers: (['Bronze', 'Silver', 'Gold', 'Platinum'] as LoyaltyTier[]).map((name) => ({
            name,
            threshold: LOYALTY_CONFIG.tier_thresholds[name],
            multiplier: LOYALTY_CONFIG.tier_multipliers[name],
        })),
    };
}
