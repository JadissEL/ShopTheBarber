-- Dispute resolution tracking for admin provider stats
ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "resolution_outcome" TEXT;
ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "refund_amount" DOUBLE PRECISION;
ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "resolution_notes" TEXT;
ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "resolved_at" TEXT;
ALTER TABLE "disputes" ADD COLUMN IF NOT EXISTS "resolved_by" TEXT;

CREATE INDEX IF NOT EXISTS "disputes_resolution_outcome_idx" ON "disputes"("resolution_outcome");
