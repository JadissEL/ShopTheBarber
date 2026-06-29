import { describe, it, expect } from 'vitest';
import {
    validateServicePrice,
    validatePromoValues,
    computeBundleFinalPrice,
    validateBundleWriteInput,
    isSubsetOf,
    DEFAULT_POLICY,
} from '../pricing/logic';

const policy = {
    ...DEFAULT_POLICY,
    min_service_price: 5,
    max_service_price: 500,
    max_promo_percentage: 30,
    max_promo_fixed: 75,
    max_combo_discount_percent: 35,
    min_combo_services: 2,
};

describe('pricing/logic', () => {
    it('validateServicePrice enforces platform bounds', () => {
        expect(() => validateServicePrice(4, policy)).toThrow(/at least/);
        expect(() => validateServicePrice(501, policy)).toThrow(/cannot exceed/);
        expect(() => validateServicePrice(25, policy)).not.toThrow();
    });

    it('validatePromoValues enforces max percentage and fixed', () => {
        expect(() => validatePromoValues('percentage', 31, policy)).toThrow(/30%/);
        expect(() => validatePromoValues('fixed', 80, policy)).toThrow(/\$75/);
        expect(() => validatePromoValues('percentage', 20, policy)).not.toThrow();
    });

    it('computeBundleFinalPrice requires combo below sum and within max discount', () => {
        const sum = 100;
        expect(() =>
            computeBundleFinalPrice(sum, { bundle_price: 100, discount_type: null, discount_value: null }, policy)
        ).toThrow(/lower than the sum/);
        expect(() =>
            computeBundleFinalPrice(sum, { bundle_price: 50, discount_type: null, discount_value: null }, policy)
        ).toThrow(/cannot exceed 35%/);
        expect(computeBundleFinalPrice(sum, { bundle_price: 70, discount_type: null, discount_value: null }, policy)).toBe(70);
        expect(
            computeBundleFinalPrice(sum, { bundle_price: null, discount_type: 'percentage', discount_value: 15 }, policy)
        ).toBe(85);
    });

    it('validateBundleWriteInput requires minimum services and pricing mode', () => {
        expect(() =>
            validateBundleWriteInput({ name: 'AB', service_ids: ['a'], policy })
        ).toThrow(/at least 2 services/);

        expect(() =>
            validateBundleWriteInput({ name: 'Combo', service_ids: ['a', 'b'], policy })
        ).toThrow(/combo price or a percentage/);

        const ok = validateBundleWriteInput({
            name: 'Cut + Beard',
            service_ids: ['a', 'b'],
            discount_type: 'percentage',
            discount_value: 10,
            policy,
        });
        expect(ok.service_ids).toEqual(['a', 'b']);
        expect(ok.discount_value).toBe(10);
    });

    it('isSubsetOf detects partial combo selection', () => {
        expect(isSubsetOf(['a'], ['a', 'b'])).toBe(true);
        expect(isSubsetOf(['a', 'c'], ['a', 'b'])).toBe(false);
        expect(isSubsetOf([], ['a', 'b'])).toBe(false);
    });
});
