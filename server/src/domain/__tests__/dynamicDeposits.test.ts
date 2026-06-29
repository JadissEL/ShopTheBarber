import { describe, expect, it } from 'vitest';
import { applyDynamicDepositAdjustment } from '../deposits/dynamic';

describe('applyDynamicDepositAdjustment', () => {
    const base = {
        servicePrice: 100,
        policyDepositAmount: 50,
        depositEnabled: true,
    };

    it('reduces deposit for high reliability clients', () => {
        const adjusted = applyDynamicDepositAdjustment({
            servicePrice: 80,
            policyDepositAmount: 40,
            depositEnabled: true,
            reliabilityIndex: 95,
            reputationLevel: 'gold',
        });
        expect(adjusted).toBeLessThan(40);
        expect(adjusted).toBeGreaterThanOrEqual(25);
    });

    it('increases deposit for low reliability clients', () => {
        const adjusted = applyDynamicDepositAdjustment({
            ...base,
            reliabilityIndex: 45,
        });
        expect(adjusted).toBeGreaterThan(50);
    });

    it('never goes below platform minimum', () => {
        const adjusted = applyDynamicDepositAdjustment({
            servicePrice: 80,
            policyDepositAmount: 25,
            depositEnabled: true,
            reliabilityIndex: 99,
            reputationLevel: 'legend',
        });
        expect(adjusted).toBeGreaterThanOrEqual(25);
    });
});
