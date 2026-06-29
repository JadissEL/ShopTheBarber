/** Weekly tombola, eligibility thresholds & caps (industry-aligned). */

export const TOMBOLA_CONFIG = {
    prize: {
        title: 'Dream Getaway for Two',
        description:
            'Round-trip travel and accommodation for two adults. Dates and destination subject to availability and official contest rules.',
    },
    draw: {
        /** Live draw every Sunday 20:00 UTC */
        drawDayUtc: 0 as const, // Sunday
        drawHourUtc: 20,
        countdownSeconds: 45,
    },
    client: {
        /** Min completed bookings in last 30 days for base eligibility */
        minCompletedBookings30d: 1,
        /** Max total entries per week */
        maxEntries: 5,
        baseEntries: 1,
        bonusPerBookingThisWeek: 1,
        maxBookingBonuses: 3,
        marketplaceMinTotal: 25,
        marketplaceBonus: 1,
        reviewBonus: 1,
        tipBonus: 2,
    },
    barber: {
        minCompletedBookingsWeek: 4,
        minRating: 4.0,
        minReviewCount: 5,
        maxCancellationRate: 0.1,
        maxEntries: 5,
        baseEntries: 1,
        bonusPerFiveCompletions: 1,
        maxCompletionBonuses: 3,
        highRatingBonus: 1,
        highRatingThreshold: 4.5,
    },
    excludedRoles: new Set(['admin']),
    /** Skill-testing question (Canadian contest practice) */
    skillQuestion: 'What is 8 + 5?',
    skillAnswer: '13',
    rulesUrl: '/HelpCenter',
} as const;

export type ParticipantRole = 'client' | 'barber';

export type EligibilityBreakdown = {
    eligible: boolean;
    role: ParticipantRole | null;
    reasons: string[];
    breakdown: Record<string, number>;
    entry_count: number;
};

export type DrawStatus = 'open' | 'locked' | 'live' | 'completed';
