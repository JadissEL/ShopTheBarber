import { prisma } from '../db/prisma';
import { isFinancialTrustSchemaError } from '../domain/schemaGuard';

function startOfTodayIso(): string {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d.toISOString();
}

export async function getAdminLiveFinancialMetrics() {
    try {
        const todayStart = startOfTodayIso();
        const now = new Date().toISOString();

        const [
            todayBookings,
            creditsSoldAgg,
            lowWallets,
            openFraud,
            depositsLocked,
            cancellationsToday,
            noShowsToday,
            topReferrer,
        ] = await Promise.all([
            prisma.bookings.count({
                where: { created_at: { gte: todayStart }, status: { notIn: ['cancelled'] } },
            }),
            prisma.provider_fee_transactions.aggregate({
                _sum: { amount: true },
                where: { type: 'top_up', created_at: { gte: todayStart } },
            }),
            prisma.provider_fee_wallets.count({
                where: { balance: { lt: 20 } },
            }),
            prisma.fraud_alerts.count({ where: { status: 'open' } }).catch(() => 0),
            prisma.bookings.aggregate({
                _sum: { deposit_amount: true },
                where: {
                    deposit_payment_status: { in: ['paid', 'held'] },
                    status: { in: ['pending', 'confirmed'] },
                },
            }).catch(() => ({ _sum: { deposit_amount: 0 } })),
            prisma.bookings.count({
                where: { status: 'cancelled', updated_at: { gte: todayStart } },
            }),
            prisma.bookings.count({
                where: { status: 'no_show', updated_at: { gte: todayStart } },
            }),
            prisma.referrals.groupBy({
                by: ['referrer_id'],
                where: { status: 'rewarded' },
                _count: { id: true },
                orderBy: { _count: { id: 'desc' } },
                take: 1,
            }).catch(() => []),
        ]);

        const commissionToday = await prisma.provider_fee_transactions.aggregate({
            _sum: { amount: true },
            where: { type: 'platform_fee', created_at: { gte: todayStart } },
        }).catch(() => ({ _sum: { amount: 0 } }));

        const ledgerCreditsConsumed = await prisma.ledger_entries.count({
            where: { event_type: 'commission', created_at: { gte: todayStart } },
        }).catch(() => 0);

        const topBarber = await prisma.bookings.groupBy({
            by: ['barber_id'],
            where: { status: 'completed', updated_at: { gte: todayStart } },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 1,
        }).catch(() => []);

        let topBarberName: string | null = null;
        if (topBarber[0]?.barber_id) {
            const b = await prisma.barbers.findUnique({
                where: { id: topBarber[0].barber_id },
                select: { name: true },
            });
            topBarberName = b?.name ?? null;
        }

        return {
            as_of: now,
            today_bookings: todayBookings,
            revenue_commission_today_eur: Math.abs(commissionToday._sum.amount ?? 0),
            credits_sold_today_eur: creditsSoldAgg._sum.amount ?? 0,
            credits_consumed_events_today: ledgerCreditsConsumed,
            deposits_locked_eur: depositsLocked._sum.deposit_amount ?? 0,
            cancellations_today: cancellationsToday,
            no_shows_today: noShowsToday,
            wallets_below_20: lowWallets,
            open_fraud_alerts: openFraud,
            top_barber_today: topBarberName,
            top_referrer_id: topReferrer[0]?.referrer_id ?? null,
            top_referrer_count: topReferrer[0]?._count.id ?? 0,
        };
    } catch (err) {
        if (isFinancialTrustSchemaError(err)) return { schema_pending: true };
        throw err;
    }
}

export async function getBarberFinancialDashboard(userId: string, shopId?: string | null) {
    const walletWhere = shopId ? { user_id: userId, shop_id: shopId } : { user_id: userId, shop_id: null };
    const wallet = await prisma.provider_fee_wallets.findFirst({
        where: walletWhere,
        select: {
            balance: true,
            promotional_balance: true,
            purchased_balance: true,
            health_status: true,
            promotional_expires_at: true,
        },
    });

    const barber = await prisma.barbers.findFirst({
        where: shopId ? { user_id: userId, shop_id: shopId } : { user_id: userId },
        select: { id: true },
    });

    const referralIncome = await prisma.referrals.aggregate({
        _sum: { referrer_reward_amount: true },
        where: { referrer_id: userId, status: 'rewarded' },
    }).catch(() => ({ _sum: { referrer_reward_amount: 0 } }));

    const pendingDisputes =
        barber?.id
            ? await prisma.disputes.count({
                  where: {
                      status: { notIn: ['resolved', 'withdrawn'] },
                      booking_id: {
                          in: (
                              await prisma.bookings.findMany({
                                  where: { barber_id: barber.id },
                                  select: { id: true },
                                  take: 200,
                              })
                          ).map((b) => b.id),
                      },
                  },
              }).catch(() => 0)
            : 0;

    const user = await prisma.users.findUnique({
        where: { id: userId },
        select: { auto_recharge_enabled: true, auto_recharge_threshold: true },
    });

    return {
        wallet,
        referral_income_eur: referralIncome._sum.referrer_reward_amount ?? 0,
        pending_disputes: pendingDisputes,
        auto_recharge: {
            enabled: user?.auto_recharge_enabled ?? false,
            threshold: user?.auto_recharge_threshold ?? 10,
        },
    };
}

export async function getClientDashboardPhase2(userId: string) {
    const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
            reputation_score: true,
            reputation_level: true,
            reliability_index: true,
        },
    });

    const lifetimeBookings = await prisma.bookings.count({
        where: { client_id: userId, status: 'completed' },
    });

    const referralEarnings = await prisma.referrals.aggregate({
        _sum: { referrer_reward_amount: true },
        where: { referrer_id: userId, status: 'rewarded' },
    }).catch(() => ({ _sum: { referrer_reward_amount: 0 } }));

    const walletBalance = await prisma.wallet_accounts.findUnique({
        where: { user_id: userId },
        select: { balance: true },
    });

    return {
        reputation: user,
        lifetime_bookings: lifetimeBookings,
        referral_earnings_eur: referralEarnings._sum.referrer_reward_amount ?? 0,
        wallet_balance_eur: walletBalance?.balance ?? 0,
    };
}
