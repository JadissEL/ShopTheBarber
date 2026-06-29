export const GROUP_BOOKING_LABEL = 'Group booking';

export const VIP_AUTO_RATING_THRESHOLD = 4.7;
export const VIP_AUTO_REVIEW_COUNT = 50;

export const DEFAULT_MIN_PARTY = 2;
export const DEFAULT_MAX_PARTY = 8;
export const ABSOLUTE_MIN_PARTY = 2;
export const ABSOLUTE_MAX_PARTY = 12;
export const MAX_GROUP_DISCOUNT_PERCENT = 25;

export type GroupGuestInput = {
    guest_name: string;
    service_ids?: string[];
    notes?: string;
};

export type GroupBookingCapabilities = {
    barber_id: string;
    is_vip: boolean;
    vip_source: 'admin' | 'earned' | null;
    offers_group_booking: boolean;
    min_party: number;
    max_party: number;
    group_discount_percent: number;
    label: string;
};
