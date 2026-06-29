-- Barber skills/specialties for shop-managed profiles
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "skills" TEXT;

-- Shop member operational fields
ALTER TABLE "shop_members" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'active';
ALTER TABLE "shop_members" ADD COLUMN IF NOT EXISTS "booking_enabled" BOOLEAN DEFAULT true;
ALTER TABLE "shop_members" ALTER COLUMN "user_id" DROP NOT NULL;

-- Shift linkage to shop members (staff roster scheduling)
ALTER TABLE "shifts" ADD COLUMN IF NOT EXISTS "shop_member_id" TEXT;
ALTER TABLE "shifts" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS "shifts_shop_member_id_idx" ON "shifts"("shop_member_id");
CREATE INDEX IF NOT EXISTS "shop_members_shop_id_idx" ON "shop_members"("shop_id");
CREATE UNIQUE INDEX IF NOT EXISTS "staff_service_configs_member_service_key"
  ON "staff_service_configs"("shop_member_id", "service_id")
  WHERE "shop_member_id" IS NOT NULL AND "service_id" IS NOT NULL;

UPDATE "shop_members" SET "status" = 'active' WHERE "status" IS NULL;
UPDATE "shop_members" SET "booking_enabled" = true WHERE "booking_enabled" IS NULL;

DO $$ BEGIN
  ALTER TABLE "shifts" ADD CONSTRAINT "shifts_shop_member_id_fkey"
    FOREIGN KEY ("shop_member_id") REFERENCES "shop_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
