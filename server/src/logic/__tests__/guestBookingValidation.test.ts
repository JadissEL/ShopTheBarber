import { describe, expect, it } from 'vitest';
import { validateGuestContact, normalizeGuestContact } from '../guestBookingValidation';

describe('guestBookingValidation', () => {
  it('accepts valid guest contact', () => {
    expect(
      validateGuestContact({
        guest_name: 'Marie Dupont',
        guest_phone: '+33 6 12 34 56 78',
        guest_email: 'marie@example.com',
      })
    ).toBeNull();
  });

  it('rejects short phone', () => {
    expect(
      validateGuestContact({ guest_name: 'Marie', guest_phone: '12345' })
    ).toMatch(/phone/i);
  });

  it('normalizes whitespace', () => {
    expect(
      normalizeGuestContact({ guest_name: '  Alex  ', guest_phone: ' 06 12 34 56 78  ' })
    ).toEqual({
      guest_name: 'Alex',
      guest_phone: '06 12 34 56 78',
      guest_email: null,
    });
  });
});
