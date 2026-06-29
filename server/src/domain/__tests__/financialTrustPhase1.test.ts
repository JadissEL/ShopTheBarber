import { describe, expect, it } from 'vitest';
import {
    getPlatformMinimumDeposit,
    policyDepositFromPercent,
    resolveEffectiveDeposit,
} from '../deposits/tiers';
import {
    blocksCashBookings,
    computeWalletHealthStatus,
    walletHealthWorsened,
} from '../wallet/health';
import { assertPriceAtBooking, assertNoPostConfirmPriceChange } from '../booking/priceLock';
import { isValidLedgerEventType } from '../ledger/types';

describe('deposit tiers', () => {
    it('applies platform minimum by price band', () => {
        expect(getPlatformMinimumDeposit(20)).toBe(10);
        expect(getPlatformMinimumDeposit(35)).toBe(15);
        expect(getPlatformMinimumDeposit(75)).toBe(25);
        expect(getPlatformMinimumDeposit(150)).toBe(50);
        expect(getPlatformMinimumDeposit(300)).toBe(100);
        expect(getPlatformMinimumDeposit(500)).toBe(150);
    });

    it('never allows barber deposit below platform minimum', () => {
        const deposit = resolveEffectiveDeposit({
            servicePrice: 80,
            policyDepositAmount: 10,
            depositEnabled: true,
        });
        expect(deposit).toBe(25);
    });

    it('allows barber deposit above platform minimum', () => {
        const deposit = resolveEffectiveDeposit({
            servicePrice: 80,
            policyDepositAmount: 40,
            depositEnabled: true,
        });
        expect(deposit).toBe(40);
    });

    it('returns zero when deposits disabled', () => {
        expect(
            resolveEffectiveDeposit({
                servicePrice: 100,
                policyDepositAmount: 50,
                depositEnabled: false,
            })
        ).toBe(0);
    });

    it('computes percent policy deposit', () => {
        expect(policyDepositFromPercent(100, 20)).toBe(20);
    });
});

describe('wallet health', () => {
    it('maps balance to health tiers', () => {
        expect(computeWalletHealthStatus(300)).toBe('excellent');
        expect(computeWalletHealthStatus(100)).toBe('good');
        expect(computeWalletHealthStatus(15)).toBe('warning');
        expect(computeWalletHealthStatus(-15)).toBe('critical');
        expect(computeWalletHealthStatus(-25)).toBe('blocked');
    });

    it('blocks cash at blocked tier', () => {
        expect(blocksCashBookings('blocked')).toBe(true);
        expect(blocksCashBookings('critical')).toBe(false);
    });

    it('detects worsening health tiers for email nudges', () => {
        expect(walletHealthWorsened('good', 'warning')).toBe(true);
        expect(walletHealthWorsened('warning', 'critical')).toBe(true);
        expect(walletHealthWorsened('critical', 'blocked')).toBe(true);
        expect(walletHealthWorsened('warning', 'good')).toBe(false);
        expect(walletHealthWorsened('blocked', 'blocked')).toBe(false);
    });
});

describe('price lock', () => {
    it('accepts matching price within tolerance', () => {
        expect(assertPriceAtBooking({ expectedTotal: 50, submittedPrice: 50.01 })).toBe(50.01);
    });

    it('rejects price mismatch', () => {
        expect(() =>
            assertPriceAtBooking({ expectedTotal: 50, submittedPrice: 48 })
        ).toThrow(/Price mismatch/);
    });

    it('blocks post-confirm price changes', () => {
        expect(() =>
            assertNoPostConfirmPriceChange({ lockedPrice: 50, newPrice: 60 })
        ).toThrow(/locked at booking time/);
    });
});

describe('ledger types', () => {
    it('validates reserved event types', () => {
        expect(isValidLedgerEventType('deposit_lock')).toBe(true);
        expect(isValidLedgerEventType('invalid_type')).toBe(false);
    });
});
