import { prisma } from '../db/prisma';
import {
    calculateEarnedPoints,
    getRewardById,
    pointsToDollarValue,
    tierFromLifetimePoints,
    LOYALTY_CONFIG,
    type LoyaltyTier,
} from './config';
import { createLoyaltyNotification } from './notifications';

export type AwardPointsInput = {
    user_id: string;
    points: number;
    type: string;
    description: string;
    related_entity_id?: string | null;
};

async function hasExistingAward(userId: string, type: string, relatedEntityId: string): Promise<boolean> {
    const existing = await prisma.loyalty_transactions.findFirst({
        where: {
            user_id: userId,
            type,
            related_entity_id: relatedEntityId,
        },
    });
    return !!existing;
}

export async function getOrCreateProfile(userId: string) {
    let profile = await prisma.loyalty_profiles.findUnique({ where: { user_id: userId } });
    if (!profile) {
        profile = await prisma.loyalty_profiles.create({
            data: {
                user_id: userId,
                current_points: 0,
                lifetime_points: 0,
                tier: 'Bronze',
            },
        });
    }
    return profile;
}

export async function applyPointsDelta(input: AwardPointsInput): Promise<{ profile: Awaited<ReturnType<typeof getOrCreateProfile>>; transaction_id: string }> {
    if (input.related_entity_id) {
        const dup = await hasExistingAward(input.user_id, input.type, input.related_entity_id);
        if (dup) {
            const profile = await getOrCreateProfile(input.user_id);
            return { profile, transaction_id: '' };
        }
    }

    const profile = await getOrCreateProfile(input.user_id);
    const newCurrent = Math.max(0, (profile.current_points ?? 0) + input.points);
    const newLifetime =
        input.points > 0 ? (profile.lifetime_points ?? 0) + input.points : (profile.lifetime_points ?? 0);
    const tier = tierFromLifetimePoints(newLifetime);

    const updated = await prisma.loyalty_profiles.update({
        where: { id: profile.id },
        data: {
            current_points: newCurrent,
            lifetime_points: newLifetime,
            tier,
        },
    });

    const tx = await prisma.loyalty_transactions.create({
        data: {
            user_id: input.user_id,
            points: input.points,
            type: input.type,
            description: input.description,
            related_entity_id: input.related_entity_id ?? null,
        },
    });

    return { profile: updated, transaction_id: tx.id };
}

export async function awardPointsForCompletedBooking(bookingId: string): Promise<{ points: number; skipped?: boolean }> {
    const booking = await prisma.bookings.findUnique({ where: { id: bookingId } });
    if (!booking?.client_id || booking.status !== 'completed') {
        return { points: 0, skipped: true };
    }

    const amount = Number(booking.price_at_booking ?? 0);
    if (amount < LOYALTY_CONFIG.min_spend_for_points) return { points: 0, skipped: true };

    const profile = await getOrCreateProfile(booking.client_id);
    const previousTier = (profile.tier ?? 'Bronze') as LoyaltyTier;
    const points = calculateEarnedPoints(amount, profile.tier);

    const { profile: updated, transaction_id } = await applyPointsDelta({
        user_id: booking.client_id,
        points,
        type: 'earned_booking',
        description: `Booking completed, $${amount.toFixed(2)}`,
        related_entity_id: bookingId,
    });

    if (!transaction_id) return { points: 0, skipped: true };

    await createLoyaltyNotification(
        booking.client_id,
        'Points earned!',
        `You earned ${points} loyalty points for your completed booking ($${amount.toFixed(2)}).`,
        'loyalty_earned'
    );

    const newTier = (updated.tier ?? 'Bronze') as LoyaltyTier;
    if (newTier !== previousTier) {
        await createLoyaltyNotification(
            booking.client_id,
            `Welcome to ${newTier}!`,
            `You've reached ${newTier} status, enjoy boosted point earnings on every visit.`,
            'loyalty_tier'
        );
    }

    return { points };
}

export async function awardPointsForMarketplaceOrder(userId: string, orderId: string, orderTotal: number): Promise<number> {
    if (orderTotal < LOYALTY_CONFIG.min_spend_for_points) return 0;

    const profile = await getOrCreateProfile(userId);
    const points = calculateEarnedPoints(orderTotal, profile.tier, { marketplace: true });

    const { transaction_id } = await applyPointsDelta({
        user_id: userId,
        points,
        type: 'earned_marketplace',
        description: `Marketplace order, $${orderTotal.toFixed(2)} (2× points)`,
        related_entity_id: orderId,
    });

    if (transaction_id && points > 0) {
        await createLoyaltyNotification(
            userId,
            'Marketplace points earned!',
            `You earned ${points} loyalty points (2×) on your product purchase.`,
            'loyalty_earned'
        );
    }

    return points;
}

function generateLoyaltyPromoCode(userId: string): string {
    const slice = userId.replace(/-/g, '').slice(0, 6).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `LOYAL-${slice}-${rand}`;
}

export async function redeemReward(userId: string, rewardId: string) {
    const reward = getRewardById(rewardId);
    if (!reward) throw new Error('Reward not found');

    const profile = await getOrCreateProfile(userId);
    const balance = profile.current_points ?? 0;
    if (balance < reward.points_cost) {
        throw new Error(`Not enough points. You need ${reward.points_cost} but have ${balance}.`);
    }

    let promoCode: string | null = null;
    if (reward.reward_type === 'discount' && reward.discount_type && reward.discount_value != null) {
        promoCode = generateLoyaltyPromoCode(userId);
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 3);
        await prisma.promo_codes.create({
            data: {
                code: promoCode,
                discount_type: reward.discount_type,
                discount_value: reward.discount_value,
                shop_id: null,
                is_active: true,
                owner_user_id: userId,
                expiry_date: expiry.toISOString(),
            },
        });
    }

    await applyPointsDelta({
        user_id: userId,
        points: -reward.points_cost,
        type: 'redeemed_reward',
        description: `Redeemed: ${reward.title}${promoCode ? ` (${promoCode})` : ''}`,
    });

    const redeemMessage = promoCode
        ? `Use code ${promoCode} at checkout, valid for 90 days`
        : `${reward.title} is now active on your account`;

    await createLoyaltyNotification(
        userId,
        'Reward redeemed!',
        promoCode ? `${reward.title}, ${redeemMessage}` : redeemMessage,
        'loyalty_redeemed'
    );

    return {
        reward,
        promo_code: promoCode,
        message: redeemMessage,
    };
}

export async function getMyActiveRewardCodes(userId: string) {
    const rows = await prisma.promo_codes.findMany({
        where: {
            owner_user_id: userId,
            is_active: true,
        },
        orderBy: { code: 'desc' },
    });

    const now = Date.now();
    return rows
        .filter((row) => {
            if (!row.expiry_date) return true;
            const exp = new Date(row.expiry_date).getTime();
            return Number.isFinite(exp) && exp > now;
        })
        .map((row) => ({
            code: row.code,
            discount_type: row.discount_type,
            discount_value: row.discount_value,
            discount_text:
                row.discount_type === 'percentage'
                    ? `${row.discount_value}% off`
                    : `$${row.discount_value} off`,
            expiry_date: row.expiry_date,
        }));
}

export async function getLoyaltySummary(userId: string) {
    const profile = await getOrCreateProfile(userId);
    const transactions = await prisma.loyalty_transactions.findMany({
        where: { user_id: userId },
        orderBy: { date_text: 'desc' },
        take: 50,
    });

    const current = profile.current_points ?? 0;
    const lifetime = profile.lifetime_points ?? 0;
    const tier = profile.tier ?? 'Bronze';

    const thresholds = LOYALTY_CONFIG.tier_thresholds;
    let nextTierName: string | null = null;
    let pointsToNextTier: number | null = null;
    if (lifetime < thresholds.Silver) {
        nextTierName = 'Silver';
        pointsToNextTier = thresholds.Silver - lifetime;
    } else if (lifetime < thresholds.Gold) {
        nextTierName = 'Gold';
        pointsToNextTier = thresholds.Gold - lifetime;
    } else if (lifetime < thresholds.Platinum) {
        nextTierName = 'Platinum';
        pointsToNextTier = thresholds.Platinum - lifetime;
    }

    return {
        profile,
        current_points: current,
        lifetime_points: lifetime,
        tier,
        dollar_value: pointsToDollarValue(current),
        next_tier: nextTierName,
        points_to_next_tier: pointsToNextTier,
        transactions,
        active_reward_codes: await getMyActiveRewardCodes(userId),
        earn_preview: (amount: number) => calculateEarnedPoints(amount, tier),
    };
}

export { pointsToDollarValue, calculateEarnedPoints };
