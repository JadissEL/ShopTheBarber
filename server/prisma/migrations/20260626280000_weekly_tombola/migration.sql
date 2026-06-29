-- Weekly tombola / live draw for trip prizes
CREATE TABLE IF NOT EXISTS "weekly_draws" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "prize_title" TEXT NOT NULL,
  "prize_description" TEXT,
  "week_start" TEXT NOT NULL,
  "week_end" TEXT NOT NULL,
  "draw_at" TEXT NOT NULL,
  "status" TEXT DEFAULT 'open',
  "winner_user_id" TEXT,
  "winner_display_name" TEXT,
  "total_tickets" INTEGER DEFAULT 0,
  "participant_count" INTEGER DEFAULT 0,
  "draw_seed" TEXT,
  "draw_hash" TEXT,
  "skill_question" TEXT,
  "skill_answer" TEXT,
  "completed_at" TEXT,
  "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "weekly_draws_status_idx" ON "weekly_draws"("status");
CREATE INDEX IF NOT EXISTS "weekly_draws_draw_at_idx" ON "weekly_draws"("draw_at");
CREATE INDEX IF NOT EXISTS "weekly_draws_week_start_idx" ON "weekly_draws"("week_start");

CREATE TABLE IF NOT EXISTS "draw_entries" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "draw_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "participant_role" TEXT NOT NULL,
  "entry_count" INTEGER DEFAULT 1,
  "eligibility_json" TEXT,
  "is_free_entry" BOOLEAN DEFAULT false,
  "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "draw_entries_draw_user_key" ON "draw_entries"("draw_id", "user_id");
CREATE INDEX IF NOT EXISTS "draw_entries_draw_id_idx" ON "draw_entries"("draw_id");
CREATE INDEX IF NOT EXISTS "draw_entries_user_id_idx" ON "draw_entries"("user_id");

CREATE TABLE IF NOT EXISTS "draw_winner_claims" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "draw_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "skill_answer" TEXT,
  "skill_passed" BOOLEAN DEFAULT false,
  "status" TEXT DEFAULT 'pending',
  "claimed_at" TEXT,
  "created_at" TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "draw_winner_claims_draw_key" ON "draw_winner_claims"("draw_id");
CREATE INDEX IF NOT EXISTS "draw_winner_claims_user_id_idx" ON "draw_winner_claims"("user_id");

DO $$ BEGIN
  ALTER TABLE "draw_entries" ADD CONSTRAINT "draw_entries_draw_id_fkey"
    FOREIGN KEY ("draw_id") REFERENCES "weekly_draws"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "draw_entries" ADD CONSTRAINT "draw_entries_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "draw_winner_claims" ADD CONSTRAINT "draw_winner_claims_draw_id_fkey"
    FOREIGN KEY ("draw_id") REFERENCES "weekly_draws"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "draw_winner_claims" ADD CONSTRAINT "draw_winner_claims_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "weekly_draws" ADD CONSTRAINT "weekly_draws_winner_user_id_fkey"
    FOREIGN KEY ("winner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
