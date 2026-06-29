export const SUPPORT_CATEGORIES = [
    { id: 'general', label: 'General' },
    { id: 'booking', label: 'Bookings & appointments' },
    { id: 'marketplace', label: 'Marketplace & orders' },
    { id: 'payments', label: 'Payments & refunds' },
    { id: 'account', label: 'Account & profile' },
    { id: 'provider', label: 'Provider / shop tools' },
] as const;

export const SUPPORT_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number]['id'];
export type SupportStatus = (typeof SUPPORT_STATUSES)[number];
