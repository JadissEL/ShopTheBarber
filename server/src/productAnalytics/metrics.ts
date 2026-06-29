import { prisma } from '../db/prisma';
import {
    ANALYTICS_EVENTS,
    ANALYTICS_BENCHMARKS,
    COHORT_RETENTION_MONTHS,
    COHORT_RETENTION_WEEKS,
    DEFAULT_ANALYTICS_DAYS,
    FUNNEL_CONVERSION_WINDOW_HOURS,
    LTV_BUCKETS,
} from './config';
import { getNorthStarMetrics } from '../admin/northStarMetrics';
import {
    buildFunnelStepRows,
    computeDailyFunnelTrend,
    computeLooseFunnelCounts,
    computeStepMedianHours,
    computeStrictFunnelCounts,
    computeTimeWindowedStrictFunnelCounts,
    type FunnelEventRow,
} from './funnelLogic';

function parseDate(iso: string | null | undefined): Date | null {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
}

function daysAgoIso(days: number): string {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - days);
    return d.toISOString();
}

function monthKey(d: Date): string {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthsBackRange(monthsBack: number): string[] {
    const months: string[] = [];
    const anchor = new Date();
    anchor.setUTCDate(1);
    anchor.setUTCHours(0, 0, 0, 0);
    for (let i = monthsBack - 1; i >= 0; i--) {
        const m = new Date(anchor);
        m.setUTCMonth(anchor.getUTCMonth() - i);
        months.push(monthKey(m));
    }
    return months;
}

function monthStartIso(month: string): string {
    return `${month}-01T00:00:00.000Z`;
}

function weekStartUtc(d: Date): Date {
    const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = x.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    x.setUTCDate(x.getUTCDate() + diff);
    x.setUTCHours(0, 0, 0, 0);
    return x;
}

function addWeeks(d: Date, weeks: number): Date {
    const x = new Date(d);
    x.setUTCDate(x.getUTCDate() + weeks * 7);
    return x;
}

function calendarMonthWindow(base: Date, monthOffset: number): { start: Date; end: Date } {
    const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + monthOffset, 1));
    const end = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + monthOffset + 1, 1));
    return { start, end };
}

function isPaidBooking(b: {
    payment_status: string | null;
    status: string | null;
}): boolean {
    const ps = (b.payment_status ?? '').toLowerCase();
    const st = (b.status ?? '').toLowerCase();
    return ps === 'paid' || st === 'completed' || st === 'confirmed';
}

function parseBreakdown(raw: string | null | undefined): Record<string, unknown> | null {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function bookingUsedFixedFeeWaiver(b: { financial_breakdown: string | null }): boolean {
    const bd = parseBreakdown(b.financial_breakdown);
    if (!bd) return false;
    if (bd.fixed_fee_waived === true) return true;
    if (bd.commission_waived === true) return true;
    const snap = bd.commission_rate_snapshot;
    if (typeof snap === 'number' && snap === 0) return true;
    return false;
}

export type AnalyticsDashboardOptions = {
    days?: number;
};

export async function getBookingFunnelMetrics(days = DEFAULT_ANALYTICS_DAYS) {
    const since = daysAgoIso(days);
    const events = await prisma.product_analytics_events.findMany({
        where: { created_at: { gte: since } },
        select: {
            event_name: true,
            session_id: true,
            user_id: true,
            created_at: true,
        },
    });

    const funnelEvents: FunnelEventRow[] = events;
    const { stepSessions, stepUsers } = computeLooseFunnelCounts(funnelEvents);
    const strictCounts = computeStrictFunnelCounts(funnelEvents);
    const windowedStrictCounts = computeTimeWindowedStrictFunnelCounts(
        funnelEvents,
        FUNNEL_CONVERSION_WINDOW_HOURS
    );
    const daily_trend = computeDailyFunnelTrend(funnelEvents);
    const step_timing = computeStepMedianHours(funnelEvents);

    const [bookingsCreated, bookingsPaid] = await Promise.all([
        prisma.bookings.count({
            where: { created_at: { gte: since } },
        }),
        prisma.bookings.count({
            where: {
                created_at: { gte: since },
                OR: [
                    { payment_status: 'paid' },
                    { status: { in: ['completed', 'confirmed'] } },
                ],
            },
        }),
    ]);

    const steps = buildFunnelStepRows(
        Object.fromEntries(
            Object.entries(stepSessions).map(([k, v]) => [k, v])
        ) as Record<string, Set<string>>,
        Object.fromEntries(Object.entries(stepUsers).map(([k, v]) => [k, v])) as Record<
            string,
            Set<string>
        >,
        strictCounts,
        windowedStrictCounts
    );

    const paidSessions = Math.max(
        stepSessions.paid_booking?.size ?? 0,
        bookingsPaid
    );
    const createdSessions = Math.max(
        stepSessions.booking_created?.size ?? 0,
        bookingsCreated
    );

    return {
        period_days: days,
        since,
        steps,
        daily_trend,
        step_timing,
        conversion_window_hours: FUNNEL_CONVERSION_WINDOW_HOURS,
        strict_overall_conversion_pct:
            (strictCounts.home ?? 0) === 0
                ? 0
                : Math.round(((strictCounts.paid_booking ?? 0) / (strictCounts.home ?? 1)) * 1000) /
                  10,
        windowed_strict_overall_conversion_pct:
            (windowedStrictCounts.home ?? 0) === 0
                ? 0
                : Math.round(
                      ((windowedStrictCounts.paid_booking ?? 0) /
                          (windowedStrictCounts.home ?? 1)) *
                          1000
                  ) / 10,
        overall_conversion_pct:
            (stepSessions.home?.size ?? 0) === 0
                ? 0
                : Math.round((paidSessions / (stepSessions.home?.size ?? 1)) * 1000) / 10,
        database_truth: {
            bookings_created: bookingsCreated,
            bookings_paid: bookingsPaid,
        },
        blended_terminal: {
            booking_created: createdSessions,
            paid_booking: paidSessions,
        },
    };
}

export async function getCohortRetentionMetrics(monthsBack = 6) {
    const since = new Date();
    since.setUTCMonth(since.getUTCMonth() - monthsBack);
    since.setUTCDate(1);
    since.setUTCHours(0, 0, 0, 0);

    const [users, bookings] = await Promise.all([
        prisma.users.findMany({
            where: { created_at: { gte: since.toISOString() } },
            select: { id: true, created_at: true, role: true },
        }),
        prisma.bookings.findMany({
            where: {
                client_id: { not: null },
                created_at: { gte: since.toISOString() },
            },
            select: {
                client_id: true,
                created_at: true,
                payment_status: true,
                status: true,
            },
        }),
    ]);

    const clientUsers = users.filter((u) => (u.role ?? 'client') === 'client' || u.role === null);
    const paidByClient = new Map<string, Date[]>();
    for (const b of bookings) {
        if (!b.client_id || !isPaidBooking(b)) continue;
        const dt = parseDate(b.created_at);
        if (!dt) continue;
        const list = paidByClient.get(b.client_id) ?? [];
        list.push(dt);
        paidByClient.set(b.client_id, list);
    }

    type CohortRow = {
        cohort: string;
        cohort_size: number;
        retention: Record<string, number>;
    };

    const cohortMap = new Map<string, string[]>();
    for (const u of clientUsers) {
        const signup = parseDate(u.created_at);
        if (!signup) continue;
        const key = monthKey(signup);
        const arr = cohortMap.get(key) ?? [];
        arr.push(u.id);
        cohortMap.set(key, arr);
    }

    const cohorts: CohortRow[] = [];
    for (const [cohort, userIds] of [...cohortMap.entries()].sort()) {
        const retention: Record<string, number> = {};
        for (const week of COHORT_RETENTION_WEEKS) {
            let retained = 0;
            for (const uid of userIds) {
                const signup = clientUsers.find((u) => u.id === uid);
                const signupDate = parseDate(signup?.created_at ?? null);
                if (!signupDate) continue;
                const windowStart = addWeeks(weekStartUtc(signupDate), week);
                const windowEnd = addWeeks(windowStart, 1);
                const acts = paidByClient.get(uid) ?? [];
                const hit = acts.some((d) => d >= windowStart && d < windowEnd);
                if (hit) retained += 1;
            }
            retention[`week_${week}`] =
                userIds.length === 0 ? 0 : Math.round((retained / userIds.length) * 1000) / 10;
        }
        for (const month of COHORT_RETENTION_MONTHS) {
            let retained = 0;
            for (const uid of userIds) {
                const signup = clientUsers.find((u) => u.id === uid);
                const signupDate = parseDate(signup?.created_at ?? null);
                if (!signupDate) continue;
                const { start, end } = calendarMonthWindow(signupDate, month);
                const acts = paidByClient.get(uid) ?? [];
                const hit = acts.some((d) => d >= start && d < end);
                if (hit) retained += 1;
            }
            retention[`month_${month}`] =
                userIds.length === 0 ? 0 : Math.round((retained / userIds.length) * 1000) / 10;
        }
        cohorts.push({ cohort, cohort_size: userIds.length, retention });
    }

    const bookingCohorts = await getFirstBookingCohortRetention(monthsBack);

    const signup_retention_curve = COHORT_RETENTION_WEEKS.map((w) => {
        let weighted = 0;
        const size = cohorts.reduce((s, c) => s + c.cohort_size, 0);
        for (const c of cohorts) {
            weighted += (c.retention[`week_${w}`] ?? 0) * c.cohort_size;
        }
        return {
            week: w,
            label: `W${w}`,
            avg_retention_pct: size === 0 ? 0 : Math.round((weighted / size) * 10) / 10,
        };
    });

    const signup_monthly_retention_curve = COHORT_RETENTION_MONTHS.map((m) => {
        let weighted = 0;
        const size = cohorts.reduce((s, c) => s + c.cohort_size, 0);
        for (const c of cohorts) {
            weighted += (c.retention[`month_${m}`] ?? 0) * c.cohort_size;
        }
        return {
            month: m,
            label: m === 0 ? 'M0' : `M+${m}`,
            avg_retention_pct: size === 0 ? 0 : Math.round((weighted / size) * 10) / 10,
        };
    });

    const latestCohort = cohorts[cohorts.length - 1];
    const priorCohorts = cohorts.slice(0, -1);
    const priorM1Avg =
        priorCohorts.length === 0
            ? null
            : Math.round(
                  (priorCohorts.reduce((s, c) => s + (c.retention.month_1 ?? 0), 0) /
                      priorCohorts.length) *
                      10
              ) / 10;

    return {
        signup_cohorts: cohorts,
        first_booking_cohorts: bookingCohorts,
        retention_weeks: COHORT_RETENTION_WEEKS,
        retention_months: COHORT_RETENTION_MONTHS,
        signup_retention_curve,
        signup_monthly_retention_curve,
        vintage_comparison: latestCohort
            ? {
                  latest_cohort: latestCohort.cohort,
                  latest_m1_retention_pct: latestCohort.retention.month_1 ?? 0,
                  prior_cohorts_avg_m1_pct: priorM1Avg,
                  improving:
                      priorM1Avg === null
                          ? null
                          : (latestCohort.retention.month_1 ?? 0) >= priorM1Avg,
              }
            : null,
    };
}

async function getFirstBookingCohortRetention(monthsBack: number) {
    const bookings = await prisma.bookings.findMany({
        where: { client_id: { not: null } },
        select: {
            client_id: true,
            created_at: true,
            payment_status: true,
            status: true,
        },
        orderBy: { created_at: 'asc' },
    });

    const firstPaid = new Map<string, Date>();
    const allPaid = new Map<string, Date[]>();
    for (const b of bookings) {
        if (!b.client_id || !isPaidBooking(b)) continue;
        const dt = parseDate(b.created_at);
        if (!dt) continue;
        if (!firstPaid.has(b.client_id)) firstPaid.set(b.client_id, dt);
        const list = allPaid.get(b.client_id) ?? [];
        list.push(dt);
        allPaid.set(b.client_id, list);
    }

    const since = new Date();
    since.setUTCMonth(since.getUTCMonth() - monthsBack);

    const cohortMap = new Map<string, string[]>();
    for (const [clientId, first] of firstPaid) {
        if (first < since) continue;
        const key = monthKey(first);
        const arr = cohortMap.get(key) ?? [];
        arr.push(clientId);
        cohortMap.set(key, arr);
    }

    const rows: {
        cohort: string;
        cohort_size: number;
        rebook_m1_pct: number;
        rebook_m3_pct: number;
        rebook_m6_pct: number;
    }[] = [];

    for (const [cohort, ids] of [...cohortMap.entries()].sort()) {
        let m1 = 0;
        let m3 = 0;
        let m6 = 0;
        for (const cid of ids) {
            const first = firstPaid.get(cid)!;
            const acts = allPaid.get(cid) ?? [];
            const rebooks = acts.filter((d) => d.getTime() > first.getTime() + 86400000);
            const monthsSince = (d: Date) => (d.getTime() - first.getTime()) / (86400000 * 30.44);
            if (rebooks.some((d) => monthsSince(d) <= 1)) m1 += 1;
            if (rebooks.some((d) => monthsSince(d) <= 3)) m3 += 1;
            if (rebooks.some((d) => monthsSince(d) <= 6)) m6 += 1;
        }
        const n = ids.length || 1;
        rows.push({
            cohort,
            cohort_size: ids.length,
            rebook_m1_pct: Math.round((m1 / n) * 1000) / 10,
            rebook_m3_pct: Math.round((m3 / n) * 1000) / 10,
            rebook_m6_pct: Math.round((m6 / n) * 1000) / 10,
        });
    }
    return rows;
}

export async function getCustomerLtvMetrics() {
    const [bookings, orders, tips] = await Promise.all([
        prisma.bookings.findMany({
            where: { client_id: { not: null } },
            select: {
                client_id: true,
                price_at_booking: true,
                payment_status: true,
                status: true,
            },
        }),
        prisma.orders.findMany({
            where: { payment_status: 'paid' },
            select: { user_id: true, total: true },
        }),
        prisma.booking_tips.findMany({
            where: { status: 'paid' },
            select: { client_id: true, amount: true },
        }),
    ]);

    const ltv = new Map<string, { booking: number; marketplace: number; tips: number }>();

    function ensure(id: string) {
        if (!ltv.has(id)) ltv.set(id, { booking: 0, marketplace: 0, tips: 0 });
        return ltv.get(id)!;
    }

    for (const b of bookings) {
        if (!b.client_id || !isPaidBooking(b)) continue;
        ensure(b.client_id).booking += b.price_at_booking ?? 0;
    }
    for (const o of orders) {
        if (!o.user_id) continue;
        ensure(o.user_id).marketplace += o.total ?? 0;
    }
    for (const t of tips) {
        if (!t.client_id) continue;
        ensure(t.client_id).tips += t.amount ?? 0;
    }

    const totals = [...ltv.entries()].map(([user_id, parts]) => {
        const total = parts.booking + parts.marketplace + parts.tips;
        return { user_id, ...parts, total_ltv: Math.round(total * 100) / 100 };
    });

    totals.sort((a, b) => b.total_ltv - a.total_ltv);

    const values = totals.map((t) => t.total_ltv);
    const n = values.length || 1;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / n;
    const median = values.length === 0 ? 0 : values[Math.floor(values.length / 2)] ?? 0;
    const p90 = values.length === 0 ? 0 : values[Math.floor(values.length * 0.9)] ?? 0;

    const distribution = LTV_BUCKETS.map((b) => ({
        label: b.label,
        count: totals.filter((t) => t.total_ltv >= b.min && t.total_ltv < b.max).length,
    }));

    const withMarketplace = totals.filter((t) => t.marketplace > 0).length;
    const withBooking = totals.filter((t) => t.booking > 0).length;

    return {
        customers_with_revenue: totals.length,
        average_ltv_eur: Math.round(avg * 100) / 100,
        median_ltv_eur: Math.round(median * 100) / 100,
        p90_ltv_eur: Math.round(p90 * 100) / 100,
        total_platform_gmv_eur: Math.round(sum * 100) / 100,
        avg_booking_revenue_eur:
            withBooking === 0
                ? 0
                : Math.round((totals.reduce((a, t) => a + t.booking, 0) / withBooking) * 100) / 100,
        avg_marketplace_spend_eur:
            withMarketplace === 0
                ? 0
                : Math.round((totals.reduce((a, t) => a + t.marketplace, 0) / withMarketplace) * 100) /
                  100,
        distribution,
        top_customers: totals.slice(0, 10).map(({ user_id, booking, marketplace, tips, total_ltv }) => ({
            user_id,
            booking,
            marketplace,
            tips,
            total_ltv,
        })),
    };
}

export async function getFeeAdoptionMetrics() {
    const [barbers, shops, activePlans, allPlans, paidBookings] = await Promise.all([
        prisma.barbers.findMany({
            where: { status: { not: 'inactive' } },
            select: { id: true, user_id: true },
        }),
        prisma.shops.findMany({
            where: { owner_id: { not: null } },
            select: { id: true, owner_id: true },
        }),
        prisma.provider_fixed_fee_plans.findMany({
            where: { status: 'active', payment_status: 'paid' },
            select: {
                scope: true,
                user_id: true,
                barber_id: true,
                shop_id: true,
                total_paid: true,
                monthly_fee_amount: true,
            },
        }),
        prisma.provider_fixed_fee_plans.findMany({
            select: { status: true, payment_status: true, total_paid: true },
        }),
        prisma.bookings.findMany({
            where: {
                OR: [{ payment_status: 'paid' }, { status: { in: ['completed', 'confirmed'] } }],
            },
            select: {
                financial_breakdown: true,
                platform_fee_amount: true,
                price_at_booking: true,
            },
        }),
    ]);

    const providerUserIds = new Set<string>();
    for (const b of barbers) if (b.user_id) providerUserIds.add(b.user_id);
    for (const s of shops) if (s.owner_id) providerUserIds.add(s.owner_id);

    const barbersOnFixed = new Set(
        activePlans.filter((p) => p.scope === 'barber').map((p) => p.barber_id ?? p.user_id)
    );
    const shopsOnFixed = new Set(
        activePlans.filter((p) => p.scope === 'shop').map((p) => p.shop_id ?? p.user_id)
    );

    let commissionBookings = 0;
    let waivedBookings = 0;
    let commissionRevenue = 0;
    let waivedGmv = 0;

    for (const b of paidBookings) {
        const waived = bookingUsedFixedFeeWaiver(b);
        const bd = parseBreakdown(b.financial_breakdown);
        const fee =
            typeof b.platform_fee_amount === 'number'
                ? b.platform_fee_amount
                : typeof bd?.platform_fee === 'number'
                  ? (bd.platform_fee as number)
                  : 0;
        if (waived) {
            waivedBookings += 1;
            waivedGmv += b.price_at_booking ?? 0;
        } else {
            commissionBookings += 1;
            commissionRevenue += fee;
        }
    }

    const fixedFeePlanRevenue = activePlans.reduce((s, p) => s + (p.total_paid ?? 0), 0);
    const totalBookings = commissionBookings + waivedBookings;

    return {
        providers: {
            total_unique_providers: providerUserIds.size,
            active_barbers: barbers.length,
            shops_with_owner: shops.length,
            on_fixed_fee_plan: activePlans.length,
            barbers_on_fixed_fee: barbersOnFixed.size,
            shops_on_fixed_fee: shopsOnFixed.size,
            adoption_rate_pct:
                providerUserIds.size === 0
                    ? 0
                    : Math.round((activePlans.length / providerUserIds.size) * 1000) / 10,
        },
        bookings: {
            total_paid: totalBookings,
            commission_model: commissionBookings,
            fixed_fee_waived: waivedBookings,
            waived_share_pct:
                totalBookings === 0 ? 0 : Math.round((waivedBookings / totalBookings) * 1000) / 10,
            estimated_commission_revenue_eur: Math.round(commissionRevenue * 100) / 100,
            gmv_under_waiver_eur: Math.round(waivedGmv * 100) / 100,
        },
        fixed_fee_plans: {
            active: activePlans.length,
            all_time_enrollments: allPlans.length,
            active_plan_mrr_estimate_eur:
                Math.round(
                    activePlans.reduce((s, p) => s + (p.monthly_fee_amount ?? 0), 0) * 100
                ) / 100,
            fixed_fee_revenue_collected_eur: Math.round(fixedFeePlanRevenue * 100) / 100,
        },
        revenue_mix: {
            commission_eur: Math.round(commissionRevenue * 100) / 100,
            fixed_fee_eur: Math.round(fixedFeePlanRevenue * 100) / 100,
        },
    };
}

export async function getMarketplaceAttachmentMetrics() {
    const [bookings, orders] = await Promise.all([
        prisma.bookings.findMany({
            where: { client_id: { not: null } },
            select: { client_id: true, created_at: true, payment_status: true, status: true },
            orderBy: { created_at: 'asc' },
        }),
        prisma.orders.findMany({
            where: { payment_status: 'paid' },
            select: { user_id: true, created_at: true },
            orderBy: { created_at: 'asc' },
        }),
    ]);

    const firstBooking = new Map<string, Date>();
    for (const b of bookings) {
        if (!b.client_id || !isPaidBooking(b)) continue;
        const dt = parseDate(b.created_at);
        if (!dt || firstBooking.has(b.client_id)) continue;
        firstBooking.set(b.client_id, dt);
    }

    const clientsWithBooking = firstBooking.size;
    const orderClients = new Set<string>();
    const orderByClient = new Map<string, Date[]>();
    for (const o of orders) {
        if (!o.user_id) continue;
        orderClients.add(o.user_id);
        const dt = parseDate(o.created_at);
        if (!dt) continue;
        const list = orderByClient.get(o.user_id) ?? [];
        list.push(dt);
        orderByClient.set(o.user_id, list);
    }

    let attachedEver = 0;
    let attachedWithin30d = 0;
    let attachedWithin90d = 0;
    let daysToFirstOrderSum = 0;
    let daysToFirstOrderCount = 0;
    let totalOrdersFromAttached = 0;
    const attachBuckets = { within_7d: 0, within_30d: 0, within_90d: 0, after_90d: 0 };

    for (const [clientId, firstBook] of firstBooking) {
        const ordersForClient = orderByClient.get(clientId);
        if (!ordersForClient?.length) continue;
        attachedEver += 1;
        totalOrdersFromAttached += ordersForClient.length;
        const firstOrder = ordersForClient[0]!;
        const days = (firstOrder.getTime() - firstBook.getTime()) / 86400000;
        if (days >= 0 && days <= 30) attachedWithin30d += 1;
        if (days >= 0 && days <= 90) attachedWithin90d += 1;
        if (days >= 0) {
            daysToFirstOrderSum += days;
            daysToFirstOrderCount += 1;
            if (days <= 7) attachBuckets.within_7d += 1;
            else if (days <= 30) attachBuckets.within_30d += 1;
            else if (days <= 90) attachBuckets.within_90d += 1;
            else attachBuckets.after_90d += 1;
        }
    }

    const marketplaceOnly = [...orderClients].filter((id) => !firstBooking.has(id)).length;

    return {
        clients_with_paid_booking: clientsWithBooking,
        clients_with_paid_order: orderClients.size,
        attachment_rate_ever_pct:
            clientsWithBooking === 0
                ? 0
                : Math.round((attachedEver / clientsWithBooking) * 1000) / 10,
        attachment_within_30d_of_first_booking_pct:
            clientsWithBooking === 0
                ? 0
                : Math.round((attachedWithin30d / clientsWithBooking) * 1000) / 10,
        attachment_within_90d_of_first_booking_pct:
            clientsWithBooking === 0
                ? 0
                : Math.round((attachedWithin90d / clientsWithBooking) * 1000) / 10,
        avg_orders_per_attached_client:
            attachedEver === 0
                ? 0
                : Math.round((totalOrdersFromAttached / attachedEver) * 100) / 100,
        attach_time_buckets: attachBuckets,
        benchmark:
            clientsWithBooking === 0
                ? null
                : {
                      attach_rate_pct:
                          Math.round((attachedEver / clientsWithBooking) * 1000) / 10,
                      industry_good_pct: ANALYTICS_BENCHMARKS.marketplace_attach_rate_pct.good,
                      industry_great_pct: ANALYTICS_BENCHMARKS.marketplace_attach_rate_pct.great,
                  },
        avg_days_to_first_marketplace_order:
            daysToFirstOrderCount === 0
                ? null
                : Math.round((daysToFirstOrderSum / daysToFirstOrderCount) * 10) / 10,
        marketplace_only_buyers: marketplaceOnly,
        cross_sell_opportunity: Math.max(0, clientsWithBooking - attachedEver),
    };
}

export async function getAnalyticsEventSummary(days = DEFAULT_ANALYTICS_DAYS) {
    const since = daysAgoIso(days);
    const tracked = [
        ANALYTICS_EVENTS.BOOKING_PAID,
        ANALYTICS_EVENTS.BOOKING_CREATED,
        ANALYTICS_EVENTS.MARKETPLACE_ORDER_PAID,
        ANALYTICS_EVENTS.FIXED_FEE_ENROLLED,
    ] as const;

    const rows = await prisma.product_analytics_events.findMany({
        where: {
            created_at: { gte: since },
            event_name: { in: [...tracked] },
        },
        select: { event_name: true },
    });

    const counts: Record<string, number> = Object.fromEntries(tracked.map((e) => [e, 0]));
    for (const row of rows) {
        counts[row.event_name] = (counts[row.event_name] ?? 0) + 1;
    }

    return { period_days: days, since, counts };
}

export async function getLtvMonthlyTrend(monthsBack = 12) {
    const months = monthsBackRange(monthsBack);
    const since = monthStartIso(months[0]!);

    const [bookings, orders, tips] = await Promise.all([
        prisma.bookings.findMany({
            where: { client_id: { not: null }, created_at: { gte: since } },
            select: {
                client_id: true,
                price_at_booking: true,
                payment_status: true,
                status: true,
                created_at: true,
            },
        }),
        prisma.orders.findMany({
            where: { payment_status: 'paid', created_at: { gte: since } },
            select: { user_id: true, total: true, created_at: true },
        }),
        prisma.booking_tips.findMany({
            where: { status: 'paid' },
            select: { client_id: true, amount: true, paid_at: true, created_at: true },
        }),
    ]);

    type MonthBucket = {
        booking_gmv: number;
        marketplace_gmv: number;
        tips_gmv: number;
        new_paying_clients: Set<string>;
    };

    const buckets = new Map<string, MonthBucket>(
        months.map((m) => [
            m,
            { booking_gmv: 0, marketplace_gmv: 0, tips_gmv: 0, new_paying_clients: new Set() },
        ])
    );

    const seenPaying = new Set<string>();

    for (const b of bookings) {
        if (!b.client_id || !isPaidBooking(b)) continue;
        const dt = parseDate(b.created_at);
        if (!dt) continue;
        const key = monthKey(dt);
        const bucket = buckets.get(key);
        if (!bucket) continue;
        bucket.booking_gmv += b.price_at_booking ?? 0;
        if (!seenPaying.has(b.client_id)) {
            seenPaying.add(b.client_id);
            bucket.new_paying_clients.add(b.client_id);
        }
    }

    for (const o of orders) {
        const dt = parseDate(o.created_at);
        if (!dt) continue;
        const key = monthKey(dt);
        const bucket = buckets.get(key);
        if (!bucket) continue;
        bucket.marketplace_gmv += o.total ?? 0;
        if (o.user_id && !seenPaying.has(o.user_id)) {
            seenPaying.add(o.user_id);
            bucket.new_paying_clients.add(o.user_id);
        }
    }

    for (const t of tips) {
        const dt = parseDate(t.paid_at ?? t.created_at);
        if (!dt) continue;
        const key = monthKey(dt);
        const bucket = buckets.get(key);
        if (!bucket) continue;
        bucket.tips_gmv += t.amount ?? 0;
    }

    return months.map((month) => {
        const b = buckets.get(month)!;
        const total = b.booking_gmv + b.marketplace_gmv + b.tips_gmv;
        return {
            month,
            booking_gmv_eur: Math.round(b.booking_gmv * 100) / 100,
            marketplace_gmv_eur: Math.round(b.marketplace_gmv * 100) / 100,
            tips_gmv_eur: Math.round(b.tips_gmv * 100) / 100,
            total_gmv_eur: Math.round(total * 100) / 100,
            new_paying_clients: b.new_paying_clients.size,
        };
    });
}

export async function getFeeAdoptionMonthlyTrend(monthsBack = 12) {
    const months = monthsBackRange(monthsBack);
    const since = monthStartIso(months[0]!);

    const [plans, bookings, analyticsEvents] = await Promise.all([
        prisma.provider_fixed_fee_plans.findMany({
            where: {
                payment_status: 'paid',
                OR: [{ enrolled_at: { gte: since } }, { created_at: { gte: since } }],
            },
            select: {
                enrolled_at: true,
                created_at: true,
                total_paid: true,
                monthly_fee_amount: true,
            },
        }),
        prisma.bookings.findMany({
            where: {
                created_at: { gte: since },
                OR: [{ payment_status: 'paid' }, { status: { in: ['completed', 'confirmed'] } }],
            },
            select: {
                created_at: true,
                financial_breakdown: true,
                platform_fee_amount: true,
            },
        }),
        prisma.product_analytics_events.findMany({
            where: {
                event_name: ANALYTICS_EVENTS.FIXED_FEE_ENROLLED,
                created_at: { gte: since },
            },
            select: { created_at: true },
        }),
    ]);

    type Bucket = {
        enrollments_db: number;
        enrollments_events: number;
        fixed_fee_revenue_eur: number;
        commission_revenue_eur: number;
        commission_bookings: number;
        waived_bookings: number;
    };

    const buckets = new Map<string, Bucket>(
        months.map((m) => [
            m,
            {
                enrollments_db: 0,
                enrollments_events: 0,
                fixed_fee_revenue_eur: 0,
                commission_revenue_eur: 0,
                commission_bookings: 0,
                waived_bookings: 0,
            },
        ])
    );

    for (const plan of plans) {
        const dt = parseDate(plan.enrolled_at ?? plan.created_at);
        if (!dt) continue;
        const key = monthKey(dt);
        const bucket = buckets.get(key);
        if (!bucket) continue;
        bucket.enrollments_db += 1;
        bucket.fixed_fee_revenue_eur += plan.total_paid ?? plan.monthly_fee_amount ?? 0;
    }

    for (const ev of analyticsEvents) {
        const dt = parseDate(ev.created_at);
        if (!dt) continue;
        const key = monthKey(dt);
        const bucket = buckets.get(key);
        if (!bucket) continue;
        bucket.enrollments_events += 1;
    }

    for (const b of bookings) {
        const dt = parseDate(b.created_at);
        if (!dt) continue;
        const key = monthKey(dt);
        const bucket = buckets.get(key);
        if (!bucket) continue;
        const waived = bookingUsedFixedFeeWaiver(b);
        const bd = parseBreakdown(b.financial_breakdown);
        const fee =
            typeof b.platform_fee_amount === 'number'
                ? b.platform_fee_amount
                : typeof bd?.platform_fee === 'number'
                  ? (bd.platform_fee as number)
                  : 0;
        if (waived) {
            bucket.waived_bookings += 1;
        } else {
            bucket.commission_bookings += 1;
            bucket.commission_revenue_eur += fee;
        }
    }

    return months.map((month) => {
        const b = buckets.get(month)!;
        const totalBookings = b.commission_bookings + b.waived_bookings;
        return {
            month,
            enrollments_db: b.enrollments_db,
            enrollments_events: b.enrollments_events,
            fixed_fee_revenue_eur: Math.round(b.fixed_fee_revenue_eur * 100) / 100,
            commission_revenue_eur: Math.round(b.commission_revenue_eur * 100) / 100,
            commission_bookings: b.commission_bookings,
            waived_bookings: b.waived_bookings,
            waived_share_pct:
                totalBookings === 0
                    ? 0
                    : Math.round((b.waived_bookings / totalBookings) * 1000) / 10,
        };
    });
}

export async function getMarketplaceMonthlyTrend(monthsBack = 12) {
    const months = monthsBackRange(monthsBack);
    const since = monthStartIso(months[0]!);

    const [orders, bookings, analyticsEvents] = await Promise.all([
        prisma.orders.findMany({
            where: { payment_status: 'paid', created_at: { gte: since } },
            select: { user_id: true, total: true, created_at: true },
            orderBy: { created_at: 'asc' },
        }),
        prisma.bookings.findMany({
            where: { client_id: { not: null }, created_at: { gte: since } },
            select: { client_id: true, created_at: true, payment_status: true, status: true },
            orderBy: { created_at: 'asc' },
        }),
        prisma.product_analytics_events.findMany({
            where: {
                event_name: ANALYTICS_EVENTS.MARKETPLACE_ORDER_PAID,
                created_at: { gte: since },
            },
            select: { created_at: true },
        }),
    ]);

    const firstBookingEver = new Map<string, Date>();
    for (const b of bookings) {
        if (!b.client_id || !isPaidBooking(b)) continue;
        const dt = parseDate(b.created_at);
        if (!dt || firstBookingEver.has(b.client_id)) continue;
        firstBookingEver.set(b.client_id, dt);
    }

    type Bucket = {
        orders: number;
        gmv_eur: number;
        unique_buyers: Set<string>;
        order_events: number;
        first_bookings: number;
        attached_within_30d: number;
    };

    const buckets = new Map<string, Bucket>(
        months.map((m) => [
            m,
            {
                orders: 0,
                gmv_eur: 0,
                unique_buyers: new Set(),
                order_events: 0,
                first_bookings: 0,
                attached_within_30d: 0,
            },
        ])
    );

    const firstOrderByUser = new Map<string, Date>();
    for (const o of orders) {
        const dt = parseDate(o.created_at);
        if (!dt) continue;
        const key = monthKey(dt);
        const bucket = buckets.get(key);
        if (!bucket) continue;
        bucket.orders += 1;
        bucket.gmv_eur += o.total ?? 0;
        if (o.user_id) {
            bucket.unique_buyers.add(o.user_id);
            if (!firstOrderByUser.has(o.user_id)) {
                firstOrderByUser.set(o.user_id, dt);
            }
        }
    }

    for (const ev of analyticsEvents) {
        const dt = parseDate(ev.created_at);
        if (!dt) continue;
        const key = monthKey(dt);
        const bucket = buckets.get(key);
        if (!bucket) continue;
        bucket.order_events += 1;
    }

    for (const [clientId, firstBook] of firstBookingEver) {
        const key = monthKey(firstBook);
        const bucket = buckets.get(key);
        if (!bucket) continue;
        bucket.first_bookings += 1;
        const firstOrder = firstOrderByUser.get(clientId);
        if (firstOrder) {
            const days = (firstOrder.getTime() - firstBook.getTime()) / 86400000;
            if (days >= 0 && days <= 30) bucket.attached_within_30d += 1;
        }
    }

    return months.map((month) => {
        const b = buckets.get(month)!;
        return {
            month,
            paid_orders: b.orders,
            marketplace_gmv_eur: Math.round(b.gmv_eur * 100) / 100,
            unique_buyers: b.unique_buyers.size,
            order_paid_events: b.order_events,
            first_bookings_in_month: b.first_bookings,
            attachment_within_30d_pct:
                b.first_bookings === 0
                    ? 0
                    : Math.round((b.attached_within_30d / b.first_bookings) * 1000) / 10,
        };
    });
}

/** Realised LTV by signup cohort (person-level, Kissmetrics / Stripe pattern). */
export async function getLtvBySignupCohort(monthsBack = 12) {
    const since = new Date();
    since.setUTCMonth(since.getUTCMonth() - monthsBack);
    since.setUTCDate(1);

    const [users, bookings, orders, tips] = await Promise.all([
        prisma.users.findMany({
            where: { created_at: { gte: since.toISOString() } },
            select: { id: true, created_at: true, role: true },
        }),
        prisma.bookings.findMany({
            where: { client_id: { not: null } },
            select: {
                client_id: true,
                price_at_booking: true,
                payment_status: true,
                status: true,
            },
        }),
        prisma.orders.findMany({
            where: { payment_status: 'paid' },
            select: { user_id: true, total: true },
        }),
        prisma.booking_tips.findMany({
            where: { status: 'paid' },
            select: { client_id: true, amount: true },
        }),
    ]);

    const clientUsers = users.filter((u) => (u.role ?? 'client') === 'client' || u.role === null);
    const revenueByUser = new Map<string, number>();

    function addRev(userId: string, amount: number) {
        revenueByUser.set(userId, (revenueByUser.get(userId) ?? 0) + amount);
    }

    for (const b of bookings) {
        if (!b.client_id || !isPaidBooking(b)) continue;
        addRev(b.client_id, b.price_at_booking ?? 0);
    }
    for (const o of orders) {
        if (!o.user_id) continue;
        addRev(o.user_id, o.total ?? 0);
    }
    for (const t of tips) {
        if (!t.client_id) continue;
        addRev(t.client_id, t.amount ?? 0);
    }

    const byCohort = new Map<string, number[]>();
    for (const u of clientUsers) {
        const signup = parseDate(u.created_at);
        if (!signup) continue;
        const key = monthKey(signup);
        const ltv = revenueByUser.get(u.id) ?? 0;
        const list = byCohort.get(key) ?? [];
        list.push(ltv);
        byCohort.set(key, list);
    }

    return [...byCohort.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([cohort, values]) => {
            const sorted = [...values].sort((a, b) => a - b);
            const sum = sorted.reduce((a, b) => a + b, 0);
            const n = sorted.length || 1;
            return {
                cohort,
                cohort_size: sorted.length,
                avg_ltv_eur: Math.round((sum / n) * 100) / 100,
                median_ltv_eur: Math.round((sorted[Math.floor(sorted.length / 2)] ?? 0) * 100) / 100,
                paying_clients: sorted.filter((v) => v > 0).length,
            };
        });
}

/** Revenue retention by signup cohort (% of M0 revenue in subsequent months, NRR-style). */
export async function getRevenueRetentionCohorts(monthsBack = 12) {
    const since = new Date();
    since.setUTCMonth(since.getUTCMonth() - monthsBack);
    since.setUTCDate(1);

    const [users, bookings, orders, tips] = await Promise.all([
        prisma.users.findMany({
            where: { created_at: { gte: since.toISOString() } },
            select: { id: true, created_at: true, role: true },
        }),
        prisma.bookings.findMany({
            where: { client_id: { not: null }, created_at: { gte: since.toISOString() } },
            select: {
                client_id: true,
                created_at: true,
                price_at_booking: true,
                payment_status: true,
                status: true,
            },
        }),
        prisma.orders.findMany({
            where: { payment_status: 'paid', created_at: { gte: since.toISOString() } },
            select: { user_id: true, created_at: true, total: true },
        }),
        prisma.booking_tips.findMany({
            where: { status: 'paid' },
            select: { client_id: true, paid_at: true, created_at: true, amount: true },
        }),
    ]);

    const clientUsers = users.filter((u) => (u.role ?? 'client') === 'client' || u.role === null);
    const cohortUsers = new Map<string, string[]>();
    const userSignup = new Map<string, Date>();

    for (const u of clientUsers) {
        const signup = parseDate(u.created_at);
        if (!signup) continue;
        userSignup.set(u.id, signup);
        const key = monthKey(signup);
        const arr = cohortUsers.get(key) ?? [];
        arr.push(u.id);
        cohortUsers.set(key, arr);
    }

    type Tx = { userId: string; at: Date; amount: number };
    const txs: Tx[] = [];

    for (const b of bookings) {
        if (!b.client_id || !isPaidBooking(b)) continue;
        const at = parseDate(b.created_at);
        if (!at) continue;
        txs.push({ userId: b.client_id, at, amount: b.price_at_booking ?? 0 });
    }
    for (const o of orders) {
        if (!o.user_id) continue;
        const at = parseDate(o.created_at);
        if (!at) continue;
        txs.push({ userId: o.user_id, at, amount: o.total ?? 0 });
    }
    for (const t of tips) {
        if (!t.client_id) continue;
        const at = parseDate(t.paid_at ?? t.created_at);
        if (!at) continue;
        txs.push({ userId: t.client_id, at, amount: t.amount ?? 0 });
    }

    const maxMonths = 6;
    return [...cohortUsers.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([cohort, userIds]) => {
            const cohortSet = new Set(userIds);
            const baseSignup = userIds
                .map((id) => userSignup.get(id))
                .find((d) => d !== undefined);
            if (!baseSignup) {
                return { cohort, cohort_size: userIds.length, revenue_retention: {} };
            }

            const revenueByMonth: number[] = Array.from({ length: maxMonths + 1 }, () => 0);
            for (const tx of txs) {
                if (!cohortSet.has(tx.userId)) continue;
                const signup = userSignup.get(tx.userId);
                if (!signup) continue;
                const monthIdx =
                    (tx.at.getUTCFullYear() - signup.getUTCFullYear()) * 12 +
                    (tx.at.getUTCMonth() - signup.getUTCMonth());
                if (monthIdx < 0 || monthIdx > maxMonths) continue;
                revenueByMonth[monthIdx] = (revenueByMonth[monthIdx] ?? 0) + tx.amount;
            }

            const m0Rev = revenueByMonth[0] ?? 0;
            const revenue_retention: Record<string, number> = {};
            for (let m = 0; m <= maxMonths; m++) {
                revenue_retention[`month_${m}`] =
                    m0Rev === 0
                        ? 0
                        : Math.round(((revenueByMonth[m] ?? 0) / m0Rev) * 1000) / 10;
            }

            return {
                cohort,
                cohort_size: userIds.length,
                m0_revenue_eur: Math.round(m0Rev * 100) / 100,
                revenue_retention,
            };
        });
}

export async function getProductAnalyticsDashboard(options: AnalyticsDashboardOptions = {}) {
    const days = options.days ?? DEFAULT_ANALYTICS_DAYS;
    const [
        funnel,
        cohorts,
        ltv,
        feeAdoption,
        marketplace,
        analyticsEvents,
        ltvMonthly,
        feeMonthly,
        marketplaceMonthly,
        ltvBySignupCohort,
        revenueRetentionCohorts,
        northStar,
    ] = await Promise.all([
        getBookingFunnelMetrics(days),
        getCohortRetentionMetrics(6),
        getCustomerLtvMetrics(),
        getFeeAdoptionMetrics(),
        getMarketplaceAttachmentMetrics(),
        getAnalyticsEventSummary(days),
        getLtvMonthlyTrend(12),
        getFeeAdoptionMonthlyTrend(12),
        getMarketplaceMonthlyTrend(12),
        getLtvBySignupCohort(12),
        getRevenueRetentionCohorts(12),
        getNorthStarMetrics({ days }),
    ]);

    return {
        generated_at: new Date().toISOString(),
        period_days: days,
        benchmarks: ANALYTICS_BENCHMARKS,
        north_star: northStar,
        funnel,
        cohorts,
        ltv,
        ltv_by_signup_cohort: ltvBySignupCohort,
        revenue_retention_cohorts: revenueRetentionCohorts,
        fee_adoption: feeAdoption,
        marketplace_attachment: marketplace,
        analytics_events: analyticsEvents,
        trends: {
            ltv_monthly: ltvMonthly,
            fee_adoption_monthly: feeMonthly,
            marketplace_monthly: marketplaceMonthly,
        },
    };
}
