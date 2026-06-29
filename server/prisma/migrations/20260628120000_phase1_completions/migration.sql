-- Phase 1 completions: multi-service waitlist + promotional credit expiry

ALTER TABLE "waiting_list_entries" ADD COLUMN IF NOT EXISTS "service_ids_json" TEXT;

ALTER TABLE "provider_fee_wallets" ADD COLUMN IF NOT EXISTS "promotional_expires_at" TEXT;
