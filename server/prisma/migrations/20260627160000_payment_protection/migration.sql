-- Card on file, booking deposits, auth holds, no-show protection

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "users_stripe_customer_id_key" ON "users"("stripe_customer_id");

CREATE TABLE IF NOT EXISTS "client_payment_methods" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "stripe_payment_method_id" TEXT NOT NULL,
    "card_brand" TEXT,
    "card_last4" TEXT,
    "card_exp_month" INTEGER,
    "card_exp_year" INTEGER,
    "is_default" BOOLEAN DEFAULT false,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "client_payment_methods_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "client_payment_methods_stripe_payment_method_id_key" ON "client_payment_methods"("stripe_payment_method_id");
CREATE INDEX IF NOT EXISTS "client_payment_methods_user_id_idx" ON "client_payment_methods"("user_id");

ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "card_on_file_required" BOOLEAN DEFAULT false;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "booking_deposit_enabled" BOOLEAN DEFAULT false;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "booking_deposit_percent" DOUBLE PRECISION DEFAULT 20;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "booking_deposit_flat_amount" DOUBLE PRECISION;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "booking_auth_hold_enabled" BOOLEAN DEFAULT false;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "no_show_protection_enabled" BOOLEAN DEFAULT false;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "no_show_fee_percent" DOUBLE PRECISION;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "no_show_fee_flat_amount" DOUBLE PRECISION;

ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "card_on_file_required" BOOLEAN DEFAULT false;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "booking_deposit_enabled" BOOLEAN DEFAULT false;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "booking_deposit_percent" DOUBLE PRECISION DEFAULT 20;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "booking_deposit_flat_amount" DOUBLE PRECISION;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "booking_auth_hold_enabled" BOOLEAN DEFAULT false;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "no_show_protection_enabled" BOOLEAN DEFAULT false;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "no_show_fee_percent" DOUBLE PRECISION;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "no_show_fee_flat_amount" DOUBLE PRECISION;

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "stripe_checkout_session_id" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "stripe_payment_intent_id" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "deposit_amount" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "deposit_payment_status" TEXT DEFAULT 'none';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "authorization_amount" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "authorization_status" TEXT DEFAULT 'none';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "balance_due" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "saved_payment_method_id" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "no_show_fee_amount" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "no_show_fee_status" TEXT DEFAULT 'none';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "no_show_marked_at" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "no_show_marked_by" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "no_show_stripe_payment_intent_id" TEXT;

CREATE INDEX IF NOT EXISTS "bookings_deposit_payment_status_idx" ON "bookings"("deposit_payment_status");
CREATE INDEX IF NOT EXISTS "bookings_authorization_status_idx" ON "bookings"("authorization_status");
