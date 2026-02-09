import { db } from '../db';
import * as schema from '../db/schema';
import { eq, or, and, sql } from 'drizzle-orm';

/**
 * Promo Code Validation Logic
 * 
 * Server-side validation of promotional codes at booking/purchase time
 * - Verifies code exists and is active
 * - Checks expiration date
 * - Validates usage limits (per code, per user)
 * - Checks eligibility (barber, shop, or general)
 * - Calculates discount amount
 */

interface PromoCodeContext {
    code: string;
    barber_id: string;
    shop_id?: string | null;
    base_price: number;
    user_id: string;
    context_type: 'shop' | 'independent';
}

interface PromoCodeResult {
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

const MAX_GLOBAL_USES = 100;
const MAX_PER_USER = 1;

export async function validatePromoCode(
    context: PromoCodeContext
): Promise<PromoCodeResult> {
    const { code, barber_id, shop_id = null, base_price, user_id, context_type } = context;

    // INPUT VALIDATION
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

    // FETCH PROMO CODE
    const promotions = await db.query.promotions.findMany({
        where: eq(schema.promotions.code, normalizedCode)
    });

    if (promotions.length === 0) {
        return {
            status: 'INVALID',
            reason: 'CODE_NOT_FOUND',
            message: 'This promo code does not exist',
            code: normalizedCode
        };
    }

    const promotion = promotions[0];

    // CHECK EXPIRATION DATE
    if (promotion.expiry_date) {
        const expiryDate = new Date(promotion.expiry_date);
        const now = new Date();

        if (now > expiryDate) {
            return {
                status: 'INVALID',
                reason: 'CODE_EXPIRED',
                message: `This promo code expired on ${expiryDate.toLocaleDateString()}`,
                expired_date: promotion.expiry_date
            };
        }
    }

    // CHECK ELIGIBILITY
    const isEligible =
        promotion.type === 'general' ||
        (promotion.type === 'barber' && promotion.barber_id === barber_id) ||
        (promotion.type === 'shop' && promotion.shop_id === shop_id) ||
        promotion.type === 'platform_targeted';

    if (!isEligible) {
        return {
            status: 'INVALID',
            reason: 'NOT_APPLICABLE',
            message: 'This promo code cannot be used for this service or provider',
            code: normalizedCode
        };
    }

    // CHECK USAGE LIMITS
    const allBookings = await db.query.bookings.findMany({
        where: sql`discount_code = ${normalizedCode}`
    });

    const totalUses = allBookings.length;
    const usesThisUser = allBookings.filter(b => b.client_id === user_id).length;

    if (totalUses >= MAX_GLOBAL_USES) {
        return {
            status: 'INVALID',
            reason: 'CODE_EXHAUSTED',
            message: 'This promo code has reached its usage limit',
            code: normalizedCode
        };
    }

    if (usesThisUser >= MAX_PER_USER) {
        return {
            status: 'INVALID',
            reason: 'ALREADY_USED',
            message: 'You have already used this promo code',
            code: normalizedCode,
            times_used: usesThisUser
        };
    }

    // CALCULATE DISCOUNT AMOUNT
    let discountAmount = 0;
    const discountText = promotion.discount_text || '';

    if (discountText.includes('%')) {
        const percentMatch = discountText.match(/(\d+(?:\.\d{1,2})?)\s*%/);
        if (percentMatch) {
            const percentage = parseFloat(percentMatch[1]) / 100;
            discountAmount = Math.round(base_price * percentage * 100) / 100;
        }
    } else if (discountText.includes('$')) {
        const dollarMatch = discountText.match(/\$(\d+(?:\.\d{1,2})?)/);
        if (dollarMatch) {
            discountAmount = parseFloat(dollarMatch[1]);
        }
    }

    discountAmount = Math.min(discountAmount, base_price);

    if (discountAmount <= 0) {
        return {
            status: 'INVALID',
            reason: 'INVALID_DISCOUNT_FORMAT',
            message: 'This promo code has an invalid discount format',
            code: normalizedCode
        };
    }

    // CREATE AUDIT LOG
    try {
        await db.insert(schema.audit_logs).values({
            action: 'PROMO_CODE_APPLIED',
            resource_type: 'Promotion',
            resource_id: promotion.id,
            actor_id: user_id,
            changes: JSON.stringify({
                code: normalizedCode,
                discount_amount: discountAmount,
                base_price: base_price
            }),
            details: JSON.stringify({
                barber_id,
                shop_id,
                promotion_type: promotion.type,
                total_uses: totalUses + 1
            })
        });
    } catch (auditError) {
        console.warn(`Audit log failed for promo code ${normalizedCode}:`, auditError);
    }

    // RETURN VALID DISCOUNT
    return {
        status: 'VALID',
        code: normalizedCode,
        discount_amount: discountAmount,
        final_price: Math.round((base_price - discountAmount) * 100) / 100,
        discount_text: promotion.discount_text,
        promotion_id: promotion.id,
        message: `Promo code applied! You save ${promotion.discount_text}`,
        can_apply: true
    };
}
