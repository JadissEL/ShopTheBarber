-- Shop ratings + polymorphic reviews (barber | shop)
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "rating" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "review_count" INTEGER DEFAULT 0;

ALTER TABLE "reviews" ADD COLUMN IF NOT EXISTS "target_type" TEXT NOT NULL DEFAULT 'barber';

-- Drop barber-only FK so shop ids can be stored in target_id
ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "reviews_target_id_fkey";

UPDATE "reviews" SET "target_type" = 'barber' WHERE "target_type" IS NULL OR "target_type" = '';

CREATE INDEX IF NOT EXISTS "reviews_target_type_target_id_idx" ON "reviews"("target_type", "target_id");

-- One review per target type per booking
CREATE UNIQUE INDEX IF NOT EXISTS "reviews_booking_target_type_key"
  ON "reviews"("booking_id", "target_type")
  WHERE "booking_id" IS NOT NULL;
