import crypto from 'crypto';
import Stripe from 'stripe';
import { prisma } from '../db/prisma';
import { getStripeApiKey, isUsableStripeApiKey } from '../config/stripeKeys';
import {
    ANNUAL_DISCOUNT_PERCENT,
    BILLING_CYCLES,
    DEFAULT_MONTHLY_FEE_BARBER,
    DEFAULT_MONTHLY_FEE_SHOP,
    ENROLLMENT_MONTHS,
    PLAN_SCOPES,
    PROVIDER_ROLES,
    type BillingCycle,
    type PlanScope,
} from './config';

export type AuthUser = { id: string; role?: string | null; full_name?: string | null; email?: string | null };

function nowIso(): string {
    return new Date().toISOString();
}

function roundMoney(n: number): number {
    return Math.round(n * 100) / 100;
}

export function isProviderRole(role?: string | null): boolean {
    return !!role && PROVIDER_ROLES.has(role);
}

export function isEnrollmentWindowOpen(at: Date = new Date()): boolean {
    const month = at.getUTCMonth() + 1;
    return (ENROLLMENT_MONTHS as readonly number[]).includes(month);
}

export function getCoverageYear(at: Date = new Date()): number {
    return at.getUTCFullYear();
}

export function endOfCoverageYear(year: number): string {
    return new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999)).toISOString();
}

export function endOfUtcMonth(at: Date): string {
    const y = at.getUTCFullYear();
    const m = at.getUTCMonth();
    return new Date(Date.UTC(y, m + 1, 0, 23, 59, 59, 999)).toISOString();
}

export async function getMonthlyFixedFeeAmount(scope: PlanScope): Promise<number> {
    const row = await prisma.pricing_rules.findFirst({ where: { is_active: true }, orderBy: { id: 'asc' } });
    if (scope === 'shop') {
        return row?.fixed_fee_monthly_shop ?? DEFAULT_MONTHLY_FEE_SHOP;
    }
    return row?.fixed_fee_monthly_barber ?? DEFAULT_MONTHLY_FEE_BARBER;
}

export function calculateFixedFeeCheckoutAmount(
    monthlyFee: number,
    billingCycle: BillingCycle
): { amount: number; discount_percent: number; months_covered: number } {
    if (billingCycle === 'annual') {
        const gross = monthlyFee * 12;
        const amount = roundMoney(gross * (1 - ANNUAL_DISCOUNT_PERCENT / 100));
        return { amount, discount_percent: ANNUAL_DISCOUNT_PERCENT, months_covered: 12 };
    }
    return { amount: roundMoney(monthlyFee), discount_percent: 0, months_covered: 1 };
}

function serializePlan(row: {
    id: string;
    user_id: string;
    shop_id: string | null;
    barber_id: string | null;
    scope: string;
    billing_cycle: string;
    coverage_year: number;
    monthly_fee_amount: number;
    total_paid: number | null;
    discount_percent: number | null;
    status: string | null;
    payment_status: string | null;
    period_start: string | null;
    period_end: string | null;
    enrolled_at: string | null;
    created_at: string | null;
}) {
    return {
        id: row.id,
        user_id: row.user_id,
        shop_id: row.shop_id,
        barber_id: row.barber_id,
        scope: row.scope,
        billing_cycle: row.billing_cycle,
        coverage_year: row.coverage_year,
        monthly_fee_amount: row.monthly_fee_amount,
        total_paid: row.total_paid ?? 0,
        discount_percent: row.discount_percent ?? 0,
        status: row.status ?? 'pending_payment',
        payment_status: row.payment_status ?? 'unpaid',
        period_start: row.period_start,
        period_end: row.period_end,
        enrolled_at: row.enrolled_at,
        created_at: row.created_at,
        commission_waived:
            row.status === 'active' &&
            row.payment_status === 'paid' &&
            !!row.period_end &&
            row.period_end >= nowIso() &&
            !!row.period_start &&
            row.period_start <= nowIso(),
    };
}

export async function getFixedFeeConfig() {
    const monthlyFeeBarber = await getMonthlyFixedFeeAmount('barber');
    const monthlyFeeShop = await getMonthlyFixedFeeAmount('shop');
    const annualBarber = calculateFixedFeeCheckoutAmount(monthlyFeeBarber, 'annual');
    const annualShop = calculateFixedFeeCheckoutAmount(monthlyFeeShop, 'annual');

    return {
        enrollment_months: ENROLLMENT_MONTHS,
        enrollment_window_open: isEnrollmentWindowOpen(),
        coverage_year: getCoverageYear(),
        annual_discount_percent: ANNUAL_DISCOUNT_PERCENT,
        billing_cycles: BILLING_CYCLES,
        scopes: PLAN_SCOPES,
        monthly_fee_barber: monthlyFeeBarber,
        monthly_fee_shop: monthlyFeeShop,
        default_monthly_fee_barber: monthlyFeeBarber,
        default_monthly_fee_shop: monthlyFeeShop,
        annual_checkout_barber: annualBarber.amount,
        annual_checkout_shop: annualShop.amount,
        currency: 'EUR',
        description:
            'Pay a fixed monthly platform fee instead of per-booking commission. Enroll only in January-March. Pay the full year upfront for 30% off.',
    };
}

export async function getFixedFeeQuote(scope: PlanScope, billingCycle: BillingCycle) {
    if (!PLAN_SCOPES.includes(scope)) throw new Error('Invalid scope');
    if (!BILLING_CYCLES.includes(billingCycle)) throw new Error('Invalid billing cycle');

    const monthlyFee = await getMonthlyFixedFeeAmount(scope);
    const { amount, discount_percent, months_covered } = calculateFixedFeeCheckoutAmount(monthlyFee, billingCycle);
    const annualFullPrice = roundMoney(monthlyFee * 12);

    return {
        scope,
        billing_cycle: billingCycle,
        coverage_year: getCoverageYear(),
        enrollment_window_open: isEnrollmentWindowOpen(),
        monthly_fee_amount: monthlyFee,
        checkout_amount: amount,
        annual_full_price: annualFullPrice,
        annual_savings: billingCycle === 'annual' ? roundMoney(annualFullPrice - amount) : 0,
        discount_percent,
        months_covered,
        currency: 'EUR',
    };
}

async function resolveBarberAndShop(userId: string, scope: PlanScope, shopId?: string) {
    const barber = await prisma.barbers.findFirst({ where: { user_id: userId } });
    if (scope === 'barber') {
        if (!barber) throw new Error('Barber profile required');
        return { barber, shopId: null as string | null };
    }
    const shop = shopId
        ? await prisma.shops.findUnique({ where: { id: shopId } })
        : await prisma.shops.findFirst({ where: { owner_id: userId } });
    if (!shop) throw new Error('Shop not found');
    if (shop.owner_id !== userId) throw new Error('Only the shop owner can enroll the shop');
    return { barber, shopId: shop.id };
}

export async function listMyFixedFeePlans(userId: string) {
    const rows = await prisma.provider_fixed_fee_plans.findMany({
        where: { user_id: userId },
        orderBy: [{ coverage_year: 'desc' }, { created_at: 'desc' }],
    });
    return rows.map(serializePlan);
}

export async function getActiveFixedFeePlanForProvider(
    userId: string,
    scope: PlanScope,
    at: Date = new Date()
): Promise<ReturnType<typeof serializePlan> | null> {
    const now = at.toISOString();
    const row = await prisma.provider_fixed_fee_plans.findFirst({
        where: {
            user_id: userId,
            scope,
            status: 'active',
            payment_status: 'paid',
            period_start: { lte: now },
            period_end: { gte: now },
        },
        orderBy: { period_end: 'desc' },
    });
    return row ? serializePlan(row) : null;
}

export async function shouldWaiveCommissionForBooking(barberId: string, shopId: string | null): Promise<boolean> {
    if (shopId) {
        const shop = await prisma.shops.findUnique({ where: { id: shopId }, select: { owner_id: true } });
        if (shop?.owner_id) {
            const shopPlan = await getActiveFixedFeePlanForProvider(shop.owner_id, 'shop');
            if (shopPlan) return true;
        }
    }
    const barber = await prisma.barbers.findUnique({ where: { id: barberId }, select: { user_id: true } });
    if (!barber?.user_id) return false;
    const barberPlan = await getActiveFixedFeePlanForProvider(barber.user_id, 'barber');
    return !!barberPlan;
}

export async function getProviderFixedFeeStatus(userId: string, role?: string | null, shopId?: string) {
    if (!isProviderRole(role)) throw new Error('Provider access only');

    const barberPlan = await getActiveFixedFeePlanForProvider(userId, 'barber');
    let shopPlan: ReturnType<typeof serializePlan> | null = null;
    let managedShopId = shopId ?? null;
    if (!managedShopId) {
        const owned = await prisma.shops.findFirst({ where: { owner_id: userId }, select: { id: true } });
        managedShopId = owned?.id ?? null;
    }
    if (managedShopId) {
        shopPlan = await getActiveFixedFeePlanForProvider(userId, 'shop');
    }

    const barberQuote = await getFixedFeeQuote('barber', 'monthly');
    const shopQuote = managedShopId ? await getFixedFeeQuote('shop', 'monthly') : null;
    const annualBarber = await getFixedFeeQuote('barber', 'annual');
    const annualShop = managedShopId ? await getFixedFeeQuote('shop', 'annual') : null;

    return {
        config: await getFixedFeeConfig(),
        enrollment_window_open: isEnrollmentWindowOpen(),
        coverage_year: getCoverageYear(),
        active: { barber: barberPlan, shop: shopPlan },
        quotes: {
            barber: { monthly: barberQuote, annual: annualBarber },
            shop: shopQuote ? { monthly: shopQuote, annual: annualShop } : null,
        },
        plans: await listMyFixedFeePlans(userId),
        commission_waived: !!(barberPlan || shopPlan),
    };
}

export async function createFixedFeeCheckout(
    userId: string,
    role: string | null | undefined,
    scope: PlanScope,
    billingCycle: BillingCycle,
    shopId?: string,
    options?: { allowRenewal?: boolean; at?: Date }
) {
    if (!isProviderRole(role)) throw new Error('Provider access required');

    const at = options?.at ?? new Date();
    const coverageYear = getCoverageYear(at);
    const isNewEnrollment = options?.allowRenewal !== true;

    if (isNewEnrollment && !isEnrollmentWindowOpen(at)) {
        throw new Error('Fixed-fee plans can only be activated between January and March');
    }

    const { barber, shopId: resolvedShopId } = await resolveBarberAndShop(userId, scope, shopId);
    const monthlyFee = await getMonthlyFixedFeeAmount(scope);
    const { amount, discount_percent } = calculateFixedFeeCheckoutAmount(monthlyFee, billingCycle);

    let existing = await prisma.provider_fixed_fee_plans.findUnique({
        where: {
            user_id_scope_coverage_year: {
                user_id: userId,
                scope,
                coverage_year: coverageYear,
            },
        },
    });

    if (existing?.status === 'active' && existing.payment_status === 'paid') {
        const now = at.toISOString();
        if (existing.period_end && existing.period_end >= now) {
            throw new Error('You already have an active fixed-fee plan for this year');
        }
    }

    const now = nowIso();
    const periodStart = at.toISOString();
    const periodEnd =
        billingCycle === 'annual' ? endOfCoverageYear(coverageYear) : endOfUtcMonth(at);

    if (!existing) {
        existing = await prisma.provider_fixed_fee_plans.create({
            data: {
                id: crypto.randomUUID(),
                user_id: userId,
                shop_id: scope === 'shop' ? resolvedShopId : null,
                barber_id: barber?.id ?? null,
                scope,
                billing_cycle: billingCycle,
                coverage_year: coverageYear,
                monthly_fee_amount: monthlyFee,
                total_paid: 0,
                discount_percent,
                status: 'pending_payment',
                payment_status: 'unpaid',
                period_start: periodStart,
                period_end: periodEnd,
                created_at: now,
                updated_at: now,
            },
        });
    } else {
        existing = await prisma.provider_fixed_fee_plans.update({
            where: { id: existing.id },
            data: {
                billing_cycle: billingCycle,
                monthly_fee_amount: monthlyFee,
                discount_percent,
                status: 'pending_payment',
                payment_status: 'unpaid',
                period_start: periodStart,
                period_end: periodEnd,
                shop_id: scope === 'shop' ? resolvedShopId : existing.shop_id,
                barber_id: barber?.id ?? existing.barber_id,
                updated_at: now,
            },
        });
    }

    const stripeKey = getStripeApiKey();
    if (!isUsableStripeApiKey(stripeKey)) {
        throw new Error('Stripe is not configured for fixed-fee payments');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-01-27.acacia' });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const label = billingCycle === 'annual' ? 'Annual fixed fee (30% off)' : 'Monthly fixed fee';

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: `ShopTheBarber, ${label}`,
                        description: `${scope} plan for ${coverageYear}. No per-booking commission while active.`,
                    },
                    unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
            },
        ],
        success_url: `${frontendUrl}/ProviderPayouts?fixedfee=success`,
        cancel_url: `${frontendUrl}/ProviderPayouts?fixedfee=cancelled`,
        metadata: {
            type: 'provider_fixed_fee',
            plan_id: existing.id,
            user_id: userId,
            scope,
            billing_cycle: billingCycle,
            coverage_year: String(coverageYear),
            amount: String(amount),
        },
    });

    await prisma.provider_fixed_fee_plans.update({
        where: { id: existing.id },
        data: { stripe_checkout_session_id: session.id, updated_at: nowIso() },
    });

    return {
        checkout_url: session.url,
        session_id: session.id,
        plan: serializePlan(existing),
        checkout_amount: amount,
        quote: await getFixedFeeQuote(scope, billingCycle),
    };
}

export async function renewMonthlyFixedFeePlan(
    userId: string,
    role: string | null | undefined,
    scope: PlanScope
) {
    const coverageYear = getCoverageYear();
    const existing = await prisma.provider_fixed_fee_plans.findUnique({
        where: {
            user_id_scope_coverage_year: {
                user_id: userId,
                scope,
                coverage_year: coverageYear,
            },
        },
    });
    if (!existing) {
        throw new Error('Enroll during January-March first');
    }
    if (existing.billing_cycle !== 'monthly') {
        throw new Error('Only monthly plans can be renewed month by month');
    }
    return createFixedFeeCheckout(userId, role, scope, 'monthly', existing.shop_id ?? undefined, {
        allowRenewal: true,
    });
}

export async function confirmFixedFeeFromCheckout(session: Stripe.Checkout.Session) {
    const planId = session.metadata?.plan_id;
    const userId = session.metadata?.user_id;
    const amountStr = session.metadata?.amount;
    if (!planId || !userId || !amountStr) {
        return { processed: false, reason: 'missing_metadata' };
    }

    const plan = await prisma.provider_fixed_fee_plans.findUnique({ where: { id: planId } });
    if (!plan || plan.user_id !== userId) {
        return { processed: false, reason: 'plan_mismatch' };
    }

    if (plan.payment_status === 'paid' && plan.status === 'active' && plan.stripe_checkout_session_id === session.id) {
        return { processed: true, reason: 'already_confirmed' };
    }

    const amount = parseFloat(amountStr);
    const now = nowIso();

    await prisma.provider_fixed_fee_plans.update({
        where: { id: planId },
        data: {
            status: 'active',
            payment_status: 'paid',
            total_paid: roundMoney((plan.total_paid ?? 0) + amount),
            stripe_checkout_session_id: session.id,
            enrolled_at: plan.enrolled_at ?? now,
            updated_at: now,
        },
    });

    await prisma.audit_logs.create({
        data: {
            action: 'FIXED_FEE_PLAN_ACTIVATED',
            resource_type: 'provider_fixed_fee_plans',
            resource_id: planId,
            actor_id: userId,
            details: JSON.stringify({
                scope: plan.scope,
                billing_cycle: plan.billing_cycle,
                coverage_year: plan.coverage_year,
                amount,
                stripe_session_id: session.id,
            }),
        },
    });

    const { trackProductEventInternal } = await import('../productAnalytics/track');
    trackProductEventInternal({
        event_name: 'fixed_fee_enrolled',
        user_id: userId,
        properties: {
            plan_id: planId,
            scope: plan.scope,
            billing_cycle: plan.billing_cycle,
            coverage_year: plan.coverage_year,
            amount_eur: amount,
            stripe_session_id: session.id,
        },
    });

    const { appendLedgerEntry } = await import('../domain/ledger/append');
    await appendLedgerEntry({
        entityType: 'provider_fixed_fee_plan',
        entityId: planId,
        eventType: 'subscription_payment',
        payload: {
            amount_eur: amount,
            scope: plan.scope,
            billing_cycle: plan.billing_cycle,
            stripe_session_id: session.id,
        },
        actorId: userId,
    }).catch(() => {});

    return { processed: true, plan_id: planId };
}

/** Mark expired plans and cancel abandoned checkouts (run on a schedule). */
export async function runFixedFeeMaintenance(at: Date = new Date()) {
    const now = at.toISOString();
    const staleCutoff = new Date(at.getTime() - 48 * 60 * 60 * 1000).toISOString();

    const expired = await prisma.provider_fixed_fee_plans.updateMany({
        where: {
            status: 'active',
            payment_status: 'paid',
            period_end: { lt: now },
        },
        data: { status: 'expired', updated_at: now },
    });

    const cancelled = await prisma.provider_fixed_fee_plans.updateMany({
        where: {
            status: 'pending_payment',
            payment_status: 'unpaid',
            created_at: { lt: staleCutoff },
        },
        data: { status: 'cancelled', updated_at: now },
    });

    return { expired: expired.count, cancelled: cancelled.count };
}

export async function listAdminFixedFeePlans(limit = 100) {
    const rows = await prisma.provider_fixed_fee_plans.findMany({
        orderBy: [{ created_at: 'desc' }],
        take: limit,
        include: {
            user: { select: { id: true, email: true, full_name: true, role: true } },
            shop: { select: { id: true, name: true } },
            barber: { select: { id: true, name: true } },
        },
    });
    return rows.map((row) => ({
        ...serializePlan(row),
        user_email: row.user?.email ?? null,
        user_name: row.user?.full_name ?? null,
        shop_name: row.shop?.name ?? null,
        barber_name: row.barber?.name ?? null,
    }));
}

export async function cancelFixedFeePlanAdmin(planId: string, adminId: string) {
    const plan = await prisma.provider_fixed_fee_plans.findUnique({ where: { id: planId } });
    if (!plan) throw new Error('Plan not found');
    if (plan.status === 'cancelled') throw new Error('Plan already cancelled');

    const now = nowIso();
    await prisma.provider_fixed_fee_plans.update({
        where: { id: planId },
        data: { status: 'cancelled', updated_at: now },
    });

    await prisma.audit_logs.create({
        data: {
            action: 'FIXED_FEE_PLAN_CANCELLED',
            resource_type: 'provider_fixed_fee_plans',
            resource_id: planId,
            actor_id: adminId,
            details: JSON.stringify({ scope: plan.scope, coverage_year: plan.coverage_year }),
        },
    });

    return { success: true, plan_id: planId };
}
