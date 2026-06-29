import { describe, expect, it } from 'vitest';
import { computeDepositAmount, computeNoShowFee } from '../policy';
import type { ProviderPaymentPolicy } from '../config';

const basePolicy = (): ProviderPaymentPolicy => ({
    card_on_file_required: false,
    deposit_enabled: false,
    deposit_percent: 20,
    deposit_flat_amount: null,
    auth_hold_enabled: false,
    no_show_protection_enabled: false,
    no_show_fee_percent: null,
    no_show_fee_flat_amount: null,
    late_cancel_protection_enabled: true,
    late_cancel_full_refund_hours: 24,
    late_cancel_no_refund_hours: 2,
    late_cancel_fee_percent: 50,
});

describe('computeDepositAmount', () => {
    it('applies platform tier floor over lower barber percent', () => {
        const policy = { ...basePolicy(), deposit_enabled: true, deposit_percent: 25 };
        // €100 service → platform minimum €50 beats 25% (€25)
        expect(computeDepositAmount(100, policy)).toBe(50);
    });

    it('uses barber flat amount when above platform minimum', () => {
        const policy = {
            ...basePolicy(),
            deposit_enabled: true,
            deposit_flat_amount: 75,
        };
        expect(computeDepositAmount(100, policy)).toBe(75);
    });

    it('uses platform minimum when barber flat is below tier', () => {
        const policy = {
            ...basePolicy(),
            deposit_enabled: true,
            deposit_flat_amount: 15,
        };
        expect(computeDepositAmount(100, policy)).toBe(50);
    });

    it('caps deposit at total price', () => {
        const policy = {
            ...basePolicy(),
            deposit_enabled: true,
            deposit_flat_amount: 200,
        };
        expect(computeDepositAmount(50, policy)).toBe(50);
    });
});

describe('computeNoShowFee', () => {
    it('returns full service price by default when protection enabled', () => {
        const policy = { ...basePolicy(), no_show_protection_enabled: true };
        expect(computeNoShowFee(80, policy)).toBe(80);
    });

    it('uses flat fee when configured', () => {
        const policy = {
            ...basePolicy(),
            no_show_protection_enabled: true,
            no_show_fee_flat_amount: 25,
        };
        expect(computeNoShowFee(80, policy)).toBe(25);
    });
});
