import { prisma } from '../db/prisma';
import { getGeocodingConfig, isProductionGeocodingConfigured } from '../lib/geocoding';

export type HealthCheckResult = {
    ok: boolean;
    db: 'ok' | 'error';
    migrations: 'ok' | 'pending' | 'failed' | 'unknown';
    schema: 'ok' | 'incomplete' | 'unknown';
    version: string;
    uptime_seconds: number;
    timestamp: string;
    checks?: Record<string, boolean>;
    geocoding?: {
        provider: string;
        supports_autocomplete: boolean;
        production_ready: boolean;
    };
    error?: string;
    hint?: string;
};

const STARTED_AT = Date.now();

const SCHEMA_CHECKS: { key: string; sql: string }[] = [
    {
        key: 'offers_mobile_service',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'barbers' AND column_name = 'offers_mobile_service' LIMIT 1`,
    },
    {
        key: 'offers_shop_service',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'barbers' AND column_name = 'offers_shop_service' LIMIT 1`,
    },
    {
        key: 'provider_fixed_fee',
        sql: `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'provider_fixed_fee_plans' LIMIT 1`,
    },
    {
        key: 'promo_targeting',
        sql: `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'promo_code_targets' LIMIT 1`,
    },
    {
        key: 'sms_reminders',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'sms_reminder_sent_at' LIMIT 1`,
    },
    {
        key: 'email_reminders',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'email_reminder_sent_at' LIMIT 1`,
    },
    {
        key: 'payment_protection',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'deposit_payment_status' LIMIT 1`,
    },
    {
        key: 'booking_visit_type',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'visit_type' LIMIT 1`,
    },
    {
        key: 'offers_group_booking',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'barbers' AND column_name = 'offers_group_booking' LIMIT 1`,
    },
    {
        key: 'group_booking_guests',
        sql: `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_booking_guests' LIMIT 1`,
    },
];

async function checkMigrations(): Promise<'ok' | 'pending' | 'failed' | 'unknown'> {
    try {
        const failed = await prisma.$queryRawUnsafe<
            { migration_name: string }[]
        >(
            `SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL LIMIT 1`
        );
        if (failed.length > 0) return 'failed';

        const pending = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
            `SELECT COUNT(*)::bigint AS count FROM _prisma_migrations WHERE finished_at IS NOT NULL`
        );
        const applied = Number(pending[0]?.count ?? 0);
        if (applied < 20) return 'pending';
        return 'ok';
    } catch {
        return 'unknown';
    }
}

async function checkSchema(): Promise<{ status: 'ok' | 'incomplete' | 'unknown'; checks: Record<string, boolean> }> {
    const checks: Record<string, boolean> = {};
    try {
        for (const c of SCHEMA_CHECKS) {
            const rows = await prisma.$queryRawUnsafe<{ '?column?': number }[]>(c.sql);
            checks[c.key] = Array.isArray(rows) && rows.length > 0;
        }
        const allOk = Object.values(checks).every(Boolean);
        return { status: allOk ? 'ok' : 'incomplete', checks };
    } catch {
        return { status: 'unknown', checks };
    }
}

export async function runHealthCheck(deep = false): Promise<HealthCheckResult> {
    const base: HealthCheckResult = {
        ok: false,
        db: 'error',
        migrations: 'unknown',
        schema: 'unknown',
        version: process.env.npm_package_version || '1.0.0',
        uptime_seconds: Math.floor((Date.now() - STARTED_AT) / 1000),
        timestamp: new Date().toISOString(),
    };

    try {
        await prisma.users.findFirst({ select: { id: true } });
        base.db = 'ok';
    } catch (e: unknown) {
        base.error = e instanceof Error ? e.message : 'Database probe failed';
        base.hint = "Run 'npx prisma migrate deploy' on the API host (Neon DATABASE_URL).";
        return base;
    }

    const geoConfig = getGeocodingConfig();
    base.geocoding = {
        provider: geoConfig.provider,
        supports_autocomplete: geoConfig.supports_autocomplete,
        production_ready: isProductionGeocodingConfigured(),
    };

    if (deep) {
        base.migrations = await checkMigrations();
        const schemaResult = await checkSchema();
        base.schema = schemaResult.status;
        base.checks = schemaResult.checks;
    } else {
        base.migrations = 'unknown';
        base.schema = 'unknown';
    }

    base.ok =
        base.db === 'ok' &&
        (!deep || (base.migrations === 'ok' && base.schema === 'ok'));

    return base;
}
