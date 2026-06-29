-- Job posting review workflow: employers submit; admin approves before Career Hub listing.

ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "published" BOOLEAN DEFAULT false;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "submitted_at" TEXT;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "reviewed_at" TEXT;
ALTER TABLE "jobs" ADD COLUMN IF NOT EXISTS "reviewed_by" TEXT;

UPDATE "jobs" SET "status" = 'published', "published" = true WHERE "status" = 'published';
UPDATE "jobs" SET "status" = 'closed', "published" = false WHERE "status" = 'closed';
UPDATE "jobs" SET "status" = 'draft', "published" = false WHERE COALESCE("status", '') = '' OR "status" = 'draft';

CREATE INDEX IF NOT EXISTS "jobs_status_idx" ON "jobs"("status");
CREATE INDEX IF NOT EXISTS "jobs_created_by_idx" ON "jobs"("created_by");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_reviewed_by_fkey'
  ) THEN
    ALTER TABLE "jobs"
      ADD CONSTRAINT "jobs_reviewed_by_fkey"
      FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
