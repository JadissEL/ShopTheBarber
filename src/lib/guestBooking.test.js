import { describe, expect, it } from 'vitest';
import { normalizeGuestContact, validateGuestContact, isGuestBookingBlocked, addGuestClaimToken, getPendingGuestClaimTokens, clearPendingGuestClaimTokens } from './guestBooking';

describe('guestBooking', () => {
  it('normalizes contact fields', () => {
    expect(normalizeGuestContact({ name: '  Alex  ', phone: '+33 6 12 34 56 78' })).toEqual({
      guest_name: 'Alex',
      guest_phone: '+33 6 12 34 56 78',
      guest_email: '',
    });
  });

  it('requires name and phone', () => {
    expect(validateGuestContact({ guest_name: 'A', guest_phone: '123' })).toMatch(/name/i);
    expect(validateGuestContact({ guest_name: 'Alex', guest_phone: '123' })).toMatch(/phone/i);
    expect(validateGuestContact({ guest_name: 'Alex', guest_phone: '+33612345678' })).toBeNull();
  });

  it('validates email when provided', () => {
    expect(
      validateGuestContact({ guest_name: 'Alex', guest_phone: '+33612345678', guest_email: 'bad' })
    ).toMatch(/email/i);
    expect(
      validateGuestContact({
        guest_name: 'Alex',
        guest_phone: '+33612345678',
        guest_email: 'alex@example.com',
      })
    ).toBeNull();
  });

  it('blocks guest when cash not accepted', () => {
    const result = isGuestBookingBlocked(null, { accepts_cash: false }, 'cash_at_store');
    expect(result.blocked).toBe(true);
  });

  it('allows authenticated users regardless of card requirement', () => {
    const result = isGuestBookingBlocked({ next_step: 'save_card' }, { accepts_cash: true }, 'cash_at_store', true);
    expect(result.blocked).toBe(false);
  });

  it('blocks guest when card on file required', () => {
    const result = isGuestBookingBlocked({ next_step: 'save_card' }, { accepts_cash: true }, 'cash_at_store');
    expect(result.blocked).toBe(true);
  });

  it('allows guest pay-at-shop when no card requirement', () => {
    const result = isGuestBookingBlocked({ next_step: 'none' }, { accepts_cash: true }, 'cash_at_store');
    expect(result.blocked).toBe(false);
  });

  it('tracks pending claim tokens', () => {
    addGuestClaimToken('01234567890123456789012345678901');
    expect(getPendingGuestClaimTokens()).toContain('01234567890123456789012345678901');
    clearPendingGuestClaimTokens();
    expect(getPendingGuestClaimTokens()).toEqual([]);
  });
});
