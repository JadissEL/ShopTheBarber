-- Company marketplace commerce activation (on-request, DB-backed).
ALTER TABLE "company_accounts" ADD COLUMN IF NOT EXISTS "commerce_enabled" BOOLEAN DEFAULT false;
ALTER TABLE "company_accounts" ADD COLUMN IF NOT EXISTS "commerce_enabled_at" TEXT;
