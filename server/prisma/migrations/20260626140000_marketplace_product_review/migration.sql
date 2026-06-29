-- Marketplace product review workflow + inventory fields.

ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'draft';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "published" BOOLEAN DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "stock" INTEGER DEFAULT 0;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "submitted_at" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "reviewed_at" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "reviewed_by" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "created_by" TEXT;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP;

-- Existing seed/live rows become published marketplace listings.
UPDATE "products" SET "status" = 'published', "published" = true, "stock" = COALESCE("stock", 25)
WHERE COALESCE("status", '') = '' OR "status" = 'draft';

CREATE INDEX IF NOT EXISTS "products_status_idx" ON "products"("status");
CREATE INDEX IF NOT EXISTS "products_published_idx" ON "products"("published");
CREATE INDEX IF NOT EXISTS "products_seller_type_idx" ON "products"("seller_type");
CREATE INDEX IF NOT EXISTS "products_barber_id_idx" ON "products"("barber_id");
CREATE INDEX IF NOT EXISTS "products_shop_id_idx" ON "products"("shop_id");
CREATE INDEX IF NOT EXISTS "products_brand_id_idx" ON "products"("brand_id");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_created_by_fkey') THEN
    ALTER TABLE "products" ADD CONSTRAINT "products_created_by_fkey"
      FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_reviewed_by_fkey') THEN
    ALTER TABLE "products" ADD CONSTRAINT "products_reviewed_by_fkey"
      FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
