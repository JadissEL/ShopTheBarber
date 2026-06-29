-- Post-appointment review request loop (SQUIRE-style)
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "review_request_token" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "review_request_sent_at" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "review_nudge_sent_at" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "bookings_review_request_token_key" ON "bookings"("review_request_token");
