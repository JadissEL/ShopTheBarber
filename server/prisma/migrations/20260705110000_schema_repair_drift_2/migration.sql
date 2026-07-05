-- Additional idempotent repair (test branch drift).
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_reminders_enabled" BOOLEAN DEFAULT true;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "instagram_handle" TEXT;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "tiktok_handle" TEXT;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "website_url" TEXT;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "profile_highlights" TEXT;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "instagram_handle" TEXT;
