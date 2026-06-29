-- Persist visit type, client address, and display fields on bookings
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "visit_type" TEXT DEFAULT 'shop';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "location_text" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "date_text" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "time_text" TEXT;

CREATE INDEX IF NOT EXISTS "bookings_visit_type_idx" ON "bookings"("visit_type");
