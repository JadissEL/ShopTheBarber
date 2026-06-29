import { prisma } from '../db/prisma';
import { format, eachDayOfInterval, startOfWeek, endOfWeek, subDays } from 'date-fns';
import { getNorthStarMetrics } from './northStarMetrics';

function parseBreakdown(raw: string | null | undefined): Record<string, unknown> | null {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function isPaidBooking(b: { payment_status: string | null; status: string | null }): boolean {
    const ps = (b.payment_status ?? '').toLowerCase();
    const st = (b.status ?? '').toLowerCase();
    return ps === 'paid' || st === 'completed' || st === 'confirmed';
}

export type PlatformFinancialsOptions = {
    days?: number;
};

export async function getPlatformFinancials(options: PlatformFinancialsOptions = {}) {
    const periodDays = Math.min(365, Math.max(1, options.days ?? 30));
    const since = subDays(new Date(), periodDays).toISOString();

    const [bookings, payoutsList, northStar] = await Promise.all([
        prisma.bookings.findMany({
            where: { created_at: { gte: since } },
            select: {
                id: true,
                client_id: true,
                barber_id: true,
                status: true,
                payment_status: true,
                price_at_booking: true,
                financial_breakdown: true,
                platform_fee_amount: true,
                start_time: true,
                created_at: true,
            },
            orderBy: { created_at: 'desc' },
        }),
        prisma.payouts.findMany({
            where: { created_at: { gte: since } },
        }),
        getNorthStarMetrics({ days: periodDays }),
    ]);

    const paidBookings = bookings.filter(isPaidBooking);

    const totalGross = paidBookings.reduce((sum, b) => sum + (b.price_at_booking || 0), 0);

    let platformRevenue = 0;
    for (const b of paidBookings) {
        if (typeof b.platform_fee_amount === 'number') {
            platformRevenue += b.platform_fee_amount;
            continue;
        }
        if (b.financial_breakdown) {
            const breakdown = parseBreakdown(b.financial_breakdown);
            if (typeof breakdown?.platform_fee === 'number') {
                platformRevenue += breakdown.platform_fee;
                continue;
            }
        }
        platformRevenue += (b.price_at_booking || 0) * 0.15;
    }

    const totalPayouts = payoutsList
        .filter((p) => p.status === 'Completed' || p.status === 'Paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingPayouts = payoutsList
        .filter((p) => p.status === 'Pending')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    const chartData = days.map((day) => {
        const dayRevenue = paidBookings
            .filter((b) => {
                const bDate = new Date(b.start_time);
                return (
                    bDate.getDate() === day.getDate() &&
                    bDate.getMonth() === day.getMonth() &&
                    bDate.getFullYear() === day.getFullYear()
                );
            })
            .reduce((acc, b) => acc + (b.price_at_booking || 0), 0);

        return {
            date: format(day, 'MMM dd'),
            day: format(day, 'EEE'),
            gross: Math.round(dayRevenue * 100) / 100,
            commission: Math.round(dayRevenue * 0.15 * 100) / 100,
        };
    });

    const recentIds = bookings.slice(0, 10);
    const clientIds = [...new Set(recentIds.map((b) => b.client_id).filter(Boolean))] as string[];
    const barberIds = [...new Set(recentIds.map((b) => b.barber_id).filter(Boolean))];

    const [clients, barbers] = await Promise.all([
        clientIds.length
            ? prisma.users.findMany({
                  where: { id: { in: clientIds } },
                  select: { id: true, full_name: true, email: true },
              })
            : Promise.resolve([]),
        barberIds.length
            ? prisma.barbers.findMany({
                  where: { id: { in: barberIds } },
                  select: { id: true, name: true },
              })
            : Promise.resolve([]),
    ]);

    const clientMap = new Map(clients.map((c) => [c.id, c]));
    const barberMap = new Map(barbers.map((b) => [b.id, b]));

    const enrichedBookings = recentIds.map((b) => {
        const client = b.client_id ? clientMap.get(b.client_id) : null;
        const barber = barberMap.get(b.barber_id);
        return {
            ...b,
            client_name: client?.full_name || 'Guest',
            barber_name: barber?.name || 'Unknown',
            created_by: client?.email || 'guest@example.com',
        };
    });

    const cancelledCount = bookings.filter((b) => (b.status ?? '').toLowerCase() === 'cancelled').length;

    return {
        period_days: periodDays,
        north_star: northStar,
        overview: {
            totalGross: Math.round(totalGross * 100) / 100,
            platformRevenue: Math.round(platformRevenue * 100) / 100,
            totalPayouts: Math.round(totalPayouts * 100) / 100,
            pendingPayouts: Math.round(pendingPayouts * 100) / 100,
            netMargin: totalGross > 0 ? Math.round((platformRevenue / totalGross) * 1000) / 10 : 0,
            paid_bookings_count: paidBookings.length,
            booked_gmv_eur: northStar.booked_gmv_eur,
        },
        chartData,
        bookings: enrichedBookings,
        payouts: payoutsList.slice(0, 10),
        disputesCount: cancelledCount,
    };
}
