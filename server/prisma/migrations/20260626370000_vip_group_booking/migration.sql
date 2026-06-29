-- VIP barbers + group booking (parties, weddings, groomsmen)

ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "is_vip" BOOLEAN DEFAULT false;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "offers_group_booking" BOOLEAN DEFAULT false;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "group_booking_min_party" INTEGER DEFAULT 2;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "group_booking_max_party" INTEGER DEFAULT 8;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "group_booking_discount_percent" DOUBLE PRECISION DEFAULT 0;

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "booking_type" TEXT DEFAULT 'individual';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "party_size" INTEGER;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "group_event_label" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "group_notes" TEXT;

CREATE TABLE IF NOT EXISTS "group_booking_guests" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "guest_name" TEXT NOT NULL,
    "sort_order" INTEGER DEFAULT 0,
    "service_ids" TEXT,
    "notes" TEXT,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "group_booking_guests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "group_booking_guests_booking_id_idx" ON "group_booking_guests"("booking_id");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'group_booking_guests_booking_id_fkey'
    ) THEN
        ALTER TABLE "group_booking_guests"
            ADD CONSTRAINT "group_booking_guests_booking_id_fkey"
            FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
