-- Account type architecture: immutable signup choice + typed profiles

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_type" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "account_type_locked_at" TEXT;

-- Backfill existing users from role + workspace hints
UPDATE "users" u SET "account_type" = 'shop'
WHERE "account_type" IS NULL AND u."role" = 'shop_owner';

UPDATE "users" u SET "account_type" = 'solo_barber'
WHERE "account_type" IS NULL AND u."role" = 'barber';

UPDATE "users" u SET "account_type" = 'client'
WHERE "account_type" IS NULL AND (u."role" IS NULL OR u."role" = 'client' OR u."role" = 'guest');

UPDATE "users" u SET "account_type" = 'client'
WHERE "account_type" IS NULL AND u."role" = 'admin';

UPDATE "users" u SET "account_type" = 'client', "account_type_locked_at" = COALESCE(u."updated_at", u."created_at")
WHERE "account_type" IS NOT NULL AND "account_type_locked_at" IS NULL;

CREATE TABLE IF NOT EXISTS "seller_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "seller_type" TEXT NOT NULL DEFAULT 'vendor',
    "stripe_account_id" TEXT,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "seller_profiles_user_id_key" ON "seller_profiles"("user_id");

CREATE TABLE IF NOT EXISTS "company_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "company_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "company_accounts_user_id_key" ON "company_accounts"("user_id");

CREATE TABLE IF NOT EXISTS "author_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "pen_name" TEXT,
    "bio" TEXT,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "author_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "author_profiles_user_id_key" ON "author_profiles"("user_id");

CREATE TABLE IF NOT EXISTS "signup_intents" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "account_type" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "signup_intents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "signup_intents_token_hash_key" ON "signup_intents"("token_hash");
