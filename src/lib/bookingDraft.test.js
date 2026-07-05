import { describe, it, expect, afterEach } from 'vitest';
import {
  BOOKING_DRAFT_KEY,
  buildBookingReturnPath,
  buildBookingSearchParams,
  clearBookingDraft,
  draftMatchesContext,
  loadBookingDraft,
  resolveStepFromSearch,
  saveBookingDraft,
  slugToStep,
  stepToSlug,
} from '@/lib/bookingDraft';

describe('bookingDraft', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('maps step slugs for barber-specific flow', () => {
    expect(stepToSlug(2, true)).toBe('confirm');
    expect(slugToStep('confirm', true)).toBe(2);
    expect(slugToStep('datetime', true)).toBe(1);
  });

  it('maps step slugs for discovery flow', () => {
    expect(stepToSlug(3, false)).toBe('results');
    expect(slugToStep('preferences', false)).toBe(2);
  });

  it('builds return URL with services, step, date, and at-home location', () => {
    const qs = buildBookingSearchParams({
      barberId: 'b1',
      context: 'independent',
      locationType: 'mobile',
      selectedServices: ['s1', 's2'],
      currentStep: 2,
      isSpecificBarber: true,
      selectedDate: '2026-07-04T10:00:00.000Z',
      selectedTime: '14:30',
    });
    const params = new URLSearchParams(qs);
    expect(params.get('barberId')).toBe('b1');
    expect(params.get('context')).toBe('independent');
    expect(params.get('location')).toBe('mobile');
    expect(params.get('serviceIds')).toBe('s1,s2');
    expect(params.get('step')).toBe('confirm');
    expect(params.get('date')).toBe('2026-07-04');
    expect(params.get('time')).toBe('14:30');
  });

  it('buildBookingReturnPath produces BookingFlow path', () => {
    const path = buildBookingReturnPath(
      { barberId: 'x', currentStep: 2, isSpecificBarber: true, selectedServices: ['a'] },
      (p) => `/BookingFlow`.replace('BookingFlow', p),
    );
    expect(path.startsWith('/BookingFlow?')).toBe(true);
    expect(path).toContain('barberId=x');
    expect(path).toContain('step=confirm');
  });

  it('save and load round-trip', () => {
    saveBookingDraft({
      barberId: 'b2',
      selectedServices: ['svc'],
      customerNotes: 'Fade please',
      currentStep: 2,
    });
    expect(sessionStorage.getItem(BOOKING_DRAFT_KEY)).toBeTruthy();
    const loaded = loadBookingDraft();
    expect(loaded?.barberId).toBe('b2');
    expect(loaded?.customerNotes).toBe('Fade please');
    clearBookingDraft();
    expect(loadBookingDraft()).toBeNull();
  });

  it('draftMatchesContext respects barber and shop', () => {
    const draft = { barberId: 'b1', shopId: 's1' };
    expect(draftMatchesContext(draft, { barberId: 'b1', shopId: 's1' })).toBe(true);
    expect(draftMatchesContext(draft, { barberId: 'b2', shopId: 's1' })).toBe(false);
  });

  it('resolveStepFromSearch reads step param', () => {
    expect(resolveStepFromSearch('step=confirm&barberId=1', true)).toBe(2);
    expect(resolveStepFromSearch('step=preferences', false)).toBe(2);
  });
});
