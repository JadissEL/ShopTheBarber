ALTER TABLE "pricing_rules" ADD COLUMN IF NOT EXISTS "fixed_fee_monthly_barber" DOUBLE PRECISION DEFAULT 79;
ALTER TABLE "pricing_rules" ADD COLUMN IF NOT EXISTS "fixed_fee_monthly_shop" DOUBLE PRECISION DEFAULT 149;

CREATE TABLE IF NOT EXISTS "provider_fixed_fee_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "shop_id" TEXT,
    "barber_id" TEXT,
    "scope" TEXT NOT NULL,
    "billing_cycle" TEXT NOT NULL,
    "coverage_year" INTEGER NOT NULL,
    "monthly_fee_amount" DOUBLE PRECISION NOT NULL,
    "total_paid" DOUBLE PRECISION DEFAULT 0,
    "discount_percent" DOUBLE PRECISION DEFAULT 0,
    "status" TEXT DEFAULT 'pending_payment',
    "payment_status" TEXT DEFAULT 'unpaid',
    "period_start" TEXT,
    "period_end" TEXT,
    "stripe_checkout_session_id" TEXT,
    "enrolled_at" TEXT,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "provider_fixed_fee_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "provider_fixed_fee_plans_user_scope_year_key"
    ON "provider_fixed_fee_plans"("user_id", "scope", "coverage_year");
CREATE INDEX IF NOT EXISTS "provider_fixed_fee_plans_user_id_status_idx" ON "provider_fixed_fee_plans"("user_id", "status");
CREATE INDEX IF NOT EXISTS "provider_fixed_fee_plans_coverage_year_status_idx" ON "provider_fixed_fee_plans"("coverage_year", "status");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_fixed_fee_plans_user_id_fkey') THEN
        ALTER TABLE "provider_fixed_fee_plans" ADD CONSTRAINT "provider_fixed_fee_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_fixed_fee_plans_shop_id_fkey') THEN
        ALTER TABLE "provider_fixed_fee_plans" ADD CONSTRAINT "provider_fixed_fee_plans_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_fixed_fee_plans_barber_id_fkey') THEN
        ALTER TABLE "provider_fixed_fee_plans" ADD CONSTRAINT "provider_fixed_fee_plans_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "barbers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
