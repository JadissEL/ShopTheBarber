export const EVENT_TYPES = [
    { id: 'webinar', label: 'Webinar' },
    { id: 'workshop', label: 'Workshop' },
    { id: 'training', label: 'Training' },
    { id: 'networking', label: 'Networking' },
    { id: 'conference', label: 'Conference' },
] as const;

export const EVENT_FORMATS = [
    { id: 'online', label: 'Online' },
    { id: 'in_person', label: 'In person' },
    { id: 'hybrid', label: 'Hybrid' },
] as const;

export const EVENT_STATUSES = ['draft', 'published', 'cancelled', 'completed'] as const;

export const EVENT_AUDIENCES = [
    { id: 'all_providers', label: 'All providers (barbers & shop owners)' },
    { id: 'barbers', label: 'Barbers only' },
    { id: 'shop_owners', label: 'Shop owners only' },
] as const;

export const REGISTRATION_STATUSES = ['registered', 'waitlist', 'cancelled', 'attended'] as const;

export type EventType = (typeof EVENT_TYPES)[number]['id'];
export type EventFormat = (typeof EVENT_FORMATS)[number]['id'];
export type EventStatus = (typeof EVENT_STATUSES)[number];
export type EventAudience = (typeof EVENT_AUDIENCES)[number]['id'];
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const PROVIDER_ROLES = new Set(['barber', 'provider', 'shop_owner', 'admin']);
