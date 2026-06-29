import { describe, it, expect } from 'vitest';
import { countCompletedServices, formatDisputeStatusLabel } from '../logic';

describe('providerStats', () => {
    it('counts individual completed bookings as 1 service each', () => {
        expect(
            countCompletedServices([
                { status: 'completed', booking_type: 'individual' },
                { status: 'completed', booking_type: 'individual' },
                { status: 'cancelled', booking_type: 'individual' },
            ])
        ).toBe(2);
    });

    it('uses party_size for group bookings', () => {
        expect(
            countCompletedServices([
                { status: 'completed', booking_type: 'group', party_size: 4 },
                { status: 'completed', booking_type: 'individual' },
            ])
        ).toBe(5);
    });

    it('defaults group party_size to 2 when missing', () => {
        expect(countCompletedServices([{ status: 'completed', booking_type: 'group' }])).toBe(2);
    });

    it('formats dispute status labels for admin UI', () => {
        expect(formatDisputeStatusLabel('open')).toBe('Open');
        expect(formatDisputeStatusLabel('in_review')).toBe('In Review');
        expect(formatDisputeStatusLabel('Resolved')).toBe('Resolved');
    });
});
