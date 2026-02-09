import { db } from '../db';
import * as schema from '../db/schema';
import { sql, eq, and, gte, lte } from 'drizzle-orm';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';

export async function getPlatformFinancials() {
    const bookings = await db.select().from(schema.bookings);
    const payoutsList = await db.select().from(schema.payouts);

    const paidBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed'); // In our logic, paid bookings are confirmed

    const totalGross = paidBookings.reduce((sum, b) => sum + (b.price_at_booking || 0), 0);

    // Extract platform fees from financial_breakdown JSON
    let platformRevenue = 0;
    paidBookings.forEach(b => {
        if (b.financial_breakdown) {
            try {
                const breakdown = JSON.parse(b.financial_breakdown);
                platformRevenue += breakdown.platform_fee || 0;
            } catch (e) {
                // Fallback: estimate if JSON is malformed
                platformRevenue += (b.price_at_booking || 0) * 0.15;
            }
        }
    });

    const totalPayouts = payoutsList
        .filter(p => p.status === 'Completed' || p.status === 'Paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

    const pendingPayouts = payoutsList
        .filter(p => p.status === 'Pending')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Weekly Revenue Chart Data
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end });

    const chartData = days.map(day => {
        const dayRevenue = paidBookings
            .filter(b => {
                const bDate = new Date(b.start_time);
                return bDate.getDate() === day.getDate() &&
                    bDate.getMonth() === day.getMonth() &&
                    bDate.getFullYear() === day.getFullYear();
            })
            .reduce((acc, b) => acc + (b.price_at_booking || 0), 0);

        return {
            date: format(day, 'MMM dd'),
            day: format(day, 'EEE'),
            gross: dayRevenue,
            commission: Math.round(dayRevenue * 0.15 * 100) / 100
        };
    });

    // Recent Bookings Enrichment
    const enrichedBookings = await Promise.all(bookings.slice(-10).map(async (b) => {
        const client = b.client_id ? await db.query.users.findFirst({ where: eq(schema.users.id, b.client_id) }) : null;
        const barber = b.barber_id ? await db.query.barbers.findFirst({ where: eq(schema.barbers.id, b.barber_id) }) : null;
        return {
            ...b,
            client_name: client?.full_name || 'Guest',
            barber_name: barber?.name || 'Unknown',
            created_by: client?.email || 'guest@example.com'
        };
    }));

    return {
        overview: {
            totalGross,
            platformRevenue,
            totalPayouts,
            pendingPayouts,
            netMargin: totalGross > 0 ? (platformRevenue / totalGross) * 100 : 0
        },
        chartData,
        bookings: enrichedBookings.reverse(),
        payouts: payoutsList.slice(0, 10),
        disputesCount: bookings.filter(b => b.status === 'cancelled').length // Simplified
    };
}
