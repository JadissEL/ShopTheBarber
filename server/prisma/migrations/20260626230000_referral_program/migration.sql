-- Per-user shareable referral codes
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referral_code" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "referred_by_user_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "users_referral_code_key" ON "users"("referral_code") WHERE "referral_code" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "users_referred_by_user_id_idx" ON "users"("referred_by_user_id");

-- Enriched referral tracking
ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "program_type" TEXT DEFAULT 'client_b2c';
ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "referee_promo_code" TEXT;
ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "referrer_reward_amount" DOUBLE PRECISION;
ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "referee_reward_amount" DOUBLE PRECISION;
ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "qualified_at" TEXT;
ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "rewarded_at" TEXT;
ALTER TABLE "referrals" ADD COLUMN IF NOT EXISTS "booking_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "referrals_referred_user_unique"
  ON "referrals"("referred_user_id")
  WHERE "referred_user_id" IS NOT NULL;

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_user_id_fkey"
    FOREIGN KEY ("referred_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
