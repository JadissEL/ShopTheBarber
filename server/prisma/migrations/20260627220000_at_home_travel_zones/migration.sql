-- At-home service: travel zones, geocoding base, service radius
CREATE TABLE IF NOT EXISTS "at_home_service_areas" (
    "id" TEXT NOT NULL,
    "barber_id" TEXT,
    "shop_id" TEXT,
    "base_address" TEXT,
    "base_latitude" DOUBLE PRECISION,
    "base_longitude" DOUBLE PRECISION,
    "service_radius_km" DOUBLE PRECISION NOT NULL DEFAULT 25,
    "travel_fees_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "at_home_service_areas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "at_home_travel_zones" (
    "id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "min_distance_km" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_distance_km" DOUBLE PRECISION NOT NULL,
    "fee_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "at_home_travel_zones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "at_home_service_areas_barber_id_key" ON "at_home_service_areas"("barber_id");
CREATE UNIQUE INDEX IF NOT EXISTS "at_home_service_areas_shop_id_key" ON "at_home_service_areas"("shop_id");
CREATE INDEX IF NOT EXISTS "at_home_service_areas_barber_id_idx" ON "at_home_service_areas"("barber_id");
CREATE INDEX IF NOT EXISTS "at_home_service_areas_shop_id_idx" ON "at_home_service_areas"("shop_id");
CREATE INDEX IF NOT EXISTS "at_home_travel_zones_area_id_sort_order_idx" ON "at_home_travel_zones"("area_id", "sort_order");

ALTER TABLE "at_home_service_areas" ADD CONSTRAINT "at_home_service_areas_barber_id_fkey"
    FOREIGN KEY ("barber_id") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "at_home_service_areas" ADD CONSTRAINT "at_home_service_areas_shop_id_fkey"
    FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "at_home_travel_zones" ADD CONSTRAINT "at_home_travel_zones_area_id_fkey"
    FOREIGN KEY ("area_id") REFERENCES "at_home_service_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "client_latitude" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "client_longitude" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "travel_distance_km" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "travel_fee_amount" DOUBLE PRECISION;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "travel_zone_label" TEXT;
