-- Late cancellation fees (Booksy/Squire-style)

ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "late_cancel_protection_enabled" BOOLEAN DEFAULT true;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "late_cancel_full_refund_hours" DOUBLE PRECISION DEFAULT 24;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "late_cancel_no_refund_hours" DOUBLE PRECISION DEFAULT 2;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "late_cancel_fee_percent" DOUBLE PRECISION DEFAULT 50;

ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "late_cancel_protection_enabled" BOOLEAN DEFAULT true;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "late_cancel_full_refund_hours" DOUBLE PRECISION DEFAULT 24;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "late_cancel_no_refund_hours" DOUBLE PRECISION DEFAULT 2;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "late_cancel_fee_percent" DOUBLE PRECISION DEFAULT 50;

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancellation_fee_amount" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancellation_fee_status" TEXT DEFAULT 'none';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancellation_refund_amount" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancellation_stripe_refund_id" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancellation_stripe_payment_intent_id" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancelled_by" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "cancellation_tier" TEXT;
