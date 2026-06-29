-- Provider showcase: career timeline, social links, key dates for client-facing profiles

ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "years_experience" INTEGER;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "career_started_year" INTEGER;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "mobile_service_started_year" INTEGER;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "instagram_handle" TEXT;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "tiktok_handle" TEXT;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "website_url" TEXT;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "profile_highlights" TEXT;

ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "founded_year" INTEGER;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "website_url" TEXT;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "instagram_handle" TEXT;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "profile_highlights" TEXT;

CREATE TABLE IF NOT EXISTS "provider_career_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "barber_id" TEXT,
    "shop_id" TEXT,
    "entry_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "organization" TEXT,
    "location" TEXT,
    "description" TEXT,
    "started_at" TEXT,
    "ended_at" TEXT,
    "is_current" BOOLEAN DEFAULT false,
    "sort_order" INTEGER DEFAULT 0,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "provider_career_entries_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "provider_career_entries_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "provider_career_entries_barber_id_sort_order_idx" ON "provider_career_entries"("barber_id", "sort_order");
CREATE INDEX IF NOT EXISTS "provider_career_entries_shop_id_sort_order_idx" ON "provider_career_entries"("shop_id", "sort_order");
