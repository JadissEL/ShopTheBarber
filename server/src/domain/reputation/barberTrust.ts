import { prisma } from '../../db/prisma';
import { isFinancialTrustSchemaError } from '../schemaGuard';
import { Prisma } from '@prisma/client';

function isMissingRecordError(err: unknown): boolean {
    return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025';
}

/** Internal barber trust score 0–100 — docs/specs/REPUTATION_TRUST.md */
export async function computeBarberTrustScore(barberId: string): Promise<number> {
    const barber = await prisma.barbers.findUnique({
        where: { id: barberId },
        select: {
            id: true,
            created_at: true,
            rating: true,
            review_count: true,
            attestation_licensed: true,
            attestation_insured: true,
            user_id: true,
        },
    });
    if (!barber) return 50;

    const bookings = await prisma.bookings.findMany({
        where: { barber_id: barberId },
        select: { status: true, created_at: true, updated_at: true },
    });

    const total = bookings.length || 1;
    const cancelled = bookings.filter((b) => b.status === 'cancelled').length;
    const noShows = bookings.filter((b) => b.status === 'no_show').length;
    const completed = bookings.filter((b) => b.status === 'completed').length;

    const cancelRate = cancelled / total;
    const noShowRate = noShows / total;
    const completionRate = completed / total;

    const bookingIds = (await prisma.bookings.findMany({
        where: { barber_id: barberId },
        select: { id: true },
        take: 500,
    })).map((b) => b.id);

    const disputes =
        bookingIds.length > 0
            ? await prisma.disputes.count({
                  where: { booking_id: { in: bookingIds }, resolution_outcome: 'client_favored' },
              })
            : 0;

    let walletPenalty = 0;
    if (barber.user_id) {
        const wallet = await prisma.provider_fee_wallets.findFirst({
            where: { user_id: barber.user_id, shop_id: null },
            select: { health_status: true, balance: true },
        });
        if (wallet?.health_status === 'blocked') walletPenalty = 25;
        else if (wallet?.health_status === 'critical') walletPenalty = 10;
    }

    const tenureYears = barber.created_at
        ? (Date.now() - new Date(barber.created_at).getTime()) / (365.25 * 86400000)
        : 0;
    const tenureBonus = Math.min(10, tenureYears * 2);
    const ratingBonus = Math.min(15, (barber.rating ?? 0) * 3);
    const kycBonus = (barber.attestation_licensed ? 3 : 0) + (barber.attestation_insured ? 2 : 0);

    const score =
        50 +
        completionRate * 25 -
        cancelRate * 20 -
        noShowRate * 30 -
        disputes * 5 -
        walletPenalty +
        tenureBonus +
        ratingBonus +
        kycBonus;

    return Math.max(0, Math.min(100, Math.round(score * 10) / 10));
}

export async function syncBarberTrustScore(barberId: string) {
    try {
        const score = await computeBarberTrustScore(barberId);
        await prisma.barbers.update({
            where: { id: barberId },
            data: { trust_score: score, trust_score_updated_at: new Date().toISOString() },
        });
        return score;
    } catch (err) {
        if (isFinancialTrustSchemaError(err) || isMissingRecordError(err)) return null;
        throw err;
    }
}

export async function isBarberChampionshipEligible(barberId: string): Promise<boolean> {
    const barber = await prisma.barbers.findUnique({
        where: { id: barberId },
        select: { trust_score: true, user_id: true },
    });
    if (!barber || (barber.trust_score ?? 0) < 40) return false;

    const openFraud = await prisma.fraud_alerts.count({
        where: { entity_type: 'barber', entity_id: barberId, status: 'open', severity: 'high' },
    }).catch(() => 0);
    if (openFraud > 0) return false;

    if (barber.user_id) {
        const wallet = await prisma.provider_fee_wallets.findFirst({
            where: { user_id: barber.user_id, shop_id: null },
            select: { health_status: true },
        });
        if (wallet?.health_status === 'blocked') return false;
    }

    return true;
}
