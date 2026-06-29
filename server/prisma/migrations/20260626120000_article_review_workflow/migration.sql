-- Blog article review workflow: barbers/shop owners submit; admin approves.

ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'draft';
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "submitted_at" TEXT;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "reviewed_at" TEXT;
ALTER TABLE "articles" ADD COLUMN IF NOT EXISTS "reviewed_by" TEXT;

UPDATE "articles" SET "status" = 'published' WHERE "published" = true AND (COALESCE("status", '') = '' OR "status" = 'draft');
UPDATE "articles" SET "status" = 'draft' WHERE ("published" = false OR "published" IS NULL) AND (COALESCE("status", '') = '');

CREATE INDEX IF NOT EXISTS "articles_status_idx" ON "articles"("status");
CREATE INDEX IF NOT EXISTS "articles_author_id_idx" ON "articles"("author_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'articles_reviewed_by_fkey'
  ) THEN
    ALTER TABLE "articles"
      ADD CONSTRAINT "articles_reviewed_by_fkey"
      FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
