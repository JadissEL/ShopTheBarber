-- Platform events & webinars for provider registration
CREATE TABLE IF NOT EXISTS "platform_events" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "event_type" TEXT DEFAULT 'webinar',
  "format" TEXT DEFAULT 'online',
  "start_at" TEXT NOT NULL,
  "end_at" TEXT,
  "timezone" TEXT DEFAULT 'UTC',
  "location" TEXT,
  "meeting_url" TEXT,
  "image_url" TEXT,
  "max_capacity" INTEGER,
  "status" TEXT DEFAULT 'draft',
  "target_audience" TEXT DEFAULT 'all_providers',
  "registration_opens_at" TEXT,
  "registration_closes_at" TEXT,
  "created_by" TEXT,
  "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "platform_events_status_idx" ON "platform_events"("status");
CREATE INDEX IF NOT EXISTS "platform_events_start_at_idx" ON "platform_events"("start_at");
CREATE INDEX IF NOT EXISTS "platform_events_target_audience_idx" ON "platform_events"("target_audience");

CREATE TABLE IF NOT EXISTS "event_registrations" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "event_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "status" TEXT DEFAULT 'registered',
  "registered_at" TEXT DEFAULT CURRENT_TIMESTAMP,
  "cancelled_at" TEXT,
  "attended_at" TEXT,
  "notes" TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS "event_registrations_event_user_key" ON "event_registrations"("event_id", "user_id");
CREATE INDEX IF NOT EXISTS "event_registrations_user_id_idx" ON "event_registrations"("user_id");
CREATE INDEX IF NOT EXISTS "event_registrations_event_status_idx" ON "event_registrations"("event_id", "status");

DO $$ BEGIN
  ALTER TABLE "platform_events" ADD CONSTRAINT "platform_events_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_fkey"
    FOREIGN KEY ("event_id") REFERENCES "platform_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
