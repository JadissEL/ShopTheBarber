import { describe, expect, it } from 'vitest';
import { computeCancellationOutcome } from '../policy';
import type { ProviderPaymentPolicy } from '../config';

const policy = (): ProviderPaymentPolicy => ({
    card_on_file_required: true,
    deposit_enabled: true,
    deposit_percent: 20,
    deposit_flat_amount: null,
    auth_hold_enabled: false,
    no_show_protection_enabled: true,
    no_show_fee_percent: 100,
    no_show_fee_flat_amount: null,
    late_cancel_protection_enabled: true,
    late_cancel_full_refund_hours: 24,
    late_cancel_no_refund_hours: 2,
    late_cancel_fee_percent: 50,
});

const booking = (overrides: Record<string, unknown> = {}) => ({
    status: 'confirmed',
    start_time: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    price_at_booking: 100,
    deposit_amount: 20,
    deposit_payment_status: 'paid',
    payment_status: 'partial',
    authorization_status: 'none',
    authorization_amount: null,
    ...overrides,
});

describe('computeCancellationOutcome', () => {
    it('full refund when 24+ hours notice', () => {
        const outcome = computeCancellationOutcome(booking(), policy(), 'client');
        expect(outcome.tier).toBe('full_refund');
        expect(outcome.refund_amount).toBe(20);
        expect(outcome.fee_amount).toBe(0);
    });

    it('partial refund when between 2h and 24h', () => {
        const outcome = computeCancellationOutcome(
            booking({ start_time: new Date(Date.now() + 12 * 3600 * 1000).toISOString() }),
            policy(),
            'client'
        );
        expect(outcome.tier).toBe('partial_refund');
        expect(outcome.fee_amount).toBe(20);
        expect(outcome.refund_amount).toBe(0);
    });

    it('no refund within 2 hours', () => {
        const outcome = computeCancellationOutcome(
            booking({ start_time: new Date(Date.now() + 3600 * 1000).toISOString() }),
            policy(),
            'client'
        );
        expect(outcome.tier).toBe('no_refund');
        expect(outcome.refund_amount).toBe(0);
        expect(outcome.fee_amount).toBe(20);
    });

    it('provider cancel always full refund', () => {
        const outcome = computeCancellationOutcome(
            booking({ start_time: new Date(Date.now() + 3600 * 1000).toISOString() }),
            policy(),
            'provider'
        );
        expect(outcome.tier).toBe('full_refund');
        expect(outcome.refund_amount).toBe(20);
    });
});
