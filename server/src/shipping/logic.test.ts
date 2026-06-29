import { describe, it, expect } from 'vitest';
import { computeShippingAmount, PLATFORM_FREE_SHIPPING_MIN, PLATFORM_FLAT_SHIPPING } from '../shipping/logic';

describe('shipping logic', () => {
    it('free shipping at or above threshold', () => {
        expect(computeShippingAmount(PLATFORM_FREE_SHIPPING_MIN)).toBe(0);
        expect(computeShippingAmount(100)).toBe(0);
    });

    it('flat shipping below threshold', () => {
        expect(computeShippingAmount(10)).toBe(PLATFORM_FLAT_SHIPPING);
    });
});
