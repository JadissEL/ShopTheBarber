import { describe, expect, it } from 'vitest';
import { canAutoConfirmBooking } from '../booking/autoConfirmPolicy';

describe('canAutoConfirmBooking', () => {
    it('blocks when deposit is unpaid', () => {
        const result = canAutoConfirmBooking({
            deposit_amount: 25,
            deposit_payment_status: 'unpaid',
            payment_method: 'card',
        });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('unpaid_deposit');
    });

    it('blocks when authorization is missing', () => {
        const result = canAutoConfirmBooking({
            authorization_amount: 50,
            authorization_status: 'none',
            payment_method: 'card',
        });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.reason).toBe('missing_authorization');
    });

    it('allows cash_at_store when no deposit/auth due', () => {
        const result = canAutoConfirmBooking({
            payment_method: 'cash_at_store',
            deposit_amount: 0,
            payment_status: 'unpaid',
        });
        expect(result.ok).toBe(true);
    });

    it('allows when deposit is paid', () => {
        const result = canAutoConfirmBooking({
            deposit_amount: 25,
            deposit_payment_status: 'paid',
            payment_method: 'card',
        });
        expect(result.ok).toBe(true);
    });
});
