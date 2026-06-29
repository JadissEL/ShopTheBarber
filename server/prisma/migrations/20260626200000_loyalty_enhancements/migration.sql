-- Loyalty transaction metadata + user-scoped redemption promo codes
ALTER TABLE "loyalty_transactions" ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE "loyalty_transactions" ADD COLUMN IF NOT EXISTS "related_entity_id" TEXT;

CREATE INDEX IF NOT EXISTS "loyalty_transactions_user_type_related_idx"
  ON "loyalty_transactions"("user_id", "type", "related_entity_id");

ALTER TABLE "promo_codes" ADD COLUMN IF NOT EXISTS "owner_user_id" TEXT;

CREATE INDEX IF NOT EXISTS "promo_codes_owner_user_id_idx" ON "promo_codes"("owner_user_id");
