ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "attestation_licensed" BOOLEAN DEFAULT false;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "attestation_insured" BOOLEAN DEFAULT false;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "attestation_licensed" BOOLEAN DEFAULT false;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "attestation_insured" BOOLEAN DEFAULT false;
