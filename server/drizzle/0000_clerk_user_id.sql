-- Idempotent Postgres migration: Clerk subject → users row (additive).
-- SQLite dev: use `npm run db:add-clerk-column` or non-destructive local workflow; do not rely on destructive `push` in prod.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "clerk_user_id" text;

CREATE UNIQUE INDEX IF NOT EXISTS "users_clerk_user_id_uidx" ON "users" ("clerk_user_id") WHERE "clerk_user_id" IS NOT NULL;
