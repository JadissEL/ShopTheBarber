CREATE TABLE IF NOT EXISTS "product_analytics_events" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "event_name" TEXT NOT NULL,
  "user_id" TEXT,
  "session_id" TEXT,
  "properties" TEXT,
  "page_path" TEXT,
  "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "product_analytics_events_event_name_created_at_idx"
  ON "product_analytics_events"("event_name", "created_at");
CREATE INDEX IF NOT EXISTS "product_analytics_events_user_id_created_at_idx"
  ON "product_analytics_events"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "product_analytics_events_session_id_created_at_idx"
  ON "product_analytics_events"("session_id", "created_at");
CREATE INDEX IF NOT EXISTS "product_analytics_events_created_at_idx"
  ON "product_analytics_events"("created_at");

DO $$ BEGIN
  ALTER TABLE "product_analytics_events" ADD CONSTRAINT "product_analytics_events_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
