import { db } from '../db';
import * as schema from '../db/schema';
import { sql, eq, and, gte, lte } from 'drizzle-orm';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, startOfWeek, endOfWeek, subDays, isSameDay } from 'date-fns';

export async function getProviderAnalytics(shopId: string, barberId?: string) {
    // 1. Fetch all relevant bookings
    const bookings = await db.select().from(schema.bookings).where(
        shopId ? eq(schema.bookings.shop_id, shopId) : eq(schema.bookings.barber_id, barberId!)
    );

    const now = new Date();
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
    const upcomingBookings = confirmedBookings.filter(b => new Date(b.start_time) >= now);
    const pastBookings = confirmedBookings.filter(b => new Date(b.start_time) < now);

    // 2. Financial KPIs
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.price_at_booking || 0), 0);
    const revenueForecast = upcomingBookings.reduce((sum, b) => sum + (b.price_at_booking || 0), 0);

    // 3. Client Retention (MOCK logic based on email frequency in history)
    const clientEmails = confirmedBookings.map(b => b.created_by).filter(Boolean);
    const emailCounts: Record<string, number> = {};
    clientEmails.forEach(email => emailCounts[email!] = (emailCounts[email!] || 0) + 1);

    const recurringClients = Object.values(emailCounts).filter(count => count > 1).length;
    const totalClients = Object.keys(emailCounts).length;
    const retentionRate = totalClients > 0 ? (recurringClients / totalClients) * 100 : 0;

    // 4. Staff Performance (if shopId)
    let staffPerformance = [];
    if (shopId) {
        const staffMap: Record<string, { bookings: number, revenue: number, name: string }> = {};

        for (const b of confirmedBookings) {
            const bid = b.barber_id;
            if (!bid) continue;
            if (!staffMap[bid]) {
                const barber = await db.query.barbers.findFirst({ where: eq(schema.barbers.id, bid) });
                staffMap[bid] = { bookings: 0, revenue: 0, name: barber?.name || 'Unknown' };
            }
            staffMap[bid].bookings++;
            staffMap[bid].revenue += (b.price_at_booking || 0);
        }
        staffPerformance = Object.entries(staffMap).map(([id, data]) => ({ id, ...data }));
    }

    // 5. Daily Revenue (Last 7 Days)
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(now, i)).reverse();
    const revenueChart = last7Days.map(day => {
        const dayRevenue = confirmedBookings
            .filter(b => isSameDay(new Date(b.start_time), day))
            .reduce((acc, b) => acc + (b.price_at_booking || 0), 0);

        return {
            date: format(day, 'MMM dd'),
            revenue: dayRevenue
        };
    });

    return {
        summary: {
            totalRevenue,
            revenueForecast,
            retentionRate,
            totalAppointments: confirmedBookings.length,
            upcomingAppointments: upcomingBookings.length
        },
        revenueChart,
        staffPerformance,
        utilizationRate: 78 // Mocked for now, needs schedule comparison
    };
}
