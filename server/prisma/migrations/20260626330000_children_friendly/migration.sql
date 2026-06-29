ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "children_friendly" BOOLEAN DEFAULT false;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "children_friendly" BOOLEAN DEFAULT false;
