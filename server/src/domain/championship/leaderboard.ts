import crypto from 'crypto';
import { prisma } from '../../db/prisma';
import { isFinancialTrustSchemaError } from '../schemaGuard';
import { syncBarberTrustScore, isBarberChampionshipEligible } from '../reputation/barberTrust';
import { syncAvailabilityScore } from '../reputation/availabilityScore';

const WEIGHTS = {
    reviews: 0.3,
    bookings: 0.25,
    revenue: 0.2,
    repeat: 0.1,
    cancellation: 0.07,
    response: 0.03,
    profile: 0.02,
    seniority: 0.02,
    verified: 0.01,
} as const;

function seasonKeyForDate(d = new Date()): string {
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    if (m < 3) return `${y - 1}-winter`;
    if (m < 6) return `${y}-spring`;
    if (m < 9) return `${y}-summer`;
    if (m < 12) return `${y}-autumn`;
    return `${y}-winter`;
}

function seasonBounds(key: string): { starts: string; ends: string; name: string } {
    const [yearPart, season] = key.split('-');
    const y = parseInt(yearPart, 10);
    const ranges: Record<string, [number, number]> = {
        spring: [2, 5],
        summer: [5, 8],
        autumn: [8, 11],
        winter: [11, 2],
    };
    const [startM, endM] = ranges[season] ?? [0, 5];
    const startYear = season === 'winter' && startM === 11 ? y : y;
    const endYear = season === 'winter' ? y + 1 : y;
    const starts = new Date(Date.UTC(startYear, startM, 1)).toISOString();
    const ends = new Date(Date.UTC(endYear, endM, 0, 23, 59, 59)).toISOString();
    const name = `${season.charAt(0).toUpperCase() + season.slice(1)} ${startYear}`;
    return { starts, ends, name };
}

export async function ensureActiveSeason() {
    const key = seasonKeyForDate();
    const existing = await prisma.championship_seasons.findUnique({ where: { season_key: key } });
    if (existing) return existing;

    const { starts, ends, name } = seasonBounds(key);
    return prisma.championship_seasons.create({
        data: { id: crypto.randomUUID(), season_key: key, name, starts_at: starts, ends_at: ends, status: 'active' },
    });
}

export async function computeBarberChampionshipScore(barberId: string, countryCode = 'GR') {
    const barber = await prisma.barbers.findUnique({
        where: { id: barberId },
        select: {
            rating: true,
            review_count: true,
            created_at: true,
            bio: true,
            image_url: true,
            attestation_licensed: true,
            attestation_insured: true,
            city: true,
        },
    });
    if (!barber) return 0;

    const bookings = await prisma.bookings.findMany({
        where: { barber_id: barberId, status: { in: ['confirmed', 'completed'] } },
        select: { client_id: true, status: true, price_at_booking: true, created_at: true },
    });

    const completed = bookings.filter((b) => b.status === 'completed');
    const revenue = completed.reduce((s, b) => s + (b.price_at_booking ?? 0), 0);
    const clients = completed.map((b) => b.client_id).filter(Boolean) as string[];
    const uniqueClients = new Set(clients).size;
    const repeatClients = clients.length - uniqueClients;
    const repeatRate = uniqueClients > 0 ? repeatClients / uniqueClients : 0;

    const cancelled = await prisma.bookings.count({ where: { barber_id: barberId, status: 'cancelled' } });
    const cancelRate = bookings.length > 0 ? cancelled / (bookings.length + cancelled) : 0;

    const reviewScore = Math.min(100, (barber.rating ?? 0) * 20);
    const bookingScore = Math.min(100, completed.length * 2);
    const revenueScore = Math.min(100, revenue / 50);
    const repeatScore = Math.min(100, repeatRate * 100);
    const cancelScore = Math.max(0, 100 - cancelRate * 200);
    const profileScore = barber.bio && barber.image_url ? 100 : 50;
    const seniorityYears = barber.created_at
        ? (Date.now() - new Date(barber.created_at).getTime()) / (365.25 * 86400000)
        : 0;
    const seniorityScore = Math.min(100, seniorityYears * 10);
    const verifiedScore = (barber.attestation_licensed ? 50 : 0) + (barber.attestation_insured ? 50 : 0);

    const composite =
        reviewScore * WEIGHTS.reviews +
        bookingScore * WEIGHTS.bookings +
        revenueScore * WEIGHTS.revenue +
        repeatScore * WEIGHTS.repeat +
        cancelScore * WEIGHTS.cancellation +
        75 * WEIGHTS.response +
        profileScore * WEIGHTS.profile +
        seniorityScore * WEIGHTS.seniority +
        verifiedScore * WEIGHTS.verified;

    return Math.round(composite * 10) / 10;
}

export async function refreshChampionshipLeaderboard(limit = 100) {
    try {
        const season = await ensureActiveSeason();
        const barbers = await prisma.barbers.findMany({
            where: { status: { notIn: ['inactive', 'deleted'] } },
            select: { id: true, city: true },
            take: 500,
        });

        const scores: Array<{ barberId: string; score: number; country: string }> = [];
        for (const b of barbers) {
            const eligible = await isBarberChampionshipEligible(b.id);
            if (!eligible) continue;
            await syncBarberTrustScore(b.id);
            await syncAvailabilityScore(b.id);
            const score = await computeBarberChampionshipScore(b.id);
            scores.push({ barberId: b.id, score, country: 'GR' });
        }

        scores.sort((a, b) => b.score - a.score);
        const top = scores.slice(0, limit);
        const now = new Date().toISOString();

        for (let i = 0; i < top.length; i++) {
            const entry = top[i];
            const rank = i + 1;
            const badges = rank <= 3 ? JSON.stringify([`season_top_${rank}`]) : null;
            await prisma.championship_scores.upsert({
                where: { season_id_barber_id: { season_id: season.id, barber_id: entry.barberId } },
                create: {
                    id: crypto.randomUUID(),
                    season_id: season.id,
                    barber_id: entry.barberId,
                    composite_score: entry.score,
                    rank,
                    country_code: entry.country,
                    badges_json: badges,
                    updated_at: now,
                },
                update: { composite_score: entry.score, rank, badges_json: badges, updated_at: now },
            });
        }

        return { season_id: season.id, updated: top.length };
    } catch (err) {
        if (isFinancialTrustSchemaError(err)) return { season_id: null, updated: 0, schema_pending: true };
        throw err;
    }
}

export async function finalizeSeasonAndHallOfFame(seasonId: string) {
    const top = await prisma.championship_scores.findMany({
        where: { season_id: seasonId, rank: { lte: 10 } },
        orderBy: { rank: 'asc' },
    });

    for (const row of top) {
        await prisma.championship_hall_of_fame.upsert({
            where: { season_id_barber_id: { season_id: seasonId, barber_id: row.barber_id } },
            create: {
                id: crypto.randomUUID(),
                season_id: seasonId,
                barber_id: row.barber_id,
                rank: row.rank ?? 99,
                badge: row.rank && row.rank <= 3 ? `champion_${row.rank}` : 'top_10',
            },
            update: { rank: row.rank ?? 99 },
        });

        if (row.rank && row.rank <= 3) {
            const { appendLedgerEntry } = await import('../ledger/append');
            await appendLedgerEntry({
                entityType: 'barber',
                entityId: row.barber_id,
                eventType: 'championship_reward',
                payload: { season_id: seasonId, rank: row.rank, badge: `champion_${row.rank}` },
                actorId: 'system',
            }).catch(() => {});
        }
    }

    await prisma.championship_seasons.update({
        where: { id: seasonId },
        data: { status: 'completed' },
    });

    return { inducted: top.length };
}

/** Finalize seasons whose end date has passed (for cron). */
export async function finalizeEndedSeasons() {
    const now = new Date().toISOString();
    const ended = await prisma.championship_seasons.findMany({
        where: { status: 'active', ends_at: { lt: now } },
        select: { id: true, name: true },
    });
    const results = [];
    for (const season of ended) {
        const result = await finalizeSeasonAndHallOfFame(season.id);
        results.push({ season_id: season.id, name: season.name, ...result });
    }
    return { finalized: results.length, results };
}

export async function getHallOfFame(barberId?: string) {
    const where = barberId ? { barber_id: barberId } : {};
    return prisma.championship_hall_of_fame.findMany({
        where,
        orderBy: { inducted_at: 'desc' },
        take: 50,
        include: { season: { select: { name: true, season_key: true } }, barber: { select: { name: true, image_url: true } } },
    });
}

export async function getSeasonLeaderboard(seasonId?: string, limit = 20) {
    const season = seasonId
        ? await prisma.championship_seasons.findUnique({ where: { id: seasonId } })
        : await ensureActiveSeason();
    if (!season) return { season: null, leaderboard: [] };

    const leaderboard = await prisma.championship_scores.findMany({
        where: { season_id: season.id },
        orderBy: { rank: 'asc' },
        take: limit,
        include: { barber: { select: { id: true, name: true, image_url: true, city: true, availability_score: true } } },
    });

    return { season, leaderboard };
}
