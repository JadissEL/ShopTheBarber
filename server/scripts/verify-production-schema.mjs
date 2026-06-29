/**
 * Validates that production-critical schema objects exist after `prisma migrate deploy`.
 * Used in Render build and CI when DATABASE_URL / TEST_DATABASE_URL is set.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/** @type {{ label: string; sql: string }[]} */
const CHECKS = [
    {
        label: 'barbers.offers_mobile_service',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'barbers' AND column_name = 'offers_mobile_service' LIMIT 1`,
    },
    {
        label: 'barbers.offers_shop_service',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'barbers' AND column_name = 'offers_shop_service' LIMIT 1`,
    },
    {
        label: 'provider_fixed_fee_plans table',
        sql: `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'provider_fixed_fee_plans' LIMIT 1`,
    },
    {
        label: 'pricing_rules.fixed_fee_monthly_barber',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'pricing_rules' AND column_name = 'fixed_fee_monthly_barber' LIMIT 1`,
    },
    {
        label: 'promo_codes.audience',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'promo_codes' AND column_name = 'audience' LIMIT 1`,
    },
    {
        label: 'promo_code_targets table',
        sql: `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'promo_code_targets' LIMIT 1`,
    },
    {
        label: 'barbers.is_vip (group booking)',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'barbers' AND column_name = 'is_vip' LIMIT 1`,
    },
    {
        label: 'group_booking_guests table',
        sql: `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'group_booking_guests' LIMIT 1`,
    },
    {
        label: 'bookings.sms_reminder_sent_at',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'sms_reminder_sent_at' LIMIT 1`,
    },
    {
        label: 'bookings.email_reminder_sent_at',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'email_reminder_sent_at' LIMIT 1`,
    },
    {
        label: 'client_payment_methods table',
        sql: `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_payment_methods' LIMIT 1`,
    },
    {
        label: 'bookings.deposit_payment_status',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'deposit_payment_status' LIMIT 1`,
    },
    {
        label: 'bookings.visit_type',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'visit_type' LIMIT 1`,
    },
    {
        label: 'bookings.location_text',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'bookings' AND column_name = 'location_text' LIMIT 1`,
    },
    {
        label: 'barbers.offers_group_booking',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'barbers' AND column_name = 'offers_group_booking' LIMIT 1`,
    },
    {
        label: 'barbers.attestation_licensed',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'barbers' AND column_name = 'attestation_licensed' LIMIT 1`,
    },
    {
        label: 'shops.attestation_insured',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'shops' AND column_name = 'attestation_insured' LIMIT 1`,
    },
    {
        label: 'product_analytics_events table',
        sql: `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_analytics_events' LIMIT 1`,
    },
    {
        label: 'gift_cards table',
        sql: `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gift_cards' LIMIT 1`,
    },
    {
        label: 'ledger_entries table',
        sql: `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ledger_entries' LIMIT 1`,
    },
    {
        label: 'fraud_alerts table',
        sql: `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fraud_alerts' LIMIT 1`,
    },
    {
        label: 'partner_api_keys table',
        sql: `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'partner_api_keys' LIMIT 1`,
    },
    {
        label: 'users.auto_recharge_enabled',
        sql: `SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'auto_recharge_enabled' LIMIT 1`,
    },
    {
        label: 'wallet_reconciliation_runs table',
        sql: `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'wallet_reconciliation_runs' LIMIT 1`,
    },
];

async function main() {
    const missing = [];
    for (const check of CHECKS) {
        const rows = await prisma.$queryRawUnsafe(check.sql);
        if (!Array.isArray(rows) || rows.length === 0) {
            missing.push(check.label);
        }
    }

    const migrationRows = await prisma.$queryRawUnsafe(
        `SELECT migration_name, finished_at, rolled_back_at FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL LIMIT 5`
    );
    const failedMigrations = Array.isArray(migrationRows) ? migrationRows : [];

    if (failedMigrations.length > 0) {
        console.error('[verify-production-schema] Failed/incomplete Prisma migrations detected:');
        for (const row of failedMigrations) {
            console.error(`  - ${row.migration_name}`);
        }
        process.exit(1);
    }

    if (missing.length > 0) {
        console.error('[verify-production-schema] Missing required schema objects:');
        for (const m of missing) console.error(`  - ${m}`);
        console.error('Run: npx prisma migrate deploy');
        process.exit(1);
    }

    console.log('[verify-production-schema] OK — all production-critical schema checks passed.');
}

main()
    .catch((e) => {
        console.error('[verify-production-schema] Error:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
