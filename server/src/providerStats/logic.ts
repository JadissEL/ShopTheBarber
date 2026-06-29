import { prisma } from '../db/prisma';

export type DisputeOutcome = 'client_favored' | 'provider_favored' | 'partial' | 'withdrawn' | 'info_only';

export type ProviderStatsScope = {
    barberId?: string;
    shopId?: string;
};

function normalizeStatus(status: string | null | undefined): string {
    return (status ?? '').toLowerCase().replace(/\s+/g, '_');
}

/** Count completed services (individual = 1, group = party_size). */
export function countCompletedServices(
    bookings: Array<{ status?: string | null; booking_type?: string | null; party_size?: number | null }>
): number {
    return bookings
        .filter((b) => normalizeStatus(b.status) === 'completed')
        .reduce((sum, b) => {
            if (b.booking_type === 'group') {
                return sum + Math.max(1, b.party_size ?? 2);
            }
            return sum + 1;
        }, 0);
}

function bookingWhere(scope: ProviderStatsScope) {
    if (scope.shopId) return { shop_id: scope.shopId };
    if (scope.barberId) return { barber_id: scope.barberId };
    throw new Error('barberId or shopId required');
}

async function loadBookings(scope: ProviderStatsScope) {
    return prisma.bookings.findMany({
        where: bookingWhere(scope),
        select: {
            id: true,
            status: true,
            booking_type: true,
            party_size: true,
            payment_method: true,
            payment_status: true,
            platform_fee_status: true,
            platform_fee_amount: true,
            price_at_booking: true,
            client_id: true,
            no_show_fee_status: true,
        },
    });
}

async function loadDisputes(scope: ProviderStatsScope) {
    const bookings = await prisma.bookings.findMany({
        where: bookingWhere(scope),
        select: { id: true },
    });
    const bookingIds = bookings.map((b) => b.id);
    if (bookingIds.length === 0) return [];

    return prisma.disputes.findMany({
        where: { booking_id: { in: bookingIds } },
        select: {
            id: true,
            status: true,
            resolution_outcome: true,
            refund_amount: true,
            booking_id: true,
            created_at: true,
        },
    });
}

async function loadWalletUserId(scope: ProviderStatsScope): Promise<string | null> {
    if (scope.shopId) {
        const shop = await prisma.shops.findUnique({
            where: { id: scope.shopId },
            select: { owner_id: true },
        });
        return shop?.owner_id ?? null;
    }
    if (scope.barberId) {
        const barber = await prisma.barbers.findUnique({
            where: { id: scope.barberId },
            select: { user_id: true },
        });
        return barber?.user_id ?? null;
    }
    return null;
}

async function loadPlatformFeeTransactions(userId: string, scope: ProviderStatsScope) {
    const wallet = scope.shopId
        ? await prisma.provider_fee_wallets.findFirst({ where: { shop_id: scope.shopId } })
        : await prisma.provider_fee_wallets.findFirst({ where: { user_id: userId, shop_id: null } });

    if (!wallet) {
        return { platform_fees_paid: 0, platform_fee_refunds: 0, penalty_charges: 0 };
    }

    const txs = await prisma.provider_fee_transactions.findMany({
        where: { wallet_id: wallet.id },
        select: { type: true, amount: true },
    });

    let platform_fees_paid = 0;
    let platform_fee_refunds = 0;
    let penalty_charges = 0;

    for (const tx of txs) {
        const type = (tx.type ?? '').toLowerCase();
        const abs = Math.abs(tx.amount);
        if (type === 'platform_fee') platform_fees_paid += abs;
        else if (type === 'fee_refund') platform_fee_refunds += abs;
        else if (type === 'penalty') penalty_charges += abs;
    }

    return { platform_fees_paid, platform_fee_refunds, penalty_charges };
}

function computeBookingMetrics(
    bookings: Awaited<ReturnType<typeof loadBookings>>
) {
    const completed = bookings.filter((b) => normalizeStatus(b.status) === 'completed');
    const cancelled = bookings.filter((b) => normalizeStatus(b.status) === 'cancelled');
    const noShows = bookings.filter((b) => normalizeStatus(b.status) === 'no_show');
    const pendingOrConfirmed = bookings.filter((b) =>
        ['pending', 'confirmed'].includes(normalizeStatus(b.status))
    );

    const completedServices = countCompletedServices(bookings);
    const totalResolved =
        completed.length + cancelled.length + noShows.length;
    const completionRate =
        totalResolved > 0 ? Math.round((completed.length / totalResolved) * 1000) / 10 : 0;
    const cancellationRate =
        totalResolved > 0 ? Math.round((cancelled.length / totalResolved) * 1000) / 10 : 0;
    const noShowRate =
        totalResolved > 0 ? Math.round((noShows.length / totalResolved) * 1000) / 10 : 0;

    const cashUnpaidByClient = completed.filter(
        (b) =>
            b.payment_method === 'cash_at_store' &&
            normalizeStatus(b.payment_status) === 'unpaid'
    ).length;

    const paymentRefunds = completed.filter(
        (b) => normalizeStatus(b.payment_status) === 'refunded'
    ).length;

    const repeatClients = (() => {
        const counts = new Map<string, number>();
        for (const b of completed) {
            if (!b.client_id) continue;
            counts.set(b.client_id, (counts.get(b.client_id) ?? 0) + 1);
        }
        const total = counts.size;
        const repeat = [...counts.values()].filter((c) => c > 1).length;
        return {
            unique_clients: total,
            repeat_clients: repeat,
            rebooking_rate: total > 0 ? Math.round((repeat / total) * 1000) / 10 : 0,
        };
    })();

    const avgBookingValue =
        completed.length > 0
            ? Math.round(
                  (completed.reduce((s, b) => s + (b.price_at_booking ?? 0), 0) / completed.length) *
                      100
              ) / 100
            : 0;

    return {
        completed_services: completedServices,
        completed_bookings: completed.length,
        cancelled_bookings: cancelled.length,
        no_show_bookings: noShows.length,
        upcoming_bookings: pendingOrConfirmed.length,
        cancellation_rate_percent: cancellationRate,
        no_show_rate_percent: noShowRate,
        completion_rate_percent: completionRate,
        repeat_customer_rate_percent: repeatClients.rebooking_rate,
        cash_unpaid_by_client: cashUnpaidByClient,
        payment_refunds: paymentRefunds,
        avg_booking_value: avgBookingValue,
        ...repeatClients,
    };
}

function computeDisputeMetrics(disputes: Awaited<ReturnType<typeof loadDisputes>>) {
    const open = disputes.filter((d) => {
        const s = normalizeStatus(d.status);
        return s === 'open' || s === 'in_review';
    });

    const resolved = disputes.filter((d) => normalizeStatus(d.status) === 'resolved');

    const providerFavored = resolved.filter(
        (d) => d.resolution_outcome === 'provider_favored'
    ).length;
    const clientFavored = resolved.filter(
        (d) => d.resolution_outcome === 'client_favored'
    ).length;
    const partial = resolved.filter((d) => d.resolution_outcome === 'partial').length;

    const refundsApproved = resolved.filter(
        (d) =>
            (d.resolution_outcome === 'client_favored' || d.resolution_outcome === 'partial') &&
            (d.refund_amount ?? 0) > 0
    ).length;

    const refundsDenied = resolved.filter(
        (d) => d.resolution_outcome === 'provider_favored'
    ).length;

    return {
        disputes_total: disputes.length,
        disputes_open: open.length,
        disputes_resolved: resolved.length,
        disputes_provider_favored: providerFavored,
        disputes_client_favored: clientFavored,
        disputes_partial: partial,
        dispute_refunds_approved: refundsApproved,
        dispute_refunds_denied: refundsDenied,
    };
}

export type PublicProviderStats = {
    completed_services: number;
    completed_bookings: number;
    cancellation_rate_percent: number;
    no_show_rate_percent: number;
    completion_rate_percent: number;
    repeat_customer_rate_percent: number;
    years_on_platform: number | null;
    championship_badges: string[];
};

function yearsOnPlatform(createdAt: string | null | undefined): number | null {
    if (!createdAt) return null;
    const start = new Date(createdAt).getTime();
    if (Number.isNaN(start)) return null;
    const years = (Date.now() - start) / (365.25 * 24 * 3600 * 1000);
    return Math.max(0, Math.round(years * 10) / 10);
}

function buildPublicStats(
    metrics: ReturnType<typeof computeBookingMetrics>,
    barberMeta?: { created_at?: string | null },
    championshipBadges: string[] = []
): PublicProviderStats {
    return {
        completed_services: metrics.completed_services,
        completed_bookings: metrics.completed_bookings,
        cancellation_rate_percent: metrics.cancellation_rate_percent,
        no_show_rate_percent: metrics.no_show_rate_percent,
        completion_rate_percent: metrics.completion_rate_percent,
        repeat_customer_rate_percent: metrics.repeat_customer_rate_percent,
        years_on_platform: yearsOnPlatform(barberMeta?.created_at),
        championship_badges: championshipBadges,
    };
}

async function loadChampionshipBadges(barberId: string): Promise<string[]> {
    try {
        const entries = await prisma.championship_hall_of_fame.findMany({
            where: { barber_id: barberId },
            select: { badge: true, rank: true },
            take: 10,
        });
        return entries.map((e) => e.badge ?? `top_${e.rank}`);
    } catch {
        return [];
    }
}

export type AdminProviderStats = PublicProviderStats & {
    barber_id: string | null;
    shop_id: string | null;
    provider_name: string;
    provider_type: 'barber' | 'shop';
    rating: number;
    review_count: number;
    cancelled_bookings: number;
    no_show_bookings: number;
    upcoming_bookings: number;
    cash_unpaid_by_client: number;
    payment_refunds: number;
    avg_booking_value: number;
    unique_clients: number;
    repeat_clients: number;
    rebooking_rate_percent: number;
    disputes_total: number;
    disputes_open: number;
    disputes_resolved: number;
    disputes_provider_favored: number;
    disputes_client_favored: number;
    disputes_partial: number;
    dispute_refunds_approved: number;
    dispute_refunds_denied: number;
    dispute_rate_percent: number;
    platform_fees_paid: number;
    platform_fee_refunds: number;
    platform_penalty_charges: number;
    health_score: number;
    health_flags: string[];
};

function computeHealthScore(
    metrics: ReturnType<typeof computeBookingMetrics>,
    disputes: ReturnType<typeof computeDisputeMetrics>,
    rating: number
): { score: number; flags: string[] } {
    let score = 100;
    const flags: string[] = [];

    if (metrics.cancellation_rate_percent > 15) {
        score -= 15;
        flags.push('High cancellation rate');
    } else if (metrics.cancellation_rate_percent > 8) {
        score -= 8;
        flags.push('Elevated cancellations');
    }

    if (metrics.no_show_rate_percent > 10) {
        score -= 15;
        flags.push('High no-show rate');
    } else if (metrics.no_show_rate_percent > 5) {
        score -= 8;
        flags.push('Elevated no-shows');
    }

    if (disputes.disputes_client_favored >= 3) {
        score -= 20;
        flags.push('Multiple disputes lost');
    } else if (disputes.disputes_client_favored >= 1) {
        score -= 10;
        flags.push('Dispute lost to client');
    }

    if (metrics.cash_unpaid_by_client > 0) {
        score -= Math.min(15, metrics.cash_unpaid_by_client * 5);
        flags.push('Cash payment issues');
    }

    if (rating > 0 && rating < 3.5) {
        score -= 20;
        flags.push('Low rating');
    } else if (rating > 0 && rating < 4.0) {
        score -= 10;
        flags.push('Below-average rating');
    }

    if (disputes.disputes_open >= 2) {
        score -= 10;
        flags.push('Open disputes');
    }

    return { score: Math.max(0, Math.min(100, score)), flags };
}

export async function getPublicBarberStats(barberId: string): Promise<PublicProviderStats> {
    const barber = await prisma.barbers.findUnique({
        where: { id: barberId },
        select: { id: true, created_at: true },
    });
    if (!barber) throw new Error('Barber not found');
    const bookings = await loadBookings({ barberId });
    const metrics = computeBookingMetrics(bookings);
    const badges = await loadChampionshipBadges(barberId);
    return buildPublicStats(metrics, barber, badges);
}

export async function getPublicShopStats(shopId: string): Promise<PublicProviderStats> {
    const shop = await prisma.shops.findUnique({
        where: { id: shopId },
        select: { id: true, created_at: true },
    });
    if (!shop) throw new Error('Shop not found');
    const bookings = await loadBookings({ shopId });
    const metrics = computeBookingMetrics(bookings);
    return buildPublicStats(metrics, shop);
}

/** Public stats for many barbers (explore / homepage cards). Max 100 ids. */
export async function getBatchPublicBarberStats(
    barberIds: string[]
): Promise<Record<string, PublicProviderStats>> {
    const ids = [...new Set(barberIds.filter(Boolean))].slice(0, 100);
    if (ids.length === 0) return {};

    const bookings = await prisma.bookings.findMany({
        where: { barber_id: { in: ids } },
        select: {
            barber_id: true,
            status: true,
            booking_type: true,
            party_size: true,
            client_id: true,
            price_at_booking: true,
        },
    });

    const barbers = await prisma.barbers.findMany({
        where: { id: { in: ids } },
        select: { id: true, created_at: true },
    });
    const barberCreated = new Map(barbers.map((b) => [b.id, b.created_at]));

    const byBarber = new Map<string, typeof bookings>();
    for (const id of ids) byBarber.set(id, []);
    for (const b of bookings) {
        if (!b.barber_id) continue;
        byBarber.get(b.barber_id)?.push(b);
    }

    const out: Record<string, PublicProviderStats> = {};
    for (const id of ids) {
        const metrics = computeBookingMetrics(byBarber.get(id) ?? []);
        out[id] = buildPublicStats(metrics, { created_at: barberCreated.get(id) });
    }
    return out;
}

/** Stats for the logged-in provider (barber profile or shop they own). */
export async function getMyProviderStats(userId: string): Promise<AdminProviderStats | null> {
    const barber = await prisma.barbers.findFirst({
        where: { user_id: userId },
        select: { id: true },
        orderBy: { created_at: 'desc' },
    });
    if (barber) return getAdminBarberStats(barber.id);

    const shop = await prisma.shops.findFirst({
        where: { owner_id: userId },
        select: { id: true },
    });
    if (shop) return getAdminShopStats(shop.id);

    return null;
}

export async function getAdminBarberStats(barberId: string): Promise<AdminProviderStats> {
    const barber = await prisma.barbers.findUnique({
        where: { id: barberId },
        select: { id: true, name: true, rating: true, review_count: true, shop_id: true },
    });
    if (!barber) throw new Error('Barber not found');

    const bookings = await loadBookings({ barberId });
    const disputes = await loadDisputes({ barberId });
    const metrics = computeBookingMetrics(bookings);
    const disputeMetrics = computeDisputeMetrics(disputes);
    const userId = await loadWalletUserId({ barberId });
    const walletMetrics = userId
        ? await loadPlatformFeeTransactions(userId, { barberId })
        : { platform_fees_paid: 0, platform_fee_refunds: 0, penalty_charges: 0 };

    const rating = barber.rating ?? 0;
    const health = computeHealthScore(metrics, disputeMetrics, rating);

    const totalBookingsForDisputeRate =
        metrics.completed_bookings + metrics.cancelled_bookings + metrics.no_show_bookings;
    const disputeRate =
        totalBookingsForDisputeRate > 0
            ? Math.round((disputeMetrics.disputes_total / totalBookingsForDisputeRate) * 1000) / 10
            : 0;

    return {
        barber_id: barber.id,
        shop_id: barber.shop_id,
        provider_name: barber.name,
        provider_type: 'barber',
        rating,
        review_count: barber.review_count ?? 0,
        completed_services: metrics.completed_services,
        completed_bookings: metrics.completed_bookings,
        cancelled_bookings: metrics.cancelled_bookings,
        no_show_bookings: metrics.no_show_bookings,
        upcoming_bookings: metrics.upcoming_bookings,
        cancellation_rate_percent: metrics.cancellation_rate_percent,
        no_show_rate_percent: metrics.no_show_rate_percent,
        cash_unpaid_by_client: metrics.cash_unpaid_by_client,
        payment_refunds: metrics.payment_refunds,
        avg_booking_value: metrics.avg_booking_value,
        unique_clients: metrics.unique_clients,
        repeat_clients: metrics.repeat_clients,
        rebooking_rate_percent: metrics.rebooking_rate,
        ...disputeMetrics,
        dispute_rate_percent: disputeRate,
        platform_fees_paid: walletMetrics.platform_fees_paid,
        platform_fee_refunds: walletMetrics.platform_fee_refunds,
        platform_penalty_charges: walletMetrics.penalty_charges,
        health_score: health.score,
        health_flags: health.flags,
    };
}

export async function getAdminShopStats(shopId: string): Promise<AdminProviderStats> {
    const shop = await prisma.shops.findUnique({
        where: { id: shopId },
        select: { id: true, name: true, rating: true, review_count: true },
    });
    if (!shop) throw new Error('Shop not found');

    const bookings = await loadBookings({ shopId });
    const disputes = await loadDisputes({ shopId });
    const metrics = computeBookingMetrics(bookings);
    const disputeMetrics = computeDisputeMetrics(disputes);
    const userId = await loadWalletUserId({ shopId });
    const walletMetrics = userId
        ? await loadPlatformFeeTransactions(userId, { shopId })
        : { platform_fees_paid: 0, platform_fee_refunds: 0, penalty_charges: 0 };

    const rating = shop.rating ?? 0;
    const health = computeHealthScore(metrics, disputeMetrics, rating);

    const totalBookingsForDisputeRate =
        metrics.completed_bookings + metrics.cancelled_bookings + metrics.no_show_bookings;
    const disputeRate =
        totalBookingsForDisputeRate > 0
            ? Math.round((disputeMetrics.disputes_total / totalBookingsForDisputeRate) * 1000) / 10
            : 0;

    return {
        barber_id: null,
        shop_id: shop.id,
        provider_name: shop.name,
        provider_type: 'shop',
        rating,
        review_count: shop.review_count ?? 0,
        completed_services: metrics.completed_services,
        completed_bookings: metrics.completed_bookings,
        cancelled_bookings: metrics.cancelled_bookings,
        no_show_bookings: metrics.no_show_bookings,
        upcoming_bookings: metrics.upcoming_bookings,
        cancellation_rate_percent: metrics.cancellation_rate_percent,
        no_show_rate_percent: metrics.no_show_rate_percent,
        cash_unpaid_by_client: metrics.cash_unpaid_by_client,
        payment_refunds: metrics.payment_refunds,
        avg_booking_value: metrics.avg_booking_value,
        unique_clients: metrics.unique_clients,
        repeat_clients: metrics.repeat_clients,
        rebooking_rate_percent: metrics.rebooking_rate,
        ...disputeMetrics,
        dispute_rate_percent: disputeRate,
        platform_fees_paid: walletMetrics.platform_fees_paid,
        platform_fee_refunds: walletMetrics.platform_fee_refunds,
        platform_penalty_charges: walletMetrics.penalty_charges,
        health_score: health.score,
        health_flags: health.flags,
    };
}

export async function listAdminProvidersOverview(options: {
    limit?: number;
    offset?: number;
    sort?: 'completed' | 'health' | 'disputes' | 'name';
    type?: 'barber' | 'shop' | 'all';
}) {
    const take = Math.min(Math.max(options.limit ?? 50, 1), 200);
    const skip = Math.max(options.offset ?? 0, 0);
    const type = options.type ?? 'all';

    type OverviewRow = {
        id: string;
        type: 'barber' | 'shop';
        name: string;
        shop_id: string | null;
        rating: number;
        completed_services: number;
        cancelled_bookings: number;
        disputes_total: number;
        disputes_client_favored: number;
        cash_unpaid_by_client: number;
        health_score: number;
        health_flags: string[];
    };

    const rows: OverviewRow[] = [];

    if (type === 'barber' || type === 'all') {
        const barbers = await prisma.barbers.findMany({
            where: { status: { not: 'deleted' } },
            select: { id: true, name: true, rating: true, shop_id: true },
        });
        const barberIds = barbers.map((b) => b.id);
        const allBookings =
            barberIds.length > 0
                ? await prisma.bookings.findMany({
                      where: { barber_id: { in: barberIds } },
                      select: {
                          id: true,
                          barber_id: true,
                          status: true,
                          booking_type: true,
                          party_size: true,
                          payment_method: true,
                          payment_status: true,
                          platform_fee_status: true,
                          platform_fee_amount: true,
                          price_at_booking: true,
                          client_id: true,
                          no_show_fee_status: true,
                      },
                  })
                : [];

        const bookingsByBarber = new Map<string, typeof allBookings>();
        for (const id of barberIds) bookingsByBarber.set(id, []);
        for (const b of allBookings) {
            if (b.barber_id) bookingsByBarber.get(b.barber_id)?.push(b);
        }

        const bookingIds = allBookings.map((b) => b.id);
        const allDisputes =
            bookingIds.length > 0
                ? await prisma.disputes.findMany({
                      where: { booking_id: { in: bookingIds } },
                      select: {
                          id: true,
                          status: true,
                          resolution_outcome: true,
                          refund_amount: true,
                          booking_id: true,
                          created_at: true,
                      },
                  })
                : [];

        const bookingToBarber = new Map(allBookings.map((b) => [b.id, b.barber_id]));
        const disputesByBarber = new Map<string, typeof allDisputes>();
        for (const id of barberIds) disputesByBarber.set(id, []);
        for (const d of allDisputes) {
            const bid = bookingToBarber.get(d.booking_id);
            if (bid) disputesByBarber.get(bid)?.push(d);
        }

        for (const b of barbers) {
            const metrics = computeBookingMetrics(bookingsByBarber.get(b.id) ?? []);
            const disputeMetrics = computeDisputeMetrics(disputesByBarber.get(b.id) ?? []);
            const health = computeHealthScore(metrics, disputeMetrics, b.rating ?? 0);
            rows.push({
                id: b.id,
                type: 'barber',
                name: b.name,
                shop_id: b.shop_id,
                rating: b.rating ?? 0,
                completed_services: metrics.completed_services,
                cancelled_bookings: metrics.cancelled_bookings,
                disputes_total: disputeMetrics.disputes_total,
                disputes_client_favored: disputeMetrics.disputes_client_favored,
                cash_unpaid_by_client: metrics.cash_unpaid_by_client,
                health_score: health.score,
                health_flags: health.flags,
            });
        }
    }

    if (type === 'shop' || type === 'all') {
        const shops = await prisma.shops.findMany({
            select: { id: true, name: true, rating: true },
        });
        for (const shop of shops) {
            const bookings = await loadBookings({ shopId: shop.id });
            const disputes = await loadDisputes({ shopId: shop.id });
            const metrics = computeBookingMetrics(bookings);
            const disputeMetrics = computeDisputeMetrics(disputes);
            const health = computeHealthScore(metrics, disputeMetrics, shop.rating ?? 0);
            rows.push({
                id: shop.id,
                type: 'shop',
                name: shop.name,
                shop_id: shop.id,
                rating: shop.rating ?? 0,
                completed_services: metrics.completed_services,
                cancelled_bookings: metrics.cancelled_bookings,
                disputes_total: disputeMetrics.disputes_total,
                disputes_client_favored: disputeMetrics.disputes_client_favored,
                cash_unpaid_by_client: metrics.cash_unpaid_by_client,
                health_score: health.score,
                health_flags: health.flags,
            });
        }
    }

    const sorted = [...rows];
    if (options.sort === 'completed') {
        sorted.sort((a, b) => b.completed_services - a.completed_services);
    } else if (options.sort === 'health') {
        sorted.sort((a, b) => a.health_score - b.health_score);
    } else if (options.sort === 'disputes') {
        sorted.sort((a, b) => b.disputes_total - a.disputes_total);
    } else {
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    return {
        providers: sorted.slice(skip, skip + take),
        total: sorted.length,
    };
}

export type EnrichedDispute = {
    id: string;
    booking_id: string;
    reason: string;
    status: string;
    status_label: string;
    resolution_outcome: string | null;
    refund_amount: number | null;
    resolution_notes: string | null;
    created_at: string | null;
    resolved_at: string | null;
    barber_id: string | null;
    barber_name: string | null;
    shop_id: string | null;
    shop_name: string | null;
    client_name: string | null;
    service_name: string | null;
    booking_amount: number | null;
    date_text: string | null;
};

export function formatDisputeStatusLabel(status: string | null | undefined): string {
    const s = normalizeStatus(status);
    if (s === 'in_review') return 'In Review';
    if (s === 'resolved') return 'Resolved';
    return 'Open';
}

export async function listAdminDisputesEnriched(limit = 100): Promise<EnrichedDispute[]> {
    const disputes = await prisma.disputes.findMany({
        orderBy: { created_at: 'desc' },
        take: Math.min(limit, 200),
        include: {
            booking: {
                select: {
                    barber_id: true,
                    shop_id: true,
                    barber_name: true,
                    client_name: true,
                    service_name: true,
                    price_at_booking: true,
                    date_text: true,
                    barber: { select: { name: true } },
                    shop: { select: { name: true } },
                },
            },
        },
    });

    return disputes.map((d) => ({
        id: d.id,
        booking_id: d.booking_id,
        reason: d.reason,
        status: normalizeStatus(d.status) || 'open',
        status_label: formatDisputeStatusLabel(d.status),
        resolution_outcome: d.resolution_outcome,
        refund_amount: d.refund_amount,
        resolution_notes: d.resolution_notes,
        created_at: d.created_at,
        resolved_at: d.resolved_at,
        barber_id: d.booking?.barber_id ?? null,
        barber_name: d.booking?.barber?.name ?? d.booking?.barber_name ?? null,
        shop_id: d.booking?.shop_id ?? null,
        shop_name: d.booking?.shop?.name ?? null,
        client_name: d.booking?.client_name ?? null,
        service_name: d.booking?.service_name ?? null,
        booking_amount: d.booking?.price_at_booking ?? null,
        date_text: d.booking?.date_text ?? null,
    }));
}

export async function resolveDispute(params: {
    disputeId: string;
    adminUserId: string;
    action: 'approve_claim' | 'reject_claim' | 'request_info' | 'mark_in_review';
    resolutionNotes: string;
    refundAmount?: number;
}) {
    const dispute = await prisma.disputes.findUnique({
        where: { id: params.disputeId },
        include: { booking: { select: { client_id: true } } },
    });
    if (!dispute) throw new Error('Dispute not found');

    if (params.action === 'mark_in_review') {
        return prisma.disputes.update({
            where: { id: params.disputeId },
            data: { status: 'in_review' },
        });
    }

    if (params.action === 'request_info') {
        return prisma.disputes.update({
            where: { id: params.disputeId },
            data: {
                status: 'in_review',
                resolution_outcome: 'info_only',
                resolution_notes: params.resolutionNotes,
            },
        });
    }

    const outcome: DisputeOutcome =
        params.action === 'approve_claim' ? 'client_favored' : 'provider_favored';
    const refund =
        params.action === 'approve_claim' && params.refundAmount != null
            ? params.refundAmount
            : params.action === 'approve_claim'
              ? 0
              : null;

    return prisma.$transaction(async (tx) => {
        const updated = await tx.disputes.update({
            where: { id: params.disputeId },
            data: {
                status: 'resolved',
                resolution_outcome: outcome,
                resolution_notes: params.resolutionNotes,
                refund_amount: refund,
                resolved_at: new Date().toISOString(),
                resolved_by: params.adminUserId,
            },
        });

        if (params.action === 'approve_claim' && refund != null && refund > 0) {
            await tx.bookings.update({
                where: { id: dispute.booking_id },
                data: {
                    payment_status: 'refunded',
                    updated_at: new Date().toISOString(),
                },
            });
        }

        await tx.audit_logs.create({
            data: {
                action: 'DISPUTE_RESOLVED',
                resource_type: 'Dispute',
                resource_id: params.disputeId,
                actor_id: params.adminUserId,
                details: JSON.stringify({
                    outcome,
                    refund_amount: refund,
                    booking_id: dispute.booking_id,
                }),
            },
        });

        return updated;
    }).then(async (updated) => {
        if (outcome === 'provider_favored' && dispute.booking?.client_id) {
            const { onDisputeLost } = await import('../domain/hooks/lifecycle');
            await onDisputeLost(dispute.booking.client_id).catch(() => {});
        }
        return updated;
    });
}
