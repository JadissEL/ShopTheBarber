export const WAITLIST_DEPOSIT_PERCENT = 20;

export const TERMS_VERSION = '2026-06-26';

export const NON_REFUNDABLE_TERMS =
    'The 20% waitlist deposit is non-refundable under all circumstances, including cancellation, program changes, or if you are not selected for enrollment.';

export const PROGRAM_STATUSES = ['draft', 'open', 'closed', 'completed', 'cancelled'] as const;

export const PROGRAM_FORMATS = [
    { id: 'online', label: 'Online' },
    { id: 'in_person', label: 'In person' },
    { id: 'hybrid', label: 'Hybrid' },
] as const;

export const WAITLIST_STATUSES = ['pending_payment', 'waitlisted', 'enrolled', 'cancelled'] as const;

export const BARBER_ROLES = new Set(['barber', 'provider']);

export type ProgramStatus = (typeof PROGRAM_STATUSES)[number];
export type WaitlistStatus = (typeof WAITLIST_STATUSES)[number];
