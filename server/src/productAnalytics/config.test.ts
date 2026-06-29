import { describe, it, expect } from 'vitest';
import { BOOKING_FUNNEL_STEPS, COHORT_RETENTION_WEEKS, FUNNEL_CONVERSION_WINDOW_HOURS, COHORT_RETENTION_MONTHS } from './config';

describe('productAnalytics config', () => {
    it('defines full booking funnel steps', () => {
        const keys = BOOKING_FUNNEL_STEPS.map((s) => s.key);
        expect(keys).toEqual([
            'home',
            'explore',
            'profile',
            'booking_started',
            'booking_created',
            'paid_booking',
        ]);
    });

    it('includes paid booking terminal step', () => {
        const paid = BOOKING_FUNNEL_STEPS.find((s) => s.key === 'paid_booking');
        expect(paid?.events).toContain('booking_paid');
    });

    it('cohort retention weeks include week 0 and 12', () => {
        expect(COHORT_RETENTION_WEEKS).toContain(0);
        expect(COHORT_RETENTION_WEEKS).toContain(12);
    });

    it('defines funnel conversion window and monthly cohort months', () => {
        expect(FUNNEL_CONVERSION_WINDOW_HOURS).toBe(168);
        expect(COHORT_RETENTION_MONTHS).toContain(6);
    });
});
