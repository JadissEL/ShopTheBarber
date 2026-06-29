-- Drop legacy email/password column (auth is Clerk-only).
ALTER TABLE "users" DROP COLUMN IF EXISTS "password_hash";
