import { describe, it, expect } from 'vitest';
import { TIP_CONFIG } from '../tips/config';

describe('tips config', () => {
    it('defines preset percents and bounds', () => {
        expect(TIP_CONFIG.presetPercents).toEqual([15, 18, 20, 25]);
        expect(TIP_CONFIG.minAmount).toBe(1);
        expect(TIP_CONFIG.maxAmount).toBe(500);
    });
});
