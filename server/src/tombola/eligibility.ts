import { prisma } from '../db/prisma';
import { TOMBOLA_CONFIG, type EligibilityBreakdown, type ParticipantRole } from './config';

function daysAgoIso(days: number): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    return d.toISOString();
}

export async function assertUserCanParticipate(userId: string): Promise<{
    user: { id: string; role: string | null; full_name: string | null; clerk_user_id: string | null };
    blocked: string[];
}> {
    const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, role: true, full_name: true, clerk_user_id: true },
    });
    if (!user) throw new Error('User not found');

    const blocked: string[] = [];
    if (!user.clerk_user_id) blocked.push('Verify your account (sign in with a confirmed email) to participate.');
    if (user.role && TOMBOLA_CONFIG.excludedRoles.has(user.role)) {
        blocked.push('Platform staff accounts cannot participate in the tombola.');
    }

    const openDispute = await prisma.disputes.findFirst({
        where: {
            status: { in: ['Open', 'In Review', 'open', 'in_review'] },
            booking: {
                OR: [{ client_id: userId }, { barber: { user_id: userId } }],
            },
        },
        select: { id: true },
    });
    if (openDispute) blocked.push('Resolve open disputes before participating.');

    return { user, blocked };
}

async function resolveParticipantRole(userId: string, role: string | null): Promise<ParticipantRole | null> {
    const barber = await prisma.barbers.findFirst({
        where: { user_id: userId, status: { not: 'inactive' } },
        select: { id: true },
    });
    if (barber && (role === 'barber' || role === 'provider' || role === 'shop_owner')) {
        return 'barber';
    }
    if (role === 'client' || !barber) return 'client';
    if (barber) return 'barber';
    return 'client';
}

export async function evaluateClientEligibility(
    userId: string,
    weekStart: string,
    weekEnd: string
): Promise<EligibilityBreakdown> {
    const cfg = TOMBOLA_CONFIG.client;
    const reasons: string[] = [];
    const breakdown: Record<string, number> = {};

    const since30d = daysAgoIso(30);
    const completed30d = await prisma.bookings.count({
        where: {
            client_id: userId,
            status: 'completed',
            start_time: { gte: since30d },
        },
    });
    if (completed30d < cfg.minCompletedBookings30d) {
        reasons.push(`Complete at least ${cfg.minCompletedBookings30d} appointment in the last 30 days.`);
    }

    const completedThisWeek = await prisma.bookings.count({
        where: {
            client_id: userId,
            status: 'completed',
            start_time: { gte: weekStart, lte: weekEnd },
        },
    });

    const paidOrders = await prisma.orders.findMany({
        where: {
            user_id: userId,
            payment_status: 'paid',
            created_at: { gte: weekStart, lte: weekEnd },
        },
        select: { total: true },
    });
    const marketplaceQualifying = paidOrders.some((o) => (o.total ?? 0) >= cfg.marketplaceMinTotal);

    const reviewThisWeek = await prisma.reviews.count({
        where: {
            reviewer_id: userId,
            created_at: { gte: weekStart, lte: weekEnd },
        },
    });

    const tipThisWeek = await prisma.booking_tips.count({
        where: {
            client_id: userId,
            status: 'paid',
            paid_at: { gte: weekStart, lte: weekEnd },
        },
    });

    if (completed30d >= cfg.minCompletedBookings30d) {
        breakdown.base = cfg.baseEntries;
        breakdown.bookings_this_week = Math.min(
            completedThisWeek * cfg.bonusPerBookingThisWeek,
            cfg.maxBookingBonuses
        );
        if (marketplaceQualifying) breakdown.marketplace = cfg.marketplaceBonus;
        if (reviewThisWeek > 0) breakdown.review = cfg.reviewBonus;
        if (tipThisWeek > 0) breakdown.tip = cfg.tipBonus;
    }

    let entryCount = Object.values(breakdown).reduce((a, b) => a + b, 0);
    entryCount = Math.min(entryCount, cfg.maxEntries);

    return {
        eligible: reasons.length === 0 && entryCount > 0,
        role: 'client',
        reasons,
        breakdown,
        entry_count: entryCount,
    };
}

export async function evaluateBarberEligibility(
    userId: string,
    weekStart: string,
    weekEnd: string
): Promise<EligibilityBreakdown> {
    const cfg = TOMBOLA_CONFIG.barber;
    const reasons: string[] = [];
    const breakdown: Record<string, number> = {};

    const barber = await prisma.barbers.findFirst({
        where: { user_id: userId },
        select: { id: true, rating: true, review_count: true },
    });
    if (!barber) {
        return {
            eligible: false,
            role: 'barber',
            reasons: ['Link an active barber profile to participate as a professional.'],
            breakdown: {},
            entry_count: 0,
        };
    }

    const completedWeek = await prisma.bookings.count({
        where: {
            barber_id: barber.id,
            status: 'completed',
            start_time: { gte: weekStart, lte: weekEnd },
        },
    });
    if (completedWeek < cfg.minCompletedBookingsWeek) {
        reasons.push(`Complete at least ${cfg.minCompletedBookingsWeek} client appointments this week.`);
    }

    const rating = barber.rating ?? 0;
    const reviewCount = barber.review_count ?? 0;
    if (reviewCount < cfg.minReviewCount || rating < cfg.minRating) {
        reasons.push(`Maintain rating ≥ ${cfg.minRating} with at least ${cfg.minReviewCount} reviews.`);
    }

    const weekBookings = await prisma.bookings.findMany({
        where: {
            barber_id: barber.id,
            start_time: { gte: weekStart, lte: weekEnd },
        },
        select: { status: true },
    });
    const totalWeek = weekBookings.length;
    const cancelled = weekBookings.filter((b) => b.status === 'cancelled').length;
    if (totalWeek > 0 && cancelled / totalWeek > cfg.maxCancellationRate) {
        reasons.push('Keep weekly cancellation rate below 10%.');
    }

    if (reasons.length === 0) {
        breakdown.base = cfg.baseEntries;
        breakdown.completions = Math.min(
            Math.floor(completedWeek / 5) * cfg.bonusPerFiveCompletions,
            cfg.maxCompletionBonuses
        );
        if (rating >= cfg.highRatingThreshold) breakdown.high_rating = cfg.highRatingBonus;
    }

    let entryCount = Object.values(breakdown).reduce((a, b) => a + b, 0);
    entryCount = Math.min(entryCount, cfg.maxEntries);

    return {
        eligible: reasons.length === 0 && entryCount > 0,
        role: 'barber',
        reasons,
        breakdown,
        entry_count: entryCount,
    };
}

export async function evaluateUserEligibility(
    userId: string,
    weekStart: string,
    weekEnd: string,
    preferRole?: ParticipantRole
): Promise<EligibilityBreakdown & { blocked: string[] }> {
    const { user, blocked } = await assertUserCanParticipate(userId);
    if (blocked.length) {
        return {
            eligible: false,
            role: null,
            reasons: blocked,
            breakdown: {},
            entry_count: 0,
            blocked,
        };
    }

    const role = preferRole ?? (await resolveParticipantRole(userId, user.role));
    if (!role) {
        return {
            eligible: false,
            role: null,
            reasons: ['Unable to determine participant role.'],
            breakdown: {},
            entry_count: 0,
            blocked: [],
        };
    }

    const result =
        role === 'barber'
            ? await evaluateBarberEligibility(userId, weekStart, weekEnd)
            : await evaluateClientEligibility(userId, weekStart, weekEnd);

    return { ...result, blocked: [] };
}

/** Free alternate entry (no purchase necessary, 1 ticket). */
export function freeEntryEligibility(): EligibilityBreakdown {
    return {
        eligible: true,
        role: 'client',
        reasons: [],
        breakdown: { free_alternate: 1 },
        entry_count: 1,
    };
}
