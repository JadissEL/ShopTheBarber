import crypto from 'crypto';
import Stripe from 'stripe';
import { addMonths } from 'date-fns';
import { prisma } from '../db/prisma';
import {
    COMMISSION_RATE_FREELANCER,
    COMMISSION_RATE_SHOP,
    DEFAULT_MINIMUM_BALANCE,
    MIN_TOP_UP_AMOUNT,
    PROVIDER_ROLES,
} from './config';
import { getStripeApiKey } from '../config/stripeKeys';
import { shouldWaiveCommissionForBooking, getActiveFixedFeePlanForProvider } from '../fixedFee/logic';
import { blocksCashBookings, computeWalletHealthStatus, walletHealthLabel } from '../domain/wallet/health';
import { syncProviderWalletHealth } from '../domain/wallet/syncHealth';
import {
    applyCreditDeduction,
    applyPromotionalCredit,
    applyPurchasedTopUp,
    normalizeWalletBuckets,
} from '../domain/wallet/credits';
import { appendLedgerEntry } from '../domain/ledger/append';

export type AuthUser = { id: string; role?: string | null };

function nowIso(): string {
    return new Date().toISOString();
}

const PROMOTIONAL_CREDIT_MONTHS = 12;

async function computeBookingsUntilEmpty(walletId: string, balance: number) {
    const recentFees = await prisma.provider_fee_transactions.findMany({
        where: { wallet_id: walletId, type: 'platform_fee' },
        orderBy: { created_at: 'desc' },
        take: 20,
        select: { amount: true },
    });
    if (recentFees.length === 0 || balance <= 0) {
        return { avg_commission_per_booking: null, bookings_until_empty: null };
    }
    const avg =
        recentFees.reduce((sum, row) => sum + Math.abs(row.amount ?? 0), 0) / recentFees.length;
    if (avg <= 0) {
        return { avg_commission_per_booking: null, bookings_until_empty: null };
    }
    return {
        avg_commission_per_booking: roundMoney(avg),
        bookings_until_empty: Math.floor(balance / avg),
    };
}

export async function searchProviderWallets(query: string) {
    const q = query.trim();
    if (q.length < 2) return [];

    const users = await prisma.users.findMany({
        where: {
            OR: [
                { email: { contains: q, mode: 'insensitive' } },
                { full_name: { contains: q, mode: 'insensitive' } },
            ],
        },
        take: 10,
        select: { id: true, email: true, full_name: true },
    });

    if (users.length === 0) return [];

    const wallets = await prisma.provider_fee_wallets.findMany({
        where: { user_id: { in: users.map((u) => u.id) } },
        include: {
            shop: { select: { id: true, name: true } },
            user: { select: { email: true, full_name: true } },
        },
    });

    const barbers = await prisma.barbers.findMany({
        where: { user_id: { in: users.map((u) => u.id) } },
        select: { user_id: true, name: true },
    });
    const barberByUser = new Map(barbers.map((b) => [b.user_id, b.name]));

    return wallets.map((wallet) => ({
        id: wallet.id,
        balance: wallet.balance ?? 0,
        currency: wallet.currency ?? 'EUR',
        shop_id: wallet.shop_id,
        shop_name: wallet.shop?.name ?? null,
        user_email: wallet.user.email,
        user_name: wallet.user.full_name ?? barberByUser.get(wallet.user_id) ?? null,
        scope: wallet.shop_id ? 'shop' : 'barber',
    }));
}

function roundMoney(n: number): number {
    return Math.round(n * 100) / 100;
}

export function isProviderRole(role?: string | null): boolean {
    return !!role && PROVIDER_ROLES.has(role);
}

export function calculatePlatformFee(price: number, shopId?: string | null): number {
    const rate = shopId ? COMMISSION_RATE_SHOP : COMMISSION_RATE_FREELANCER;
    return roundMoney(price * rate);
}

export async function calculatePlatformFeeForBooking(
    price: number,
    barberId: string,
    shopId?: string | null
): Promise<number> {
    if (await shouldWaiveCommissionForBooking(barberId, shopId ?? null)) {
        return 0;
    }
    return calculatePlatformFee(price, shopId);
}

export function parseFinancialBreakdown(raw: string | null | undefined): { platform_fee?: number } | null {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as { platform_fee?: number };
    } catch {
        return null;
    }
}

export async function platformFeeForBookingAsync(booking: {
    barber_id: string;
    price_at_booking?: number | null;
    shop_id?: string | null;
    financial_breakdown?: string | null;
}): Promise<number> {
    const fromBreakdown = parseFinancialBreakdown(booking.financial_breakdown)?.platform_fee;
    if (typeof fromBreakdown === 'number' && fromBreakdown >= 0) return roundMoney(fromBreakdown);
    const price = booking.price_at_booking ?? 0;
    return calculatePlatformFeeForBooking(price, booking.barber_id, booking.shop_id);
}

export async function resolveWalletForBooking(barberId: string, shopId?: string | null) {
    if (shopId) {
        const shop = await prisma.shops.findUnique({ where: { id: shopId }, select: { owner_id: true } });
        if (!shop?.owner_id) return null;
        return getOrCreateWallet(shop.owner_id, shopId);
    }
    const barber = await prisma.barbers.findUnique({ where: { id: barberId }, select: { user_id: true } });
    if (!barber?.user_id) return null;
    return getOrCreateWallet(barber.user_id, null);
}

export async function getOrCreateWallet(userId: string, shopId: string | null) {
    const existing = shopId
        ? await prisma.provider_fee_wallets.findFirst({ where: { shop_id: shopId } })
        : await prisma.provider_fee_wallets.findFirst({ where: { user_id: userId, shop_id: null } });

    if (existing) return existing;

    return prisma.provider_fee_wallets.create({
        data: {
            id: crypto.randomUUID(),
            user_id: userId,
            shop_id: shopId,
            balance: 0,
            currency: 'EUR',
            accepts_cash_in_store: false,
            minimum_balance: DEFAULT_MINIMUM_BALANCE,
            updated_at: nowIso(),
        },
    });
}

export async function getCashAvailability(barberId: string, shopId?: string | null) {
    const wallet = await resolveWalletForBooking(barberId, shopId ?? null);
    if (!wallet) {
        return { accepts_cash: false, reason: 'Provider wallet not available' };
    }

    const commissionWaived = await shouldWaiveCommissionForBooking(barberId, shopId ?? null);

    let acceptsCash = wallet.accepts_cash_in_store ?? false;
    if (shopId) {
        const shop = await prisma.shops.findUnique({ where: { id: shopId }, select: { accepts_cash_in_store: true } });
        acceptsCash = acceptsCash && (shop?.accepts_cash_in_store ?? false);
    } else {
        const barber = await prisma.barbers.findUnique({
            where: { id: barberId },
            select: { accepts_cash_in_store: true },
        });
        acceptsCash = acceptsCash && (barber?.accepts_cash_in_store ?? false);
    }

    const balance = wallet.balance ?? 0;
    const minBalance = wallet.minimum_balance ?? DEFAULT_MINIMUM_BALANCE;
    const balanceOk = commissionWaived || balance >= minBalance;

    return {
        accepts_cash: acceptsCash && balanceOk,
        balance,
        minimum_balance: minBalance,
        currency: wallet.currency ?? 'EUR',
        commission_rate: commissionWaived ? 0 : shopId ? COMMISSION_RATE_SHOP : COMMISSION_RATE_FREELANCER,
        commission_waived: commissionWaived,
        reason:
            !acceptsCash
                ? 'This provider has not enabled pay-at-shop (in-store) payments.'
                : !balanceOk
                  ? `Provider needs at least ${minBalance} ${wallet.currency ?? 'EUR'} prepaid commission credit.`
                  : undefined,
    };
}

export async function assertCanAcceptCashBooking(
    barberId: string,
    shopId: string | null | undefined,
    bookingPrice: number
) {
    const availability = await getCashAvailability(barberId, shopId ?? null);
    if (!availability.accepts_cash) {
        throw new Error(availability.reason ?? 'Cash payment is not available for this provider');
    }
    const wallet = await resolveWalletForBooking(barberId, shopId ?? null);
    const balance = wallet?.balance ?? 0;
    const healthStatus = computeWalletHealthStatus(balance);
    if (blocksCashBookings(healthStatus)) {
        throw new Error(
            `Cash bookings are blocked due to wallet health (${walletHealthLabel(healthStatus)}). Please top up your platform fee balance.`
        );
    }
    const fee = await calculatePlatformFeeForBooking(bookingPrice, barberId, shopId ?? null);
    if (fee > 0 && balance < fee) {
        throw new Error(
            `Provider prepaid balance is too low to cover the platform fee (${fee} ${wallet?.currency ?? 'EUR'} required).`
        );
    }
    return { platform_fee: fee, wallet_id: wallet!.id };
}

export async function getProviderWalletDashboard(userId: string, role?: string | null, shopId?: string | null) {
    if (!isProviderRole(role)) throw new Error('Provider access only');

    const barberWallet = await getOrCreateWallet(userId, null);
    let shopWallet = null as Awaited<ReturnType<typeof getOrCreateWallet>> | null;
    let managedShopId = shopId ?? null;

    if (!managedShopId) {
        const ownedShop = await prisma.shops.findFirst({ where: { owner_id: userId }, select: { id: true } });
        managedShopId = ownedShop?.id ?? null;
    }

    if (managedShopId) {
        shopWallet = await getOrCreateWallet(userId, managedShopId);
    }

    const barber = await prisma.barbers.findFirst({ where: { user_id: userId }, select: { accepts_cash_in_store: true } });
    const shop = managedShopId
        ? await prisma.shops.findUnique({ where: { id: managedShopId }, select: { accepts_cash_in_store: true, name: true } })
        : null;

    const activeWallet = shopWallet ?? barberWallet;
    const transactions = await prisma.provider_fee_transactions.findMany({
        where: { wallet_id: activeWallet.id },
        orderBy: { created_at: 'desc' },
        take: 50,
    });

    const barberPlan = await getActiveFixedFeePlanForProvider(userId, 'barber');
    const shopPlan = managedShopId ? await getActiveFixedFeePlanForProvider(userId, 'shop') : null;
    const burnRate = await computeBookingsUntilEmpty(activeWallet.id, activeWallet.balance ?? 0);

    return {
        barber_wallet: serializeWallet(barberWallet, barber?.accepts_cash_in_store ?? false, !!barberPlan),
        shop_wallet: shopWallet
            ? { ...serializeWallet(shopWallet, shop?.accepts_cash_in_store ?? false, !!shopPlan), shop_name: shop?.name }
            : null,
        active_scope: shopWallet ? 'shop' : 'barber',
        burn_rate: burnRate,
        transactions: transactions.map((t) => ({
            id: t.id,
            amount: t.amount,
            type: t.type,
            description: t.description,
            booking_id: t.booking_id,
            created_at: t.created_at,
        })),
        commission_rates: {
            shop: COMMISSION_RATE_SHOP,
            freelancer: COMMISSION_RATE_FREELANCER,
        },
        fixed_fee: {
            barber: barberPlan,
            shop: shopPlan,
        },
        min_top_up: MIN_TOP_UP_AMOUNT,
    };
}

function serializeWallet(
    wallet: {
        id: string;
        balance: number | null;
        currency: string | null;
        accepts_cash_in_store: boolean | null;
        minimum_balance: number | null;
        shop_id: string | null;
        health_status?: string | null;
        promotional_balance?: number | null;
        purchased_balance?: number | null;
        promotional_expires_at?: string | null;
    },
    entityAcceptsCash: boolean,
    commissionWaived = false
) {
    const balance = wallet.balance ?? 0;
    const min = wallet.minimum_balance ?? DEFAULT_MINIMUM_BALANCE;
    const healthStatus = (wallet.health_status as ReturnType<typeof computeWalletHealthStatus>) ||
        computeWalletHealthStatus(balance);
    return {
        id: wallet.id,
        balance,
        currency: wallet.currency ?? 'EUR',
        accepts_cash_in_store: (wallet.accepts_cash_in_store ?? false) && entityAcceptsCash,
        wallet_accepts_cash: wallet.accepts_cash_in_store ?? false,
        entity_accepts_cash: entityAcceptsCash,
        minimum_balance: min,
        can_enable_cash: commissionWaived || balance >= min,
        commission_waived: commissionWaived,
        shop_id: wallet.shop_id,
        health_status: healthStatus,
        health_label: walletHealthLabel(healthStatus),
        promotional_balance: wallet.promotional_balance ?? 0,
        purchased_balance: wallet.purchased_balance ?? 0,
        promotional_expires_at: wallet.promotional_expires_at ?? null,
        cash_blocked: blocksCashBookings(healthStatus),
    };
}

export async function updateCashSettings(
    userId: string,
    role: string | null | undefined,
    input: { accepts_cash_in_store: boolean; scope: 'barber' | 'shop'; shop_id?: string }
) {
    if (!isProviderRole(role)) throw new Error('Provider access only');

    if (input.scope === 'shop') {
        const shopId = input.shop_id;
        if (!shopId) throw new Error('shop_id required for shop scope');
        const shop = await prisma.shops.findUnique({ where: { id: shopId } });
        if (!shop || shop.owner_id !== userId) throw new Error('Only the shop owner can change shop cash settings');

        const wallet = await getOrCreateWallet(userId, shopId);
        if (input.accepts_cash_in_store) {
            const waived = !!(await getActiveFixedFeePlanForProvider(userId, 'shop'));
            if (!waived) {
                const balance = wallet.balance ?? 0;
                const min = wallet.minimum_balance ?? DEFAULT_MINIMUM_BALANCE;
                if (balance < min) {
                    throw new Error(`Top up at least ${min} ${wallet.currency ?? 'EUR'} before enabling cash bookings`);
                }
            }
        }

        await prisma.provider_fee_wallets.update({
            where: { id: wallet.id },
            data: { accepts_cash_in_store: input.accepts_cash_in_store, updated_at: nowIso() },
        });
        await prisma.shops.update({
            where: { id: shopId },
            data: { accepts_cash_in_store: input.accepts_cash_in_store, updated_at: nowIso() },
        });
        return { success: true, scope: 'shop' };
    }

    const barber = await prisma.barbers.findFirst({ where: { user_id: userId } });
    if (!barber) throw new Error('Complete your barber profile first');

    const wallet = await getOrCreateWallet(userId, null);
    if (input.accepts_cash_in_store) {
        const waived = !!(await getActiveFixedFeePlanForProvider(userId, 'barber'));
        if (!waived) {
            const balance = wallet.balance ?? 0;
            const min = wallet.minimum_balance ?? DEFAULT_MINIMUM_BALANCE;
            if (balance < min) {
                throw new Error(`Top up at least ${min} ${wallet.currency ?? 'EUR'} before enabling cash bookings`);
            }
        }
    }

    await prisma.provider_fee_wallets.update({
        where: { id: wallet.id },
        data: { accepts_cash_in_store: input.accepts_cash_in_store, updated_at: nowIso() },
    });
    await prisma.barbers.update({
        where: { id: barber.id },
        data: { accepts_cash_in_store: input.accepts_cash_in_store, updated_at: nowIso() },
    });
    return { success: true, scope: 'barber' };
}

export async function createTopUpCheckoutSession(userId: string, amount: number, scope: 'barber' | 'shop', shopId?: string) {
    if (amount < MIN_TOP_UP_AMOUNT) {
        throw new Error(`Minimum top-up is ${MIN_TOP_UP_AMOUNT}`);
    }

    const wallet =
        scope === 'shop' && shopId
            ? await getOrCreateWallet(userId, shopId)
            : await getOrCreateWallet(userId, null);

    if (scope === 'shop' && shopId) {
        const shop = await prisma.shops.findUnique({ where: { id: shopId } });
        if (!shop || shop.owner_id !== userId) throw new Error('Forbidden');
    }

    const stripeKey = getStripeApiKey();
    if (!stripeKey?.startsWith('sk_')) {
        throw new Error('Stripe is not configured for top-ups');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: (wallet.currency ?? 'eur').toLowerCase(),
                    product_data: {
                        name: 'ShopTheBarber, Platform fee balance',
                        description: 'Prepaid commission credit for pay-at-shop bookings (cash or shop POS)',
                    },
                    unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
            },
        ],
        success_url: `${frontendUrl}/ProviderPayouts?topup=success`,
        cancel_url: `${frontendUrl}/ProviderPayouts?topup=cancelled`,
        metadata: {
            type: 'provider_wallet_topup',
            wallet_id: wallet.id,
            user_id: userId,
            amount: String(amount),
        },
    });

    return { url: session.url, session_id: session.id };
}

export async function creditWalletFromTopUp(session: Stripe.Checkout.Session) {
    const walletId = session.metadata?.wallet_id;
    const userId = session.metadata?.user_id;
    const amountStr = session.metadata?.amount;
    if (!walletId || !userId || !amountStr) {
        return { processed: false, reason: 'missing_metadata' };
    }

    const existing = await prisma.provider_fee_transactions.findFirst({
        where: { stripe_checkout_session_id: session.id },
    });
    if (existing) return { processed: true, reason: 'already_credited' };

    const amount = parseFloat(amountStr);
    if (!Number.isFinite(amount) || amount <= 0) {
        return { processed: false, reason: 'invalid_amount' };
    }

    const wallet = await prisma.provider_fee_wallets.findUnique({ where: { id: walletId } });
    if (!wallet || wallet.user_id !== userId) {
        return { processed: false, reason: 'wallet_mismatch' };
    }

    const buckets = normalizeWalletBuckets(wallet);
    const nextBuckets = applyPurchasedTopUp(buckets, amount);
    await prisma.provider_fee_wallets.update({
        where: { id: walletId },
        data: {
            balance: nextBuckets.balance,
            purchased_balance: nextBuckets.purchased_balance,
            promotional_balance: nextBuckets.promotional_balance,
            updated_at: nowIso(),
        },
    });
    await syncProviderWalletHealth(walletId);
    await prisma.provider_fee_transactions.create({
        data: {
            id: crypto.randomUUID(),
            wallet_id: walletId,
            user_id: userId,
            amount,
            type: 'top_up',
            stripe_checkout_session_id: session.id,
            description: `Wallet top-up via Stripe`,
            created_at: nowIso(),
        },
    });

    await appendLedgerEntry({
        entityType: 'provider_fee_wallet',
        entityId: walletId,
        eventType: 'recharge',
        payload: { amount, purchased_balance: nextBuckets.purchased_balance, source: 'stripe_top_up' },
        actorId: userId,
    }).catch(() => { /* non-blocking */ });

    await appendLedgerEntry({
        entityType: 'provider_fee_wallet',
        entityId: walletId,
        eventType: 'top_up',
        payload: { amount, purchased_balance: nextBuckets.purchased_balance },
        actorId: userId,
    }).catch(() => { /* non-blocking legacy mapping */ });

    return { processed: true, wallet_id: walletId, new_balance: nextBuckets.balance };
}

export async function deductPlatformFeeForCashBooking(bookingId: string) {
    const booking = await prisma.bookings.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error('Booking not found');
    if (booking.payment_method !== 'cash_at_store') {
        return { skipped: true, reason: 'not_cash_booking' };
    }
    if (booking.platform_fee_status === 'paid') {
        return { skipped: true, reason: 'already_paid' };
    }

    const fee = await platformFeeForBookingAsync(booking);
    if (fee <= 0) {
        await prisma.bookings.update({
            where: { id: bookingId },
            data: {
                platform_fee_status: 'waived',
                platform_fee_amount: 0,
                payment_status: 'cash_at_store',
                updated_at: nowIso(),
            },
        });
        return { skipped: false, fee: 0, reason: 'fixed_fee_plan' };
    }

    const wallet = await resolveWalletForBooking(booking.barber_id, booking.shop_id);
    if (!wallet) throw new Error('Provider wallet not found');

    const buckets = normalizeWalletBuckets(wallet);
    if (buckets.balance < fee) {
        throw new Error(
            `Insufficient prepaid balance (${buckets.balance} ${wallet.currency ?? 'EUR'}). Top up to confirm cash bookings.`
        );
    }

    const deduction = applyCreditDeduction(buckets, fee);
    await prisma.provider_fee_wallets.update({
        where: { id: wallet.id },
        data: {
            balance: deduction.buckets.balance,
            promotional_balance: deduction.buckets.promotional_balance,
            purchased_balance: deduction.buckets.purchased_balance,
            updated_at: nowIso(),
        },
    });
    await syncProviderWalletHealth(wallet.id);
    await prisma.provider_fee_transactions.create({
        data: {
            id: crypto.randomUUID(),
            wallet_id: wallet.id,
            user_id: wallet.user_id,
            amount: -fee,
            type: 'platform_fee',
            booking_id: bookingId,
            description: `Platform fee, booking ${bookingId.slice(0, 8)}`,
            created_at: nowIso(),
        },
    });
    await appendLedgerEntry({
        entityType: 'provider_fee_wallet',
        entityId: wallet.id,
        eventType: 'platform_fee',
        payload: {
            booking_id: bookingId,
            fee,
            from_promotional: deduction.from_promotional,
            from_purchased: deduction.from_purchased,
        },
        actorId: wallet.user_id,
    }).catch(() => { /* non-blocking */ });
    await prisma.bookings.update({
        where: { id: bookingId },
        data: {
            platform_fee_status: 'paid',
            platform_fee_amount: fee,
            payment_status: 'cash_at_store',
            updated_at: nowIso(),
        },
    });

    return { success: true, fee_deducted: fee, new_balance: deduction.buckets.balance };
}

export async function confirmCashBookingAsProvider(bookingId: string, userId: string, role?: string | null) {
    if (!isProviderRole(role)) throw new Error('Forbidden');

    const booking = await prisma.bookings.findUnique({
        where: { id: bookingId },
        include: { barber: { select: { user_id: true } }, shop: { select: { owner_id: true } } },
    });
    if (!booking) throw new Error('Booking not found');

    const isBarber = booking.barber?.user_id === userId;
    const isShopOwner = booking.shop?.owner_id === userId;
    if (!isBarber && !isShopOwner && role !== 'admin') {
        throw new Error('You cannot confirm this booking');
    }

    if (booking.payment_method === 'cash_at_store') {
        await deductPlatformFeeForCashBooking(bookingId);
    }

    await prisma.bookings.update({
        where: { id: bookingId },
        data: { status: 'confirmed', updated_at: nowIso() },
    });

    return { success: true, booking_id: bookingId, status: 'confirmed' };
}

export async function refundPlatformFeeOnCancel(bookingId: string) {
    const booking = await prisma.bookings.findUnique({ where: { id: bookingId } });
    if (!booking || booking.platform_fee_status !== 'paid' || !booking.platform_fee_amount) {
        return { skipped: true };
    }

    const wallet = await resolveWalletForBooking(booking.barber_id, booking.shop_id);
    if (!wallet) return { skipped: true };

    const refund = booking.platform_fee_amount;
    const buckets = normalizeWalletBuckets(wallet);
    const nextBuckets = applyPurchasedTopUp(buckets, refund);
    await prisma.provider_fee_wallets.update({
        where: { id: wallet.id },
        data: {
            balance: nextBuckets.balance,
            promotional_balance: nextBuckets.promotional_balance,
            purchased_balance: nextBuckets.purchased_balance,
            updated_at: nowIso(),
        },
    });
    await syncProviderWalletHealth(wallet.id);
    await prisma.provider_fee_transactions.create({
        data: {
            id: crypto.randomUUID(),
            wallet_id: wallet.id,
            user_id: wallet.user_id,
            amount: refund,
            type: 'fee_refund',
            booking_id: bookingId,
            description: `Platform fee refund, cancelled booking`,
            created_at: nowIso(),
        },
    });
    await appendLedgerEntry({
        entityType: 'provider_fee_wallet',
        entityId: wallet.id,
        eventType: 'fee_refund',
        payload: { booking_id: bookingId, amount: refund },
        actorId: wallet.user_id,
    }).catch(() => { /* non-blocking */ });
    await prisma.bookings.update({
        where: { id: bookingId },
        data: { platform_fee_status: 'refunded', updated_at: nowIso() },
    });
    return { refunded: refund };
}

export async function grantPromotionalCredit(params: {
    walletId: string;
    amount: number;
    reason?: string | null;
    actorId: string;
}) {
    if (!Number.isFinite(params.amount) || params.amount <= 0) {
        throw new Error('Amount must be greater than zero');
    }

    const wallet = await prisma.provider_fee_wallets.findUnique({ where: { id: params.walletId } });
    if (!wallet) throw new Error('Wallet not found');

    const buckets = normalizeWalletBuckets(wallet);
    const nextBuckets = applyPromotionalCredit(buckets, params.amount);
    const grantExpiry = addMonths(new Date(), PROMOTIONAL_CREDIT_MONTHS).toISOString();
    const promotionalExpiresAt =
        wallet.promotional_expires_at &&
        new Date(wallet.promotional_expires_at).getTime() > Date.now()
            ? new Date(
                  Math.max(
                      new Date(wallet.promotional_expires_at).getTime(),
                      new Date(grantExpiry).getTime()
                  )
              ).toISOString()
            : grantExpiry;

    await prisma.provider_fee_wallets.update({
        where: { id: wallet.id },
        data: {
            balance: nextBuckets.balance,
            promotional_balance: nextBuckets.promotional_balance,
            purchased_balance: nextBuckets.purchased_balance,
            promotional_expires_at: promotionalExpiresAt,
            updated_at: nowIso(),
        },
    });
    await syncProviderWalletHealth(wallet.id);

    await prisma.provider_fee_transactions.create({
        data: {
            id: crypto.randomUUID(),
            wallet_id: wallet.id,
            user_id: wallet.user_id,
            amount: params.amount,
            type: 'promotional_credit',
            description: params.reason?.trim() || 'Promotional platform credit',
            created_at: nowIso(),
        },
    });

    await appendLedgerEntry({
        entityType: 'provider_fee_wallet',
        entityId: wallet.id,
        eventType: 'promotional_credit',
        payload: {
            amount: params.amount,
            promotional_balance: nextBuckets.promotional_balance,
            promotional_expires_at: promotionalExpiresAt,
            reason: params.reason ?? null,
        },
        actorId: params.actorId,
    }).catch(() => { /* non-blocking */ });

    return {
        wallet_id: wallet.id,
        new_balance: nextBuckets.balance,
        promotional_balance: nextBuckets.promotional_balance,
        purchased_balance: nextBuckets.purchased_balance,
        promotional_expires_at: promotionalExpiresAt,
    };
}
