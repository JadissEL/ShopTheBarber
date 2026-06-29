-- Promo targeting: audience rules + multi-select targets + usage limits
ALTER TABLE "promo_codes" ADD COLUMN IF NOT EXISTS "audience" TEXT DEFAULT 'everyone';
ALTER TABLE "promo_codes" ADD COLUMN IF NOT EXISTS "max_uses" INTEGER;
ALTER TABLE "promo_codes" ADD COLUMN IF NOT EXISTS "max_uses_per_user" INTEGER DEFAULT 1;
ALTER TABLE "promo_codes" ADD COLUMN IF NOT EXISTS "admin_note" TEXT;
ALTER TABLE "promo_codes" ADD COLUMN IF NOT EXISTS "created_at" TEXT DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "promo_codes" ADD COLUMN IF NOT EXISTS "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS "promo_code_targets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promo_code_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    CONSTRAINT "promo_code_targets_promo_code_id_fkey" FOREIGN KEY ("promo_code_id") REFERENCES "promo_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "promo_code_targets_promo_code_id_target_type_target_id_key"
    ON "promo_code_targets"("promo_code_id", "target_type", "target_id");
CREATE INDEX IF NOT EXISTS "promo_code_targets_promo_code_id_idx" ON "promo_code_targets"("promo_code_id");
CREATE INDEX IF NOT EXISTS "promo_code_targets_target_type_target_id_idx" ON "promo_code_targets"("target_type", "target_id");
CREATE INDEX IF NOT EXISTS "promo_codes_audience_idx" ON "promo_codes"("audience");
CREATE INDEX IF NOT EXISTS "promo_codes_is_active_idx" ON "promo_codes"("is_active");

-- Backfill audience from legacy columns
UPDATE "promo_codes" SET "audience" = 'specific_users' WHERE "owner_user_id" IS NOT NULL AND ("audience" IS NULL OR "audience" = 'everyone');
UPDATE "promo_codes" SET "audience" = 'specific_shops' WHERE "shop_id" IS NOT NULL AND "owner_user_id" IS NULL AND ("audience" IS NULL OR "audience" = 'everyone');

INSERT INTO "promo_code_targets" ("id", "promo_code_id", "target_type", "target_id")
SELECT 'pct-' || "id" || '-shop', "id", 'shop', "shop_id"
FROM "promo_codes"
WHERE "shop_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "promo_code_targets" t
    WHERE t."promo_code_id" = "promo_codes"."id" AND t."target_type" = 'shop' AND t."target_id" = "promo_codes"."shop_id"
  );

INSERT INTO "promo_code_targets" ("id", "promo_code_id", "target_type", "target_id")
SELECT 'pct-' || "id" || '-user', "id", 'user', "owner_user_id"
FROM "promo_codes"
WHERE "owner_user_id" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "promo_code_targets" t
    WHERE t."promo_code_id" = "promo_codes"."id" AND t."target_type" = 'user' AND t."target_id" = "promo_codes"."owner_user_id"
  );
