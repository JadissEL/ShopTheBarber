-- Smart rebooking SMS nudges (habit-based)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sms_rebook_nudges_enabled" BOOLEAN DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rebook_nudge_sent_at" TEXT;

CREATE INDEX IF NOT EXISTS "users_rebook_nudge_sent_at_idx" ON "users"("rebook_nudge_sent_at");
