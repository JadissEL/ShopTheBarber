import { prisma } from '../db/prisma';
import {
    checkPromoApplyEligibility,
    checkPromoRedeemEligibility,
    checkPromoUsageLimits,
    countPromoUses,
    loadPromoByCode,
} from '../promotions/targeting';

/**
 * Server-side promo validation against `promo_codes` + booking usage (`bookings.discount_code`).
 */

export interface PromoCodeContext {
    code: string;
    barber_id: string;
    shop_id?: string | null;
    base_price: number;
    user_id: string;
    context_type: 'shop' | 'independent';
    /** When true, skips audit log insert (e.g. preview validate endpoint). Booking flow can use false once at confirm. */
    skip_audit?: boolean;
}

export interface PromoCodeResult {
    status: 'VALID' | 'INVALID';
    reason?: string;
    message: string;
    code?: string;
    discount_amount?: number;
    final_price?: number;
    discount_text?: string;
    promotion_id?: string;
    can_apply?: boolean;
    expired_date?: string;
    times_used?: number;
}

function discountLabel(row: { discount_type: string; discount_value: number }): string {
    if (row.discount_type === 'percentage') {
        return `${row.discount_value}% off`;
    }
    return `€${row.discount_value} off`;
}

export async function validatePromoCode(context: PromoCodeContext): Promise<PromoCodeResult> {
    const { code, barber_id, shop_id = null, base_price, user_id, context_type, skip_audit = false } = context;

    if (!code || code.trim().length === 0) {
        return { status: 'INVALID', reason: 'EMPTY_CODE', message: 'Promo code is required' };
    }
    if (!barber_id) throw new Error('barber_id required');
    if (base_price === undefined || base_price <= 0) throw new Error('base_price must be > 0');
    if (!user_id) throw new Error('user_id required');
    if (!['shop', 'independent'].includes(context_type)) {
        throw new Error('context_type must be shop or independent');
    }

    const normalizedCode = code.trim().toUpperCase();
    const row = await loadPromoByCode(normalizedCode);

    if (!row) {
        return {
            status: 'INVALID',
            reason: 'CODE_NOT_FOUND',
            message: 'This promo code does not exist',
            code: normalizedCode,
        };
    }

    if (!row.is_active) {
        return {
            status: 'INVALID',
            reason: 'CODE_INACTIVE',
            message: 'This promo code is not active',
            code: normalizedCode,
        };
    }

    const redeemCheck = await checkPromoRedeemEligibility(row, { user_id });
    if (!redeemCheck.ok) {
        return {
            status: 'INVALID',
            reason: redeemCheck.reason,
            message: redeemCheck.message,
            code: normalizedCode,
        };
    }

    const { getActivePricingPolicy, validatePromoValues } = await import('../pricing/logic');
    const isPersonal =
        !!row.owner_user_id || (row.targets ?? []).some((t) => t.target_type === 'user');
    if (!isPersonal) {
        try {
            const policy = await getActivePricingPolicy();
            validatePromoValues(row.discount_type, Number(row.discount_value), policy);
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : 'Promo exceeds platform limits';
            return { status: 'INVALID', reason: 'POLICY_LIMIT', message: msg, code: normalizedCode };
        }
    }

    if (row.expiry_date) {
        const expiryDate = new Date(row.expiry_date);
        if (new Date() > expiryDate) {
            return {
                status: 'INVALID',
                reason: 'CODE_EXPIRED',
                message: `This promo code expired on ${expiryDate.toLocaleDateString()}`,
                expired_date: row.expiry_date,
                code: normalizedCode,
            };
        }
    }

    const applyCheck = await checkPromoApplyEligibility(row, {
        barber_id,
        shop_id,
        context_type,
    });
    if (!applyCheck.ok) {
        return {
            status: 'INVALID',
            reason: applyCheck.reason,
            message: applyCheck.message,
            code: normalizedCode,
        };
    }

    const usageCheck = await checkPromoUsageLimits(row, normalizedCode, user_id);
    if (!usageCheck.ok) {
        const { userUses } = await countPromoUses(normalizedCode, user_id);
        return {
            status: 'INVALID',
            reason: usageCheck.reason,
            message: usageCheck.message,
            code: normalizedCode,
            times_used: userUses,
        };
    }

    let discountAmount = 0;
    if (row.discount_type === 'percentage') {
        discountAmount = Math.round(base_price * (Number(row.discount_value) / 100) * 100) / 100;
    } else {
        discountAmount = Number(row.discount_value);
    }
    discountAmount = Math.min(discountAmount, base_price);

    if (discountAmount <= 0) {
        return {
            status: 'INVALID',
            reason: 'INVALID_DISCOUNT',
            message: 'This promo code has an invalid discount',
            code: normalizedCode,
        };
    }

    const discount_text = discountLabel(row);

    if (!skip_audit) {
        try {
            const { totalUses } = await countPromoUses(normalizedCode);
            await prisma.audit_logs.create({
                data: {
                    action: 'PROMO_CODE_VALIDATED',
                    resource_type: 'promo_code',
                    resource_id: row.id,
                    actor_id: user_id,
                    changes: JSON.stringify({
                        code: normalizedCode,
                        discount_amount: discountAmount,
                        base_price,
                    }),
                    details: JSON.stringify({
                        barber_id,
                        shop_id,
                        total_uses: totalUses + 1,
                    }),
                },
            });
        } catch {
            /* non-blocking */
        }
    }

    return {
        status: 'VALID',
        code: normalizedCode,
        discount_amount: discountAmount,
        final_price: Math.round((base_price - discountAmount) * 100) / 100,
        discount_text,
        promotion_id: row.id,
        message: `Promo code applied! You save ${discount_text}`,
        can_apply: true,
    };
}
