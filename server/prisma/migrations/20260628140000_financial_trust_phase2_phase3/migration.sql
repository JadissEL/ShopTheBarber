-- Financial & Trust Phase 2 + Phase 3 schema

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reputation_score" INTEGER DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reputation_level" TEXT DEFAULT 'new';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reliability_index" INTEGER DEFAULT 100;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reputation_updated_at" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auto_recharge_enabled" BOOLEAN DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auto_recharge_threshold" DOUBLE PRECISION DEFAULT 10;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auto_recharge_amount" DOUBLE PRECISION DEFAULT 50;

ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "trust_score" DOUBLE PRECISION DEFAULT 50;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "availability_score" DOUBLE PRECISION DEFAULT 50;
ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "trust_score_updated_at" TEXT;

CREATE TABLE IF NOT EXISTS "reputation_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "points_delta" INTEGER DEFAULT 0,
    "reliability_delta" INTEGER DEFAULT 0,
    "payload_json" TEXT,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reputation_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "reputation_events_user_id_created_at_idx" ON "reputation_events"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "reputation_events_event_type_idx" ON "reputation_events"("event_type");

CREATE TABLE IF NOT EXISTS "championship_seasons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "season_key" TEXT NOT NULL,
    "starts_at" TEXT NOT NULL,
    "ends_at" TEXT NOT NULL,
    "status" TEXT DEFAULT 'active',
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "championship_seasons_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "championship_seasons_season_key_key" ON "championship_seasons"("season_key");

CREATE TABLE IF NOT EXISTS "championship_scores" (
    "id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "barber_id" TEXT NOT NULL,
    "composite_score" DOUBLE PRECISION DEFAULT 0,
    "rank" INTEGER,
    "country_code" TEXT,
    "badges_json" TEXT,
    "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "championship_scores_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "championship_scores_season_id_barber_id_key" ON "championship_scores"("season_id", "barber_id");
CREATE INDEX IF NOT EXISTS "championship_scores_season_id_rank_idx" ON "championship_scores"("season_id", "rank");

CREATE TABLE IF NOT EXISTS "championship_hall_of_fame" (
    "id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "barber_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "badge" TEXT,
    "inducted_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "championship_hall_of_fame_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "championship_hall_of_fame_season_id_barber_id_key" ON "championship_hall_of_fame"("season_id", "barber_id");

CREATE TABLE IF NOT EXISTS "fraud_alerts" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "severity" TEXT DEFAULT 'medium',
    "payload_json" TEXT,
    "status" TEXT DEFAULT 'open',
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TEXT,
    CONSTRAINT "fraud_alerts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "fraud_alerts_status_created_at_idx" ON "fraud_alerts"("status", "created_at");

CREATE TABLE IF NOT EXISTS "partner_api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "api_key_hash" TEXT NOT NULL,
    "scopes_json" TEXT,
    "rate_limit" INTEGER DEFAULT 1000,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TEXT,
    CONSTRAINT "partner_api_keys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "partner_api_keys_api_key_hash_key" ON "partner_api_keys"("api_key_hash");

CREATE TABLE IF NOT EXISTS "ad_credit_wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "balance" DOUBLE PRECISION DEFAULT 0,
    "currency" TEXT DEFAULT 'EUR',
    "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ad_credit_wallets_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ad_credit_wallets_user_id_key" ON "ad_credit_wallets"("user_id");

CREATE TABLE IF NOT EXISTS "ad_credit_transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ad_credit_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ad_credit_transactions_wallet_id_idx" ON "ad_credit_transactions"("wallet_id");

CREATE TABLE IF NOT EXISTS "dispute_appeals" (
    "id" TEXT NOT NULL,
    "dispute_id" TEXT NOT NULL,
    "appellant_id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT DEFAULT 'pending',
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TEXT,
    CONSTRAINT "dispute_appeals_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "dispute_appeals_dispute_id_idx" ON "dispute_appeals"("dispute_id");

CREATE TABLE IF NOT EXISTS "wallet_reconciliation_runs" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "wallet_kind" TEXT NOT NULL,
    "expected_balance" DOUBLE PRECISION NOT NULL,
    "actual_balance" DOUBLE PRECISION NOT NULL,
    "delta" DOUBLE PRECISION NOT NULL,
    "status" TEXT DEFAULT 'ok',
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "wallet_reconciliation_runs_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "wallet_reconciliation_runs_wallet_id_created_at_idx" ON "wallet_reconciliation_runs"("wallet_id", "created_at");

CREATE TABLE IF NOT EXISTS "financing_applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "purpose" TEXT,
    "status" TEXT DEFAULT 'pending',
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "financing_applications_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "financing_applications_user_id_status_idx" ON "financing_applications"("user_id", "status");
