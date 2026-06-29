-- Platform support tickets + chat
CREATE TABLE IF NOT EXISTS "support_tickets" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "category" TEXT DEFAULT 'general',
  "status" TEXT DEFAULT 'open',
  "priority" TEXT DEFAULT 'normal',
  "assigned_to" TEXT,
  "last_message_at" TEXT,
  "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP,
  "closed_at" TEXT
);

CREATE INDEX IF NOT EXISTS "support_tickets_user_id_idx" ON "support_tickets"("user_id");
CREATE INDEX IF NOT EXISTS "support_tickets_status_idx" ON "support_tickets"("status");
CREATE INDEX IF NOT EXISTS "support_tickets_assigned_to_idx" ON "support_tickets"("assigned_to");
CREATE INDEX IF NOT EXISTS "support_tickets_last_message_at_idx" ON "support_tickets"("last_message_at");

DO $$ BEGIN
  ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_fkey"
    FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "messages" ADD COLUMN IF NOT EXISTS "support_ticket_id" TEXT;

CREATE INDEX IF NOT EXISTS "messages_support_ticket_id_idx" ON "messages"("support_ticket_id");
