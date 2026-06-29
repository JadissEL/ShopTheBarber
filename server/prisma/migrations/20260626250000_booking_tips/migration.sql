-- Post-service tips (pourboires) linked to completed bookings
CREATE TABLE IF NOT EXISTS "booking_tips" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "booking_id" TEXT NOT NULL,
  "client_id" TEXT NOT NULL,
  "recipient_user_id" TEXT NOT NULL,
  "barber_id" TEXT NOT NULL,
  "shop_id" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT DEFAULT 'USD',
  "percent_of_service" DOUBLE PRECISION,
  "message" TEXT,
  "status" TEXT DEFAULT 'pending',
  "stripe_checkout_session_id" TEXT,
  "stripe_payment_intent_id" TEXT,
  "connect_transfer_id" TEXT,
  "paid_at" TEXT,
  "created_at" TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "booking_tips_booking_id_key" ON "booking_tips"("booking_id");
CREATE INDEX IF NOT EXISTS "booking_tips_recipient_user_id_idx" ON "booking_tips"("recipient_user_id");
CREATE INDEX IF NOT EXISTS "booking_tips_barber_id_idx" ON "booking_tips"("barber_id");
CREATE INDEX IF NOT EXISTS "booking_tips_client_id_idx" ON "booking_tips"("client_id");
CREATE INDEX IF NOT EXISTS "booking_tips_status_idx" ON "booking_tips"("status");

DO $$ BEGIN
  ALTER TABLE "booking_tips" ADD CONSTRAINT "booking_tips_booking_id_fkey"
    FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "booking_tips" ADD CONSTRAINT "booking_tips_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "booking_tips" ADD CONSTRAINT "booking_tips_recipient_user_id_fkey"
    FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
