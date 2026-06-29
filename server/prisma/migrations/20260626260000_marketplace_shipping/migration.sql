-- Buyer saved shipping addresses
CREATE TABLE IF NOT EXISTS "saved_addresses" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "label" TEXT DEFAULT 'Home',
  "full_name" TEXT NOT NULL,
  "street" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT,
  "zip" TEXT NOT NULL,
  "country" TEXT DEFAULT 'US',
  "phone" TEXT,
  "is_default" BOOLEAN DEFAULT false,
  "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "saved_addresses_user_id_idx" ON "saved_addresses"("user_id");

DO $$ BEGIN
  ALTER TABLE "saved_addresses" ADD CONSTRAINT "saved_addresses_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Seller ship-from / shipping policy profiles
CREATE TABLE IF NOT EXISTS "seller_shipping_profiles" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "owner_type" TEXT NOT NULL,
  "barber_id" TEXT,
  "shop_id" TEXT,
  "ship_from_name" TEXT NOT NULL,
  "ship_from_street" TEXT NOT NULL,
  "ship_from_city" TEXT NOT NULL,
  "ship_from_state" TEXT,
  "ship_from_zip" TEXT NOT NULL,
  "ship_from_country" TEXT DEFAULT 'US',
  "ship_from_phone" TEXT,
  "processing_days" INTEGER DEFAULT 2,
  "free_shipping_min" DOUBLE PRECISION,
  "flat_shipping_rate" DOUBLE PRECISION DEFAULT 0,
  "return_policy" TEXT,
  "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "seller_shipping_profiles_barber_id_key" ON "seller_shipping_profiles"("barber_id") WHERE "barber_id" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "seller_shipping_profiles_shop_id_key" ON "seller_shipping_profiles"("shop_id") WHERE "shop_id" IS NOT NULL;

-- Per-seller fulfillment segments within an order
CREATE TABLE IF NOT EXISTS "order_fulfillments" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "order_id" TEXT NOT NULL,
  "seller_type" TEXT NOT NULL,
  "barber_id" TEXT,
  "shop_id" TEXT,
  "fulfillment_status" TEXT DEFAULT 'confirmed',
  "tracking_number" TEXT,
  "carrier" TEXT,
  "estimated_delivery_at" TEXT,
  "shipped_at" TEXT,
  "updated_by_user_id" TEXT,
  "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "order_fulfillments_order_id_idx" ON "order_fulfillments"("order_id");
CREATE INDEX IF NOT EXISTS "order_fulfillments_barber_id_idx" ON "order_fulfillments"("barber_id");
CREATE INDEX IF NOT EXISTS "order_fulfillments_shop_id_idx" ON "order_fulfillments"("shop_id");

DO $$ BEGIN
  ALTER TABLE "order_fulfillments" ADD CONSTRAINT "order_fulfillments_order_id_fkey"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Order extensions
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "saved_address_id" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_state" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipping_country" TEXT DEFAULT 'US';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tracking_number" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "carrier" TEXT;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "shipped_at" TEXT;

-- Snapshot seller on line items for seller order queries
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "barber_id" TEXT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "shop_id" TEXT;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "seller_type" TEXT;
