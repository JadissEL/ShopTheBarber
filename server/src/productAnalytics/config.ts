/** Product analytics event names, separate from provider webinar `platform_events`. */



export const ANALYTICS_SCHEMA_VERSION = 1;



/** Industry standard: funnel steps must complete within this window (Amplitude/Mixpanel default: 7d). */

export const FUNNEL_CONVERSION_WINDOW_HOURS = 168;



export const ANALYTICS_EVENTS = {

    VIEW_HOME: 'view_home',

    VIEW_EXPLORE: 'view_explore',

    VIEW_PROFILE: 'view_profile',

    VIEW_BARBER_PROFILE: 'view_barber_profile',

    VIEW_SHOP_PROFILE: 'view_shop_profile',

    BOOKING_STARTED: 'booking_started',

    SELECT_BOOKING_CONTEXT: 'select_booking_context',

    SELECT_SERVICE: 'select_service',

    VIEW_BOOKING_STEP: 'view_booking_step',

    CONFIRM_BOOKING_ATTEMPT: 'confirm_booking_attempt',

    BOOKING_CREATED: 'booking_created',

    BOOKING_PAID: 'booking_paid',

    MARKETPLACE_ORDER_PAID: 'marketplace_order_paid',

    FIXED_FEE_ENROLLED: 'fixed_fee_enrolled',

    USER_IDENTIFIED: 'user_identified',

} as const;



export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];



/** Canonical funnel steps for admin dashboard */

export const BOOKING_FUNNEL_STEPS = [

    { key: 'home', label: 'Homepage', events: ['view_home'] },

    { key: 'explore', label: 'Explore', events: ['view_explore'] },

    {

        key: 'profile',

        label: 'Profile',

        events: ['view_profile', 'view_barber_profile', 'view_shop_profile'],

    },

    {

        key: 'booking_started',

        label: 'Booking started',

        events: ['booking_started', 'select_booking_context', 'select_service'],

    },

    {

        key: 'booking_created',

        label: 'Booking created',

        events: ['booking_created', 'confirm_booking_attempt'],

    },

    { key: 'paid_booking', label: 'Paid booking', events: ['booking_paid'] },

] as const;



/** Map legacy / alias event names to funnel step keys */

export const FUNNEL_EVENT_ALIASES: Record<string, string> = {

    view_barber_profile: 'view_profile',

    view_shop_profile: 'view_profile',

    select_booking_context: 'booking_started',

    select_service: 'booking_started',

    confirm_booking_attempt: 'booking_created',

};



export const DEFAULT_ANALYTICS_DAYS = 30;



/** Weekly retention (early lifecycle, Stripe/Kissmetrics pattern). */

export const COHORT_RETENTION_WEEKS = [0, 1, 2, 4, 8, 12] as const;



/** Monthly retention (PMF curve, where flattening indicates product-market fit). */

export const COHORT_RETENTION_MONTHS = [0, 1, 2, 3, 6] as const;



export const LTV_BUCKETS = [

    { label: '€0-25', min: 0, max: 25 },

    { label: '€25-100', min: 25, max: 100 },

    { label: '€100-250', min: 100, max: 250 },

    { label: '€250-500', min: 250, max: 500 },

    { label: '€500+', min: 500, max: Infinity },

] as const;



/** Reference benchmarks for admin scorecards (cross-sell / attach, Prospeo 2026, marketplace guides). */

export const ANALYTICS_BENCHMARKS = {

    marketplace_attach_rate_pct: { good: 25, great: 40 },

    signup_m1_retention_pct: { good: 40, great: 60 },

    d7_retention_pct: { good: 25, great: 40 },

    provider_activation_pct: { good: 40, great: 65 },

    no_show_rate_pct: { good: 8, great: 4 },

    funnel_home_to_paid_pct: { good: 3, great: 8 },

    fixed_fee_adoption_pct: { good: 15, great: 30 },

} as const;



/** Global context keys expected on every client event (Snowplow / Amplitude pattern). */

export const GLOBAL_EVENT_PROPERTY_KEYS = [

    'schema_version',

    'platform',

    'anonymous_id',

    'referrer',

    'utm_source',

    'utm_medium',

    'utm_campaign',

] as const;


