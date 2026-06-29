import { prisma } from '../db/prisma';
import { startOfMonth, format, subDays, isSameDay } from 'date-fns';

export async function getProviderAnalytics(shopId: string, barberId?: string) {
    // 1. Fetch all relevant bookings
    const bookings = await prisma.bookings.findMany({
        where: shopId ? { shop_id: shopId } : { barber_id: barberId! }
    });

    const now = new Date();
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
    const upcomingBookings = confirmedBookings.filter(b => new Date(b.start_time) >= now);
    const _pastBookings = confirmedBookings.filter(b => new Date(b.start_time) < now);

    // 2. Financial KPIs
    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.price_at_booking || 0), 0);
    const revenueForecast = upcomingBookings.reduce((sum, b) => sum + (b.price_at_booking || 0), 0);

    // 3. Client retention, repeat bookings by client_id
    const clientCounts: Record<string, number> = {};
    for (const b of confirmedBookings) {
        const clientId = b.client_id;
        if (!clientId) continue;
        clientCounts[clientId] = (clientCounts[clientId] || 0) + 1;
    }

    const recurringClients = Object.values(clientCounts).filter((count) => count > 1).length;
    const totalClients = Object.keys(clientCounts).length;
    const retentionRate = totalClients > 0 ? (recurringClients / totalClients) * 100 : 0;

    // 4. Staff Performance (if shopId)
    let staffPerformance = [];
    if (shopId) {
        const staffMap: Record<string, { bookings: number, revenue: number, name: string }> = {};

        for (const b of confirmedBookings) {
            const bid = b.barber_id;
            if (!bid) continue;
            if (!staffMap[bid]) {
                const barber = await prisma.barbers.findUnique({ where: { id: bid } });
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

    // 6. Tips received (post-service pourboires)
    const tipWhere = shopId
        ? { shop_id: shopId, status: 'paid' as const }
        : barberId
          ? { barber_id: barberId, status: 'paid' as const }
          : null;
    let totalTips = 0;
    let tipsThisMonth = 0;
    if (tipWhere) {
        const paidTips = await prisma.booking_tips.findMany({ where: tipWhere });
        totalTips = paidTips.reduce((sum, t) => sum + t.amount, 0);
        const monthStart = startOfMonth(now);
        tipsThisMonth = paidTips
            .filter((t) => t.paid_at && new Date(t.paid_at) >= monthStart)
            .reduce((sum, t) => sum + t.amount, 0);
    }

    return {
        summary: {
            totalRevenue,
            revenueForecast,
            retentionRate,
            totalAppointments: confirmedBookings.length,
            upcomingAppointments: upcomingBookings.length,
            totalTips: Math.round(totalTips * 100) / 100,
            tipsThisMonth: Math.round(tipsThisMonth * 100) / 100,
        },
        revenueChart,
        staffPerformance,
        utilizationRate: 78 // Mocked for now, needs schedule comparison
    };
}
