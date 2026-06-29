import { prisma } from '../db/prisma';
import { subDays } from 'date-fns';

/** SQUIRE-style peer cohort: similar chair count + optional city match. */

export const SHOP_SIZE_BANDS = [
    { key: 'solo', label: 'Solo (1 chair)', min: 1, max: 1 },
    { key: 'small', label: 'Small shop (2-4 chairs)', min: 2, max: 4 },
    { key: 'medium', label: 'Mid-size (5-8 chairs)', min: 5, max: 8 },
    { key: 'large', label: 'Large (9+ chairs)', min: 9, max: Infinity },
] as const;

export const PROVIDER_BENCHMARKS = {
    no_show_rate_pct: { good: 5, great: 2 },
    rebooking_rate_pct: { good: 35, great: 55 },
    cancellation_rate_pct: { good: 8, great: 4 },
    avg_booking_value_eur: { good: 35, great: 55 },
    rating: { good: 4.2, great: 4.7 },
} as const;

function normalizeStatus(status: string | null | undefined): string {
    return (status ?? '').toLowerCase().replace(/\s+/g, '_');
}

function extractCity(location: string | null | undefined): string | null {
    if (!location?.trim()) return null;
    const parts = location.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return null;
    return parts[parts.length - 1]?.toLowerCase() ?? null;
}

function sizeBandForChairs(chairs: number): (typeof SHOP_SIZE_BANDS)[number] {
    for (const band of SHOP_SIZE_BANDS) {
        if (chairs >= band.min && chairs <= band.max) return band;
    }
    return SHOP_SIZE_BANDS[SHOP_SIZE_BANDS.length - 1]!;
}

function percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
    return sorted[idx] ?? 0;
}

function median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] ?? 0;
}

type ShopMetrics = {
    shop_id: string;
    shop_name: string;
    city: string | null;
    chair_count: number;
    size_band: string;
    completed_bookings: number;
    no_show_rate_percent: number;
    cancellation_rate_percent: number;
    rebooking_rate_percent: number;
    avg_booking_value: number;
    revenue_30d_eur: number;
    revenue_per_chair_30d_eur: number;
    rating: number;
};

function computeShopMetricsFromBookings(
    shop: { id: string; name: string; location: string | null; rating: number | null },
    chairCount: number,
    bookings: Array<{
        status: string | null;
        price_at_booking: number | null;
        client_id: string | null;
        created_at: string | null;
    }>
): ShopMetrics {
    const completed = bookings.filter((b) => normalizeStatus(b.status) === 'completed');
    const cancelled = bookings.filter((b) => normalizeStatus(b.status) === 'cancelled');
    const noShows = bookings.filter((b) => normalizeStatus(b.status) === 'no_show');
    const resolved = completed.length + cancelled.length + noShows.length;

    const since30 = subDays(new Date(), 30).toISOString();
    const recentCompleted = completed.filter((b) => (b.created_at ?? '') >= since30);
    const revenue30 = recentCompleted.reduce((s, b) => s + (b.price_at_booking ?? 0), 0);

    const clientCounts = new Map<string, number>();
    for (const b of completed) {
        if (!b.client_id) continue;
        clientCounts.set(b.client_id, (clientCounts.get(b.client_id) ?? 0) + 1);
    }
    const uniqueClients = clientCounts.size;
    const repeatClients = [...clientCounts.values()].filter((c) => c > 1).length;

    const band = sizeBandForChairs(chairCount);

    return {
        shop_id: shop.id,
        shop_name: shop.name,
        city: extractCity(shop.location),
        chair_count: chairCount,
        size_band: band.key,
        completed_bookings: completed.length,
        no_show_rate_percent:
            resolved > 0 ? Math.round((noShows.length / resolved) * 1000) / 10 : 0,
        cancellation_rate_percent:
            resolved > 0 ? Math.round((cancelled.length / resolved) * 1000) / 10 : 0,
        rebooking_rate_percent:
            uniqueClients > 0 ? Math.round((repeatClients / uniqueClients) * 1000) / 10 : 0,
        avg_booking_value:
            completed.length > 0
                ? Math.round(
                      (completed.reduce((s, b) => s + (b.price_at_booking ?? 0), 0) /
                          completed.length) *
                          100
                  ) / 100
                : 0,
        revenue_30d_eur: Math.round(revenue30 * 100) / 100,
        revenue_per_chair_30d_eur:
            chairCount > 0 ? Math.round((revenue30 / chairCount) * 100) / 100 : 0,
        rating: shop.rating ?? 0,
    };
}

export type BenchmarkComparison = {
    metric: string;
    label: string;
    yours: number;
    cohort_median: number;
    cohort_p75: number;
    cohort_size: number;
    unit: 'percent' | 'eur' | 'score';
    tier: 'great' | 'good' | 'below';
    lower_is_better: boolean;
};

function compareMetric(
    metric: string,
    label: string,
    yours: number,
    peerValues: number[],
    unit: 'percent' | 'eur' | 'score',
    lowerIsBetter: boolean,
    good: number,
    great: number
): BenchmarkComparison {
    const sorted = [...peerValues].sort((a, b) => a - b);
    const med = Math.round(median(sorted) * 100) / 100;
    const p75 = Math.round(percentile(sorted, 0.75) * 100) / 100;

    let tier: 'great' | 'good' | 'below' = 'below';
    if (lowerIsBetter) {
        if (yours <= great) tier = 'great';
        else if (yours <= good) tier = 'good';
    } else {
        if (yours >= great) tier = 'great';
        else if (yours >= good) tier = 'good';
    }

    return {
        metric,
        label,
        yours: Math.round(yours * 100) / 100,
        cohort_median: med,
        cohort_p75: p75,
        cohort_size: peerValues.length,
        unit,
        tier,
        lower_is_better: lowerIsBetter,
    };
}

export async function getShopBenchmarkDashboard(shopId: string) {
    const shop = await prisma.shops.findUnique({
        where: { id: shopId },
        select: { id: true, name: true, location: true, rating: true },
    });
    if (!shop) throw new Error('Shop not found');

    const allShops = await prisma.shops.findMany({
        select: { id: true, name: true, location: true, rating: true },
    });

    const barbersByShop = await prisma.barbers.groupBy({
        by: ['shop_id'],
        where: { shop_id: { not: null }, status: { notIn: ['inactive', 'deleted'] } },
        _count: { id: true },
    });
    const chairMap = new Map(barbersByShop.map((b) => [b.shop_id!, b._count.id]));

    const allBookings = await prisma.bookings.findMany({
        where: { shop_id: { not: null } },
        select: {
            shop_id: true,
            status: true,
            price_at_booking: true,
            client_id: true,
            created_at: true,
        },
    });

    const bookingsByShop = new Map<string, typeof allBookings>();
    for (const s of allShops) bookingsByShop.set(s.id, []);
    for (const b of allBookings) {
        if (b.shop_id) bookingsByShop.get(b.shop_id)?.push(b);
    }

    const allMetrics = allShops.map((s) => {
        const chairs = Math.max(1, chairMap.get(s.id) ?? 1);
        return computeShopMetricsFromBookings(s, chairs, bookingsByShop.get(s.id) ?? []);
    });

    const yours = allMetrics.find((m) => m.shop_id === shopId);
    if (!yours) throw new Error('Shop metrics unavailable');

    const band = sizeBandForChairs(yours.chair_count);
    const shopCity = yours.city;

    let peers = allMetrics.filter(
        (m) => m.shop_id !== shopId && m.size_band === band.key && m.completed_bookings >= 3
    );

    if (shopCity) {
        const cityPeers = peers.filter((m) => m.city === shopCity);
        if (cityPeers.length >= 3) peers = cityPeers;
    }

    if (peers.length < 3) {
        peers = allMetrics.filter(
            (m) => m.shop_id !== shopId && m.size_band === band.key
        );
    }

    const comparisons: BenchmarkComparison[] = [
        compareMetric(
            'no_show_rate',
            'No-show rate',
            yours.no_show_rate_percent,
            peers.map((p) => p.no_show_rate_percent),
            'percent',
            true,
            PROVIDER_BENCHMARKS.no_show_rate_pct.good,
            PROVIDER_BENCHMARKS.no_show_rate_pct.great
        ),
        compareMetric(
            'rebooking_rate',
            'Client rebooking rate',
            yours.rebooking_rate_percent,
            peers.map((p) => p.rebooking_rate_percent),
            'percent',
            false,
            PROVIDER_BENCHMARKS.rebooking_rate_pct.good,
            PROVIDER_BENCHMARKS.rebooking_rate_pct.great
        ),
        compareMetric(
            'cancellation_rate',
            'Cancellation rate',
            yours.cancellation_rate_percent,
            peers.map((p) => p.cancellation_rate_percent),
            'percent',
            true,
            PROVIDER_BENCHMARKS.cancellation_rate_pct.good,
            PROVIDER_BENCHMARKS.cancellation_rate_pct.great
        ),
        compareMetric(
            'avg_booking_value',
            'Average ticket',
            yours.avg_booking_value,
            peers.map((p) => p.avg_booking_value),
            'eur',
            false,
            PROVIDER_BENCHMARKS.avg_booking_value_eur.good,
            PROVIDER_BENCHMARKS.avg_booking_value_eur.great
        ),
        compareMetric(
            'revenue_per_chair_30d',
            'Revenue per chair (30d)',
            yours.revenue_per_chair_30d_eur,
            peers.map((p) => p.revenue_per_chair_30d_eur),
            'eur',
            false,
            800,
            1500
        ),
        compareMetric(
            'rating',
            'Average rating',
            yours.rating,
            peers.filter((p) => p.rating > 0).map((p) => p.rating),
            'score',
            false,
            PROVIDER_BENCHMARKS.rating.good,
            PROVIDER_BENCHMARKS.rating.great
        ),
    ];

    const monthlyRevenue = await prisma.bookings.findMany({
        where: {
            shop_id: shopId,
            status: 'completed',
            created_at: { gte: subDays(new Date(), 180).toISOString() },
        },
        select: { price_at_booking: true, created_at: true },
    });

    const revenueByMonth = new Map<string, { revenue: number; bookings: number }>();
    for (const b of monthlyRevenue) {
        if (!b.created_at) continue;
        const d = new Date(b.created_at);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        const bucket = revenueByMonth.get(key) ?? { revenue: 0, bookings: 0 };
        bucket.revenue += b.price_at_booking ?? 0;
        bucket.bookings += 1;
        revenueByMonth.set(key, bucket);
    }

    const revenueTrend = [...revenueByMonth.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, v]) => ({
            month,
            revenue_eur: Math.round(v.revenue * 100) / 100,
            bookings: v.bookings,
        }));

    const serviceBreakdown = await prisma.bookings.groupBy({
        by: ['service_name'],
        where: { shop_id: shopId, status: 'completed' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 8,
    });

    return {
        generated_at: new Date().toISOString(),
        shop: {
            id: shop.id,
            name: shop.name,
            city: shopCity,
            chair_count: yours.chair_count,
            size_band: band.key,
            size_band_label: band.label,
        },
        cohort: {
            label: shopCity
                ? `${band.label}, ${shopCity}`
                : `${band.label} (platform-wide)`,
            peer_count: peers.length,
            min_completed_bookings_for_peer: 3,
        },
        you: yours,
        comparisons,
        benchmarks: PROVIDER_BENCHMARKS,
        revenue_trend: revenueTrend,
        service_mix: serviceBreakdown.map((s) => ({
            name: s.service_name || 'Other',
            count: s._count.id,
        })),
    };
}

export async function getBarberBenchmarkDashboard(barberId: string) {
    const barber = await prisma.barbers.findUnique({
        where: { id: barberId },
        select: { id: true, shop_id: true, name: true, city: true, location: true, rating: true },
    });
    if (!barber) throw new Error('Barber not found');
    if (barber.shop_id) {
        return getShopBenchmarkDashboard(barber.shop_id);
    }

    const soloBarbers = await prisma.barbers.findMany({
        where: { shop_id: null, status: { notIn: ['inactive', 'deleted'] } },
        select: { id: true, name: true, city: true, location: true, rating: true },
    });

    const soloBookings = await prisma.bookings.findMany({
        where: { barber_id: { in: soloBarbers.map((b) => b.id) } },
        select: {
            barber_id: true,
            status: true,
            price_at_booking: true,
            client_id: true,
            created_at: true,
        },
    });

    const byBarber = new Map<string, typeof soloBookings>();
    for (const b of soloBarbers) byBarber.set(b.id, []);
    for (const bk of soloBookings) byBarber.get(bk.barber_id)?.push(bk);

    const soloMetrics = soloBarbers.map((b) =>
        computeShopMetricsFromBookings(
            {
                id: b.id,
                name: b.name,
                location: b.city ?? b.location,
                rating: b.rating,
            },
            1,
            byBarber.get(b.id) ?? []
        )
    );

    const yours = soloMetrics.find((m) => m.shop_id === barberId);
    if (!yours) throw new Error('Barber metrics unavailable');

    const city = extractCity(barber.city ?? barber.location);
    let peers = soloMetrics.filter(
        (m) => m.shop_id !== barberId && m.completed_bookings >= 3
    );
    if (city) {
        const cityPeers = peers.filter((m) => m.city === city);
        if (cityPeers.length >= 3) peers = cityPeers;
    }

    const band = sizeBandForChairs(1);
    const comparisons: BenchmarkComparison[] = [
        compareMetric(
            'no_show_rate',
            'No-show rate',
            yours.no_show_rate_percent,
            peers.map((p) => p.no_show_rate_percent),
            'percent',
            true,
            PROVIDER_BENCHMARKS.no_show_rate_pct.good,
            PROVIDER_BENCHMARKS.no_show_rate_pct.great
        ),
        compareMetric(
            'rebooking_rate',
            'Client rebooking rate',
            yours.rebooking_rate_percent,
            peers.map((p) => p.rebooking_rate_percent),
            'percent',
            false,
            PROVIDER_BENCHMARKS.rebooking_rate_pct.good,
            PROVIDER_BENCHMARKS.rebooking_rate_pct.great
        ),
        compareMetric(
            'avg_booking_value',
            'Average ticket',
            yours.avg_booking_value,
            peers.map((p) => p.avg_booking_value),
            'eur',
            false,
            PROVIDER_BENCHMARKS.avg_booking_value_eur.good,
            PROVIDER_BENCHMARKS.avg_booking_value_eur.great
        ),
    ];

    return {
        generated_at: new Date().toISOString(),
        shop: {
            id: barber.id,
            name: barber.name,
            city,
            chair_count: 1,
            size_band: band.key,
            size_band_label: 'Solo barber',
        },
        cohort: {
            label: city ? `Solo barbers, ${city}` : 'Solo barbers (platform-wide)',
            peer_count: peers.length,
            min_completed_bookings_for_peer: 3,
        },
        you: { ...yours, shop_id: barber.id, shop_name: barber.name },
        comparisons,
        benchmarks: PROVIDER_BENCHMARKS,
        revenue_trend: [],
        service_mix: [],
    };
}
