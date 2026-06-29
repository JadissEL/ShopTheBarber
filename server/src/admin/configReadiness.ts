import { isProductionGeocodingConfigured, getGeocodingConfig } from '../lib/geocoding';

export type ConfigCheck = {
    id: string;
    label: string;
    group: 'core' | 'payments' | 'observability' | 'comms' | 'ci';
    required_production: boolean;
    configured: boolean;
    hint?: string;
    dashboard_url?: string;
};

function isSet(key: string): boolean {
    const v = process.env[key];
    return typeof v === 'string' && v.trim().length > 0;
}

export function getConfigReadiness(): {
    generated_at: string;
    environment: string;
    ready_for_production: boolean;
    checks: ConfigCheck[];
    summary: { total: number; configured: number; required_missing: number };
} {
    const geo = getGeocodingConfig();
    const checks: ConfigCheck[] = [
        {
            id: 'database_url',
            label: 'DATABASE_URL (Neon)',
            group: 'core',
            required_production: true,
            configured: isSet('DATABASE_URL'),
            hint: 'Neon pooled connection string on Render',
            dashboard_url: 'https://console.neon.tech',
        },
        {
            id: 'clerk_secret',
            label: 'CLERK_SECRET_KEY',
            group: 'core',
            required_production: true,
            configured: isSet('CLERK_SECRET_KEY'),
            hint: 'Same Clerk app as VITE_CLERK_PUBLISHABLE_KEY on Vercel',
            dashboard_url: 'https://dashboard.clerk.com',
        },
        {
            id: 'frontend_url',
            label: 'FRONTEND_URL',
            group: 'core',
            required_production: true,
            configured: isSet('FRONTEND_URL'),
            hint: 'Vercel production URL, no trailing slash',
        },
        {
            id: 'upstash_url',
            label: 'UPSTASH_REDIS_REST_URL',
            group: 'core',
            required_production: true,
            configured: isSet('UPSTASH_REDIS_REST_URL'),
            dashboard_url: 'https://console.upstash.com',
        },
        {
            id: 'upstash_token',
            label: 'UPSTASH_REDIS_REST_TOKEN',
            group: 'core',
            required_production: true,
            configured: isSet('UPSTASH_REDIS_REST_TOKEN'),
        },
        {
            id: 'geocoding',
            label: 'Geocoding (Mapbox or Google)',
            group: 'core',
            required_production: true,
            configured: isProductionGeocodingConfigured(),
            hint: `Current provider: ${geo.provider}`,
        },
        {
            id: 'stripe_secret',
            label: 'STRIPE_API_KEY',
            group: 'payments',
            required_production: true,
            configured: isSet('STRIPE_API_KEY'),
            dashboard_url: 'https://dashboard.stripe.com/apikeys',
        },
        {
            id: 'stripe_publishable',
            label: 'STRIPE_PUBLISHABLE_KEY',
            group: 'payments',
            required_production: true,
            configured: isSet('STRIPE_PUBLISHABLE_KEY'),
        },
        {
            id: 'stripe_webhook',
            label: 'STRIPE_WEBHOOK_SECRET',
            group: 'payments',
            required_production: true,
            configured: isSet('STRIPE_WEBHOOK_SECRET'),
            hint: 'Stripe Webhooks /api/webhooks/stripe',
        },
        {
            id: 'sentry_dsn',
            label: 'SENTRY_DSN (API)',
            group: 'observability',
            required_production: false,
            configured: isSet('SENTRY_DSN'),
            dashboard_url: 'https://sentry.io',
        },
        {
            id: 'resend',
            label: 'RESEND_API_KEY',
            group: 'comms',
            required_production: false,
            configured: isSet('RESEND_API_KEY'),
            dashboard_url: 'https://resend.com',
        },
        {
            id: 'twilio',
            label: 'Twilio SMS (SID + token + number)',
            group: 'comms',
            required_production: false,
            configured:
                isSet('TWILIO_ACCOUNT_SID') &&
                isSet('TWILIO_AUTH_TOKEN') &&
                isSet('TWILIO_PHONE_NUMBER'),
            dashboard_url: 'https://console.twilio.com',
        },
        {
            id: 'cron_secret',
            label: 'CRON_SECRET',
            group: 'ci',
            required_production: true,
            configured: isSet('CRON_SECRET'),
            hint: 'Required on Render + GitHub (PRODUCTION_API_URL + CRON_SECRET) for SMS/reminders and financial-trust-cron',
        },
        {
            id: 'support_desk',
            label: 'SUPPORT_DESK_USER_ID',
            group: 'core',
            required_production: false,
            configured: isSet('SUPPORT_DESK_USER_ID'),
            hint: 'Admin user UUID for support ticket routing',
        },
    ];

    const requiredMissing = checks.filter((c) => c.required_production && !c.configured).length;
    const configured = checks.filter((c) => c.configured).length;

    return {
        generated_at: new Date().toISOString(),
        environment: process.env.NODE_ENV ?? 'development',
        ready_for_production: requiredMissing === 0,
        checks,
        summary: {
            total: checks.length,
            configured,
            required_missing: requiredMissing,
        },
    };
}
