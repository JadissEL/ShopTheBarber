import { prisma } from '../db/prisma';
import { getCohortRetentionMetrics } from '../productAnalytics/metrics';

function daysAgoIso(days: number): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    return d.toISOString();
}

function parseDate(iso: string | null | undefined): Date | null {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
}

function isPaidBooking(b: { payment_status: string | null; status: string | null }): boolean {
    const ps = (b.payment_status ?? '').toLowerCase();
    const st = (b.status ?? '').toLowerCase();
    return ps === 'paid' || st === 'completed' || st === 'confirmed';
}

function normalizeStatus(status: string | null | undefined): string {
    return (status ?? '').toLowerCase().replace(/\s+/g, '_');
}

export type NorthStarMetricsOptions = {
    days?: number;
};

export type NorthStarMetrics = {
    period_days: number;
    booked_gmv_eur: number;
    booked_count: number;
    no_show_rate_percent: number;
    no_show_count: number;
    resolved_bookings_count: number;
    provider_activation_rate_percent: number;
    providers_total: number;
    providers_fully_activated: number;
    provider_activation_breakdown: {
        profile_complete: number;
        has_services: number;
        stripe_active: number;
    };
    d7_retention_percent: number;
    d7_retention_cohort_size: number;
    trends: {
        booked_gmv_prior_period_eur: number;
        booked_gmv_change_pct: number | null;
        no_show_rate_prior_period_percent: number;
        no_show_rate_change_pts: number | null;
    };
};

function hasBarberProfile(b: {
    name: string;
    bio: string | null;
    image_url: string | null;
}): boolean {
    return Boolean(b.name?.trim() && (b.bio?.trim() || b.image_url?.trim()));
}

function hasShopProfile(s: {
    name: string;
    description: string | null;
    image_url: string | null;
}): boolean {
    return Boolean(s.name?.trim() && (s.description?.trim() || s.image_url?.trim()));
}

async function computeProviderActivation() {
    const [barbers, shops, services, users] = await Promise.all([
        prisma.barbers.findMany({
            where: { status: { notIn: ['inactive', 'deleted'] } },
            select: { id: true, user_id: true, name: true, bio: true, image_url: true },
        }),
        prisma.shops.findMany({
            where: { owner_id: { not: null } },
            select: { id: true, owner_id: true, name: true, description: true, image_url: true },
        }),
        prisma.services.findMany({
            select: { barber_id: true, shop_id: true },
        }),
        prisma.users.findMany({
            select: { id: true, stripe_connect_status: true },
        }),
    ]);

    const stripeByUser = new Map(users.map((u) => [u.id, (u.stripe_connect_status ?? '') === 'active']));
    const servicesByBarber = new Map<string, number>();
    const servicesByShop = new Map<string, number>();
    for (const svc of services) {
        if (svc.barber_id) {
            servicesByBarber.set(svc.barber_id, (servicesByBarber.get(svc.barber_id) ?? 0) + 1);
        }
        if (svc.shop_id) {
            servicesByShop.set(svc.shop_id, (servicesByShop.get(svc.shop_id) ?? 0) + 1);
        }
    }

    let profileComplete = 0;
    let hasServices = 0;
    let stripeActive = 0;
    let fullyActivated = 0;
    let total = 0;

    for (const b of barbers) {
        total += 1;
        const profile = hasBarberProfile(b);
        const svc = (servicesByBarber.get(b.id) ?? 0) > 0;
        const stripe = b.user_id ? stripeByUser.get(b.user_id) === true : false;
        if (profile) profileComplete += 1;
        if (svc) hasServices += 1;
        if (stripe) stripeActive += 1;
        if (profile && svc && stripe) fullyActivated += 1;
    }

    for (const s of shops) {
        total += 1;
        const profile = hasShopProfile(s);
        const svc = (servicesByShop.get(s.id) ?? 0) > 0;
        const stripe = s.owner_id ? stripeByUser.get(s.owner_id) === true : false;
        if (profile) profileComplete += 1;
        if (svc) hasServices += 1;
        if (stripe) stripeActive += 1;
        if (profile && svc && stripe) fullyActivated += 1;
    }

    return {
        providers_total: total,
        providers_fully_activated: fullyActivated,
        provider_activation_rate_percent:
            total === 0 ? 0 : Math.round((fullyActivated / total) * 1000) / 10,
        provider_activation_breakdown: {
            profile_complete: profileComplete,
            has_services: hasServices,
            stripe_active: stripeActive,
        },
    };
}

function computeNoShowRate(
    bookings: Array<{ status: string | null }>
): { rate: number; noShows: number; resolved: number } {
    const completed = bookings.filter((b) => normalizeStatus(b.status) === 'completed');
    const cancelled = bookings.filter((b) => normalizeStatus(b.status) === 'cancelled');
    const noShows = bookings.filter((b) => normalizeStatus(b.status) === 'no_show');
    const resolved = completed.length + cancelled.length + noShows.length;
    const rate = resolved > 0 ? Math.round((noShows.length / resolved) * 1000) / 10 : 0;
    return { rate, noShows: noShows.length, resolved };
}

async function computeD7Retention(): Promise<{ pct: number; cohortSize: number }> {
    const lookbackDays = 90;
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - lookbackDays);
    const matureCutoff = new Date();
    matureCutoff.setUTCDate(matureCutoff.getUTCDate() - 7);

    const [users, bookings] = await Promise.all([
        prisma.users.findMany({
            where: { created_at: { gte: since.toISOString() } },
            select: { id: true, created_at: true, role: true },
        }),
        prisma.bookings.findMany({
            where: { client_id: { not: null } },
            select: {
                client_id: true,
                created_at: true,
                payment_status: true,
                status: true,
            },
        }),
    ]);

    const clients = users.filter((u) => (u.role ?? 'client') === 'client' || u.role === null);
    const paidByClient = new Map<string, Date[]>();
    for (const b of bookings) {
        if (!b.client_id || !isPaidBooking(b)) continue;
        const dt = parseDate(b.created_at);
        if (!dt) continue;
        const list = paidByClient.get(b.client_id) ?? [];
        list.push(dt);
        paidByClient.set(b.client_id, list);
    }

    let cohortSize = 0;
    let retained = 0;

    for (const u of clients) {
        const signup = parseDate(u.created_at);
        if (!signup || signup > matureCutoff) continue;
        cohortSize += 1;
        const d7Start = new Date(signup);
        d7Start.setUTCDate(d7Start.getUTCDate() + 1);
        const d7End = new Date(signup);
        d7End.setUTCDate(d7End.getUTCDate() + 7);
        d7End.setUTCHours(23, 59, 59, 999);

        const acts = paidByClient.get(u.id) ?? [];
        const hit = acts.some((d) => d >= d7Start && d <= d7End);
        if (hit) retained += 1;
    }

    return {
        pct: cohortSize === 0 ? 0 : Math.round((retained / cohortSize) * 1000) / 10,
        cohortSize,
    };
}

export async function getNorthStarMetrics(options: NorthStarMetricsOptions = {}): Promise<NorthStarMetrics> {
    const periodDays = Math.min(365, Math.max(1, options.days ?? 30));
    const since = daysAgoIso(periodDays);
    const priorSince = daysAgoIso(periodDays * 2);

    const [periodBookings, priorBookings, activation, d7] = await Promise.all([
        prisma.bookings.findMany({
            where: {
                created_at: { gte: since },
                status: { notIn: ['cancelled'] },
            },
            select: { price_at_booking: true, status: true },
        }),
        prisma.bookings.findMany({
            where: {
                created_at: { gte: priorSince, lt: since },
                status: { in: ['completed', 'cancelled', 'no_show'] },
            },
            select: { status: true },
        }),
        computeProviderActivation(),
        computeD7Retention(),
    ]);

    const bookedGmv = periodBookings.reduce((s, b) => s + (b.price_at_booking ?? 0), 0);
    const priorPeriodBookings = await prisma.bookings.findMany({
        where: {
            created_at: { gte: priorSince, lt: since },
            status: { notIn: ['cancelled'] },
        },
        select: { price_at_booking: true },
    });
    const priorGmv = priorPeriodBookings.reduce((s, b) => s + (b.price_at_booking ?? 0), 0);

    const resolvedInPeriod = periodBookings.filter((b) =>
        ['completed', 'cancelled', 'no_show'].includes(normalizeStatus(b.status))
    );
    const noShow = computeNoShowRate(resolvedInPeriod);
    const priorNoShow = computeNoShowRate(priorBookings);

    const gmvChange =
        priorGmv === 0 ? null : Math.round(((bookedGmv - priorGmv) / priorGmv) * 1000) / 10;
    const noShowChange =
        priorNoShow.resolved === 0
            ? null
            : Math.round((noShow.rate - priorNoShow.rate) * 10) / 10;

    return {
        period_days: periodDays,
        booked_gmv_eur: Math.round(bookedGmv * 100) / 100,
        booked_count: periodBookings.length,
        no_show_rate_percent: noShow.rate,
        no_show_count: noShow.noShows,
        resolved_bookings_count: noShow.resolved,
        provider_activation_rate_percent: activation.provider_activation_rate_percent,
        providers_total: activation.providers_total,
        providers_fully_activated: activation.providers_fully_activated,
        provider_activation_breakdown: activation.provider_activation_breakdown,
        d7_retention_percent: d7.pct,
        d7_retention_cohort_size: d7.cohortSize,
        trends: {
            booked_gmv_prior_period_eur: Math.round(priorGmv * 100) / 100,
            booked_gmv_change_pct: gmvChange,
            no_show_rate_prior_period_percent: priorNoShow.rate,
            no_show_rate_change_pts: noShowChange,
        },
    };
}

/** Admin dashboard bundle: north stars + signup D7 curve from product analytics. */
export async function getNorthStarDashboard(days = 30) {
    const [northStar, cohorts] = await Promise.all([
        getNorthStarMetrics({ days }),
        getCohortRetentionMetrics(6),
    ]);

    const d7FromCurve =
        cohorts.signup_retention_curve?.find((p) => p.week === 1)?.avg_retention_pct ?? null;

    return {
        ...northStar,
        signup_week1_retention_curve_pct: d7FromCurve,
        cohorts_summary: {
            latest_cohort: cohorts.vintage_comparison?.latest_cohort ?? null,
            latest_m1_retention_pct: cohorts.vintage_comparison?.latest_m1_retention_pct ?? null,
        },
    };
}

export { hasBarberProfile, hasShopProfile };
