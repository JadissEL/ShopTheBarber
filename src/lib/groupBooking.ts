export const GROUP_BOOKING_LABEL = 'Group booking';

export const VIP_BADGE_LABEL = 'VIP';

export function formatGroupDiscount(percent) {
    if (!percent || percent <= 0) return null;
    return `${percent}% group discount`;
}
