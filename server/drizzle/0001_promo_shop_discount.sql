-- Add shop scoping on promo_codes and persisted discount_code on bookings (Postgres).

ALTER TABLE "promo_codes" ADD COLUMN IF NOT EXISTS "shop_id" text;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'promo_codes_shop_id_shops_id_fk'
  ) THEN
    ALTER TABLE "promo_codes"
      ADD CONSTRAINT "promo_codes_shop_id_shops_id_fk"
      FOREIGN KEY ("shop_id") REFERENCES "shops"("id")
      ON UPDATE NO ACTION ON DELETE NO ACTION;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "promo_codes_shop_id_idx" ON "promo_codes" ("shop_id");

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "discount_code" text;

CREATE INDEX IF NOT EXISTS "bookings_discount_code_idx" ON "bookings" ("discount_code");
