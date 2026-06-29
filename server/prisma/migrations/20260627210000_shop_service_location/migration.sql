-- Shop-level service location (in-shop vs at-home) for shop owners
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "offers_shop_service" BOOLEAN DEFAULT true;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "offers_mobile_service" BOOLEAN DEFAULT false;
