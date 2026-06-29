/** Point deltas for client reputation — docs/specs/REPUTATION_TRUST.md */

export const REPUTATION_EVENT_DELTAS: Record<string, { points: number; reliability?: number }> = {
    booking_completed: { points: 5 },
    marketplace_purchase_small: { points: 1 },
    marketplace_purchase_medium: { points: 3 },
    marketplace_purchase_large: { points: 5 },
    verified_review: { points: 2 },
    review_helpful: { points: 1 },
    verified_email: { points: 3 },
    verified_phone: { points: 5 },
    verified_id: { points: 20 },
    profile_complete: { points: 10 },
    referral_client_success: { points: 15 },
    referral_barber_success: { points: 30 },
    referral_first_purchase: { points: 10 },
    spend_milestone_100: { points: 2 },
    platform_anniversary: { points: 5 },
    late_cancellation: { points: -5, reliability: -5 },
    no_show: { points: -20, reliability: -15 },
    dispute_lost: { points: -30, reliability: -20 },
    fraud_attempt: { points: -100, reliability: -50 },
    inactive_month: { points: -1 },
    fast_response: { points: 0, reliability: 2 },
    long_membership: { points: 0, reliability: 3 },
};

export function marketplacePurchaseTier(amountEur: number): string {
    if (amountEur >= 100) return 'marketplace_purchase_large';
    if (amountEur >= 20) return 'marketplace_purchase_medium';
    return 'marketplace_purchase_small';
}
