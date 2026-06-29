-- Explicit in-shop vs at-home service modes (barbers can offer one or both)
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "offers_shop_service" BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS "barbers_offers_shop_service_idx" ON "barbers"("offers_shop_service");
