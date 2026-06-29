import { prisma } from '../db/prisma';
import {
    DEFAULT_DEPOSIT_PERCENT,
    DEFAULT_NO_SHOW_FEE_PERCENT,
    DEFAULT_LATE_CANCEL_FEE_PERCENT,
    DEFAULT_LATE_CANCEL_FULL_REFUND_HOURS,
    DEFAULT_LATE_CANCEL_NO_REFUND_HOURS,
    type BookingPaymentRequirement,
    type ProviderPaymentPolicy,
} from './config';
import { DISABLED_PAYMENT_POLICY, isPaymentProtectionSchemaError } from './schemaGuard';
import {
    policyDepositFromPercent,
    resolveEffectiveDeposit,
} from '../domain/deposits/tiers';
import { applyDynamicDepositAdjustment } from '../domain/deposits/dynamic';
function roundMoney(n: number): number {
    return Math.round(n * 100) / 100;
}

type PolicyRow = {
    card_on_file_required?: boolean | null;
    booking_deposit_enabled?: boolean | null;
    booking_deposit_percent?: number | null;
    booking_deposit_flat_amount?: number | null;
    booking_auth_hold_enabled?: boolean | null;
    no_show_protection_enabled?: boolean | null;
    no_show_fee_percent?: number | null;
    no_show_fee_flat_amount?: number | null;
    late_cancel_protection_enabled?: boolean | null;
    late_cancel_full_refund_hours?: number | null;
    late_cancel_no_refund_hours?: number | null;
    late_cancel_fee_percent?: number | null;
};

function mergePolicy(barber: PolicyRow | null, shop: PolicyRow | null): ProviderPaymentPolicy {
    const pickBool = (b: boolean | null | undefined, s: boolean | null | undefined) =>
        !!(b || s);

    const pickNum = (
        b: number | null | undefined,
        s: number | null | undefined,
        fallback: number
    ) => (b != null ? b : s != null ? s : fallback);

    const pickOptionalNum = (b: number | null | undefined, s: number | null | undefined) =>
        b != null ? b : s != null ? s : null;

    return {
        card_on_file_required: pickBool(barber?.card_on_file_required, shop?.card_on_file_required),
        deposit_enabled: pickBool(barber?.booking_deposit_enabled, shop?.booking_deposit_enabled),
        deposit_percent: pickNum(
            barber?.booking_deposit_percent,
            shop?.booking_deposit_percent,
            DEFAULT_DEPOSIT_PERCENT
        ),
        deposit_flat_amount: pickOptionalNum(
            barber?.booking_deposit_flat_amount,
            shop?.booking_deposit_flat_amount
        ),
        auth_hold_enabled: pickBool(barber?.booking_auth_hold_enabled, shop?.booking_auth_hold_enabled),
        no_show_protection_enabled: pickBool(
            barber?.no_show_protection_enabled,
            shop?.no_show_protection_enabled
        ),
        no_show_fee_percent: pickOptionalNum(barber?.no_show_fee_percent, shop?.no_show_fee_percent),
        no_show_fee_flat_amount: pickOptionalNum(
            barber?.no_show_fee_flat_amount,
            shop?.no_show_fee_flat_amount
        ),
        late_cancel_protection_enabled: pickBool(
            barber?.late_cancel_protection_enabled,
            shop?.late_cancel_protection_enabled
        ),
        late_cancel_full_refund_hours: pickNum(
            barber?.late_cancel_full_refund_hours,
            shop?.late_cancel_full_refund_hours,
            DEFAULT_LATE_CANCEL_FULL_REFUND_HOURS
        ),
        late_cancel_no_refund_hours: pickNum(
            barber?.late_cancel_no_refund_hours,
            shop?.late_cancel_no_refund_hours,
            DEFAULT_LATE_CANCEL_NO_REFUND_HOURS
        ),
        late_cancel_fee_percent: pickNum(
            barber?.late_cancel_fee_percent,
            shop?.late_cancel_fee_percent,
            DEFAULT_LATE_CANCEL_FEE_PERCENT
        ),
    };
}

export async function resolveProviderPaymentPolicy(
    barberId: string,
    shopId?: string | null
): Promise<ProviderPaymentPolicy> {
    try {
        const barber = await prisma.barbers.findUnique({
            where: { id: barberId },
            select: {
                card_on_file_required: true,
                booking_deposit_enabled: true,
                booking_deposit_percent: true,
                booking_deposit_flat_amount: true,
                booking_auth_hold_enabled: true,
                no_show_protection_enabled: true,
                no_show_fee_percent: true,
                no_show_fee_flat_amount: true,
                late_cancel_protection_enabled: true,
                late_cancel_full_refund_hours: true,
                late_cancel_no_refund_hours: true,
                late_cancel_fee_percent: true,
                shop_id: true,
            },
        });
        const effectiveShopId = shopId ?? barber?.shop_id ?? null;
        const shop = effectiveShopId
            ? await prisma.shops.findUnique({
                  where: { id: effectiveShopId },
                  select: {
                      card_on_file_required: true,
                      booking_deposit_enabled: true,
                      booking_deposit_percent: true,
                      booking_deposit_flat_amount: true,
                      booking_auth_hold_enabled: true,
                      no_show_protection_enabled: true,
                      no_show_fee_percent: true,
                      no_show_fee_flat_amount: true,
                      late_cancel_protection_enabled: true,
                      late_cancel_full_refund_hours: true,
                      late_cancel_no_refund_hours: true,
                      late_cancel_fee_percent: true,
                  },
              })
            : null;

        return mergePolicy(barber, shop);
    } catch (err) {
        if (isPaymentProtectionSchemaError(err)) {
            return DISABLED_PAYMENT_POLICY;
        }
        throw err;
    }
}

export function computeDepositAmount(
    totalPrice: number,
    policy: ProviderPaymentPolicy,
    clientTrust?: { reliabilityIndex?: number; reputationLevel?: string }
): number {
    if (!policy.deposit_enabled || totalPrice <= 0) return 0;

    let policyAmount = 0;
    if (policy.deposit_flat_amount != null && policy.deposit_flat_amount > 0) {
        policyAmount = roundMoney(Math.min(policy.deposit_flat_amount, totalPrice));
    } else {
        const pct = policy.deposit_percent > 0 ? policy.deposit_percent : DEFAULT_DEPOSIT_PERCENT;
        policyAmount = policyDepositFromPercent(totalPrice, pct);
    }

    const base = resolveEffectiveDeposit({
        servicePrice: totalPrice,
        policyDepositAmount: policyAmount,
        depositEnabled: policy.deposit_enabled,
    });

    if (!clientTrust) return base;

    return applyDynamicDepositAdjustment({
        servicePrice: totalPrice,
        policyDepositAmount: policyAmount,
        depositEnabled: policy.deposit_enabled,
        reliabilityIndex: clientTrust.reliabilityIndex ?? 100,
        reputationLevel: clientTrust.reputationLevel,
    });
}
export function computeNoShowFee(totalPrice: number, policy: ProviderPaymentPolicy): number {
    if (!policy.no_show_protection_enabled || totalPrice <= 0) return 0;
    if (policy.no_show_fee_flat_amount != null && policy.no_show_fee_flat_amount > 0) {
        return roundMoney(Math.min(policy.no_show_fee_flat_amount, totalPrice));
    }
    const pct =
        policy.no_show_fee_percent != null && policy.no_show_fee_percent > 0
            ? policy.no_show_fee_percent
            : DEFAULT_NO_SHOW_FEE_PERCENT;
    return roundMoney(Math.min(totalPrice, (totalPrice * pct) / 100));
}

export async function resolveBookingPaymentRequirement(
    barberId: string,
    shopId: string | null | undefined,
    totalPrice: number,
    paymentMethod: string,
    clientHasSavedCard: boolean,
    clientId?: string | null
): Promise<BookingPaymentRequirement> {
    const policy = await resolveProviderPaymentPolicy(barberId, shopId);

    let clientTrust: { reliabilityIndex?: number; reputationLevel?: string } | undefined;
    if (clientId) {
        const client = await prisma.users.findUnique({
            where: { id: clientId },
            select: { reliability_index: true, reputation_level: true },
        }).catch(() => null);
        if (client) {
            clientTrust = {
                reliabilityIndex: client.reliability_index ?? 100,
                reputationLevel: client.reputation_level ?? 'new',
            };
        }
    }

    if (paymentMethod === 'cash_at_store') {
        const requiresCard =
            policy.card_on_file_required || policy.no_show_protection_enabled;
        return {
            policy,
            next_step: requiresCard && !clientHasSavedCard ? 'save_card' : 'none',
            deposit_amount: null,
            balance_due: totalPrice,
            authorization_amount: null,
            requires_card_on_file: requiresCard,
        };
    }

    const depositAmount = computeDepositAmount(totalPrice, policy, clientTrust);
    const requiresCard =
        policy.card_on_file_required ||
        policy.no_show_protection_enabled ||
        policy.deposit_enabled ||
        policy.auth_hold_enabled;

    if (policy.deposit_enabled && depositAmount > 0) {
        return {
            policy,
            next_step: 'deposit',
            deposit_amount: depositAmount,
            balance_due: roundMoney(totalPrice - depositAmount),
            authorization_amount: null,
            requires_card_on_file: requiresCard,
        };
    }

    if (policy.auth_hold_enabled && totalPrice > 0) {
        return {
            policy,
            next_step: 'auth_hold',
            deposit_amount: null,
            balance_due: totalPrice,
            authorization_amount: totalPrice,
            requires_card_on_file: requiresCard,
        };
    }

    if (requiresCard && !clientHasSavedCard) {
        return {
            policy,
            next_step: 'save_card',
            deposit_amount: null,
            balance_due: totalPrice,
            authorization_amount: null,
            requires_card_on_file: true,
        };
    }

    return {
        policy,
        next_step: 'full_payment',
        deposit_amount: null,
        balance_due: totalPrice,
        authorization_amount: null,
        requires_card_on_file: requiresCard,
    };
}

export function serializePolicyForPublic(policy: ProviderPaymentPolicy) {
    return {
        card_on_file_required: policy.card_on_file_required,
        deposit_enabled: policy.deposit_enabled,
        deposit_percent: policy.deposit_percent,
        deposit_flat_amount: policy.deposit_flat_amount,
        auth_hold_enabled: policy.auth_hold_enabled,
        no_show_protection_enabled: policy.no_show_protection_enabled,
        no_show_fee_percent: policy.no_show_fee_percent,
        no_show_fee_flat_amount: policy.no_show_fee_flat_amount,
        late_cancel_protection_enabled: policy.late_cancel_protection_enabled,
        late_cancel_full_refund_hours: policy.late_cancel_full_refund_hours,
        late_cancel_no_refund_hours: policy.late_cancel_no_refund_hours,
        late_cancel_fee_percent: policy.late_cancel_fee_percent,
    };
}

export type CancellationTier = 'full_refund' | 'partial_refund' | 'no_refund' | 'waived';

export type CancellationOutcome = {
    tier: CancellationTier;
    refund_percent: number;
    fee_amount: number;
    refund_amount: number;
    reason: string;
    hours_until_appointment: number | null;
};

type BookingPaymentRow = {
    status: string | null;
    start_time: string;
    price_at_booking: number | null;
    deposit_amount: number | null;
    deposit_payment_status: string | null;
    payment_status: string | null;
    authorization_status: string | null;
    authorization_amount: number | null;
};

export function getCollectedBookingAmount(booking: BookingPaymentRow): number {
    if (booking.deposit_payment_status === 'paid' && (booking.deposit_amount ?? 0) > 0) {
        return booking.deposit_amount ?? 0;
    }
    if (booking.authorization_status === 'captured' && (booking.authorization_amount ?? 0) > 0) {
        return booking.authorization_amount ?? 0;
    }
    if (booking.payment_status === 'paid' || booking.payment_status === 'partial') {
        const deposit = booking.deposit_payment_status === 'paid' ? (booking.deposit_amount ?? 0) : 0;
        const total = booking.price_at_booking ?? 0;
        return deposit > 0 ? deposit : total;
    }
    return 0;
}

export function computeCancellationOutcome(
    booking: BookingPaymentRow,
    policy: ProviderPaymentPolicy,
    cancelledBy: 'client' | 'provider',
    nowMs = Date.now()
): CancellationOutcome {
    const totalPrice = booking.price_at_booking ?? 0;
    const collected = getCollectedBookingAmount(booking);
    const startMs = new Date(booking.start_time).getTime();
    const hoursUntil =
        Number.isNaN(startMs) ? null : Math.max(0, (startMs - nowMs) / (3600 * 1000));

    if (cancelledBy === 'provider') {
        return {
            tier: 'full_refund',
            refund_percent: 100,
            fee_amount: 0,
            refund_amount: collected,
            reason: 'Provider cancelled, full refund',
            hours_until_appointment: hoursUntil,
        };
    }

    if (booking.status === 'pending') {
        return {
            tier: 'full_refund',
            refund_percent: 100,
            fee_amount: 0,
            refund_amount: collected,
            reason: 'Cancelled before confirmation, full refund',
            hours_until_appointment: hoursUntil,
        };
    }

    const protectionActive =
        policy.late_cancel_protection_enabled &&
        (policy.deposit_enabled ||
            policy.auth_hold_enabled ||
            policy.no_show_protection_enabled ||
            policy.card_on_file_required);

    if (!protectionActive) {
        return {
            tier: 'waived',
            refund_percent: 100,
            fee_amount: 0,
            refund_amount: collected,
            reason: 'No late cancellation policy, full refund of amounts paid',
            hours_until_appointment: hoursUntil,
        };
    }

    const fullHours = policy.late_cancel_full_refund_hours;
    const noRefundHours = policy.late_cancel_no_refund_hours;
    const feePct = policy.late_cancel_fee_percent;

    if (hoursUntil === null || hoursUntil >= fullHours) {
        return {
            tier: 'full_refund',
            refund_percent: 100,
            fee_amount: 0,
            refund_amount: collected,
            reason: `${Math.floor(hoursUntil ?? fullHours)}+ hours notice, full refund`,
            hours_until_appointment: hoursUntil,
        };
    }

    if (hoursUntil >= noRefundHours) {
        const serviceFee = roundMoney((totalPrice * feePct) / 100);
        const actualFee = roundMoney(collected > 0 ? Math.min(serviceFee, collected) : serviceFee);
        const refund = roundMoney(Math.max(0, collected - actualFee));
        return {
            tier: 'partial_refund',
            refund_percent: 100 - feePct,
            fee_amount: actualFee,
            refund_amount: refund,
            reason: `Late cancellation, ${feePct}% fee (€${actualFee.toFixed(2)})`,
            hours_until_appointment: hoursUntil,
        };
    }

    const actualFee = roundMoney(collected > 0 ? collected : totalPrice);
    return {
        tier: 'no_refund',
        refund_percent: 0,
        fee_amount: actualFee,
        refund_amount: 0,
        reason: `Cancelled within ${noRefundHours}h, non-refundable`,
        hours_until_appointment: hoursUntil,
    };
}
