-- Booking-linked messaging + structured actions (reschedule proposals)
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "booking_id" TEXT;
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "message_type" TEXT DEFAULT 'text';
ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "metadata" TEXT;

CREATE INDEX IF NOT EXISTS "messages_booking_id_idx" ON "messages"("booking_id");
CREATE INDEX IF NOT EXISTS "messages_created_at_idx" ON "messages"("created_at");
