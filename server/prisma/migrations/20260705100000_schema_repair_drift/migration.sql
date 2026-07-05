-- Idempotent repair for databases where migrations were marked applied but columns are missing.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sms_reminders_enabled" BOOLEAN DEFAULT true;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "years_experience" INTEGER;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "career_started_year" INTEGER;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "mobile_service_started_year" INTEGER;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "email_reminder_sent_at" TEXT;
