import { describe, it, expect } from 'vitest';
import { getGroupBookingCapabilities } from '../logic';

describe('groupBooking capabilities', () => {
    it('enables group booking without VIP when flag is set', () => {
        const caps = getGroupBookingCapabilities({
            id: 'b1',
            is_vip: false,
            rating: 4.0,
            review_count: 10,
            offers_group_booking: true,
            group_booking_min_party: 2,
            group_booking_max_party: 6,
            group_booking_discount_percent: 10,
        });
        expect(caps.offers_group_booking).toBe(true);
        expect(caps.is_vip).toBe(false);
        expect(caps.min_party).toBe(2);
        expect(caps.max_party).toBe(6);
    });

    it('VIP badge is independent of group booking access', () => {
        const caps = getGroupBookingCapabilities({
            id: 'b2',
            is_vip: true,
            rating: 4.9,
            review_count: 100,
            offers_group_booking: false,
            group_booking_min_party: 2,
            group_booking_max_party: 8,
            group_booking_discount_percent: 0,
        });
        expect(caps.is_vip).toBe(true);
        expect(caps.offers_group_booking).toBe(false);
    });
});
