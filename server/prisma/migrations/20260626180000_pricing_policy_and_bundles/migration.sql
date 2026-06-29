-- Fair pricing policy limits + service combo bundles

ALTER TABLE "pricing_rules" ADD COLUMN IF NOT EXISTS "min_service_price" DOUBLE PRECISION DEFAULT 5;
ALTER TABLE "pricing_rules" ADD COLUMN IF NOT EXISTS "max_service_price" DOUBLE PRECISION DEFAULT 500;
ALTER TABLE "pricing_rules" ADD COLUMN IF NOT EXISTS "max_promo_percentage" DOUBLE PRECISION DEFAULT 30;
ALTER TABLE "pricing_rules" ADD COLUMN IF NOT EXISTS "max_promo_fixed" DOUBLE PRECISION DEFAULT 75;
ALTER TABLE "pricing_rules" ADD COLUMN IF NOT EXISTS "max_combo_discount_percent" DOUBLE PRECISION DEFAULT 35;
ALTER TABLE "pricing_rules" ADD COLUMN IF NOT EXISTS "min_combo_services" INTEGER DEFAULT 2;

UPDATE "pricing_rules"
SET
  "min_service_price" = COALESCE("min_service_price", 5),
  "max_service_price" = COALESCE("max_service_price", 500),
  "max_promo_percentage" = COALESCE("max_promo_percentage", 30),
  "max_promo_fixed" = COALESCE("max_promo_fixed", 75),
  "max_combo_discount_percent" = COALESCE("max_combo_discount_percent", 35),
  "min_combo_services" = COALESCE("min_combo_services", 2)
WHERE "is_active" = true OR "is_active" IS NULL;

CREATE TABLE IF NOT EXISTS "service_bundles" (
  "id" TEXT NOT NULL,
  "shop_id" TEXT,
  "barber_id" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "bundle_price" DOUBLE PRECISION,
  "discount_type" TEXT,
  "discount_value" DOUBLE PRECISION,
  "is_active" BOOLEAN DEFAULT true,
  "created_by" TEXT,
  "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "service_bundles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "service_bundle_items" (
  "id" TEXT NOT NULL,
  "bundle_id" TEXT NOT NULL,
  "service_id" TEXT NOT NULL,
  CONSTRAINT "service_bundle_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "service_bundle_items_bundle_id_service_id_key"
  ON "service_bundle_items"("bundle_id", "service_id");
CREATE INDEX IF NOT EXISTS "service_bundles_shop_id_idx" ON "service_bundles"("shop_id");
CREATE INDEX IF NOT EXISTS "service_bundles_barber_id_idx" ON "service_bundles"("barber_id");
CREATE INDEX IF NOT EXISTS "service_bundle_items_service_id_idx" ON "service_bundle_items"("service_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_bundles_shop_id_fkey') THEN
    ALTER TABLE "service_bundles"
      ADD CONSTRAINT "service_bundles_shop_id_fkey"
      FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_bundles_barber_id_fkey') THEN
    ALTER TABLE "service_bundles"
      ADD CONSTRAINT "service_bundles_barber_id_fkey"
      FOREIGN KEY ("barber_id") REFERENCES "barbers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_bundle_items_bundle_id_fkey') THEN
    ALTER TABLE "service_bundle_items"
      ADD CONSTRAINT "service_bundle_items_bundle_id_fkey"
      FOREIGN KEY ("bundle_id") REFERENCES "service_bundles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'service_bundle_items_service_id_fkey') THEN
    ALTER TABLE "service_bundle_items"
      ADD CONSTRAINT "service_bundle_items_service_id_fkey"
      FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
