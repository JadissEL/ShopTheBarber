-- Spoken languages for barbers and shops (JSON array of language codes)
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "spoken_languages" TEXT;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "spoken_languages" TEXT;
