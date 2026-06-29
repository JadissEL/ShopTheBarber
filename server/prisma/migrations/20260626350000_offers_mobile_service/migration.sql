ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "offers_mobile_service" BOOLEAN DEFAULT false;

UPDATE "barbers" SET "offers_mobile_service" = true WHERE "id" IN ('b1', 'b2');
