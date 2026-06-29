-- SMS booking reminders (Twilio)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sms_reminders_enabled" BOOLEAN DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_reminders_enabled" BOOLEAN DEFAULT true;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "sms_reminder_sent_at" TEXT;

CREATE INDEX IF NOT EXISTS "bookings_sms_reminder_sent_at_idx" ON "bookings"("sms_reminder_sent_at");
CREATE INDEX IF NOT EXISTS "bookings_start_time_status_idx" ON "bookings"("start_time", "status");
