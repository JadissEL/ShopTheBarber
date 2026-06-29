import { prisma } from '../../db/prisma';
import { isFinancialTrustSchemaError } from '../schemaGuard';

/** Public availability score 0–100 for barber profiles */
export async function computeAvailabilityScore(barberId: string): Promise<number> {
    const bookings = await prisma.bookings.findMany({
        where: { barber_id: barberId, status: { notIn: ['cancelled'] } },
        select: { status: true, start_time: true, created_at: true },
        take: 200,
        orderBy: { start_time: 'desc' },
    });

    if (bookings.length === 0) return 75;

    const cancelledByBarber = await prisma.bookings.count({
        where: { barber_id: barberId, status: 'cancelled', cancelled_by: 'barber' },
    }).catch(() => 0);

    const total = bookings.length;
    const noShows = bookings.filter((b) => b.status === 'no_show').length;
    const completed = bookings.filter((b) => b.status === 'completed').length;

    const cancelRate = cancelledByBarber / Math.max(1, total);
    const noShowRate = noShows / total;
    const completionRate = completed / total;

    let score = 70 + completionRate * 25 - cancelRate * 30 - noShowRate * 20;
    return Math.max(0, Math.min(100, Math.round(score)));
}

export async function syncAvailabilityScore(barberId: string) {
    try {
        const score = await computeAvailabilityScore(barberId);
        await prisma.barbers.update({
            where: { id: barberId },
            data: { availability_score: score, trust_score_updated_at: new Date().toISOString() },
        });
        return score;
    } catch (err) {
        if (isFinancialTrustSchemaError(err)) return null;
        throw err;
    }
}

export function availabilityLabel(score: number): string {
    if (score >= 90) return 'Excellent availability';
    if (score >= 75) return 'Reliable schedule';
    if (score >= 60) return 'Good availability';
    return 'Limited availability';
}
