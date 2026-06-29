/**
 * Phase 1 client late-arrival policy — see docs/specs/BOOKING_OPERATIONS.md (C1–C3).
 * No-show marking uses paymentProtection/noShow.ts (15 min grace before provider can mark).
 */

export const CLIENT_LATE_GRACE_MINUTES = 15;
export const CLIENT_LATE_NO_SHOW_ELIGIBLE_MINUTES = 30;

export type ClientLateTier = 'on_time' | 'grace' | 'no_show_eligible';

export function classifyClientLateness(minutesLate: number): ClientLateTier {
    if (minutesLate <= 0) return 'on_time';
    if (minutesLate < CLIENT_LATE_NO_SHOW_ELIGIBLE_MINUTES) return 'grace';
    return 'no_show_eligible';
}

export function canProviderMarkNoShow(minutesLate: number): boolean {
    return minutesLate >= CLIENT_LATE_GRACE_MINUTES;
}

export function clientLatePolicySummary(): string {
    return `Up to ${CLIENT_LATE_GRACE_MINUTES} min late: slot held; provider may shorten service. ${CLIENT_LATE_NO_SHOW_ELIGIBLE_MINUTES}+ min: provider may mark no-show per payment protection.`;
}
