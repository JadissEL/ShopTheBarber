-- Provider fee wallet: prepaid balance for cash-in-store bookings (platform commission)

ALTER TABLE "barbers" ADD COLUMN IF NOT EXISTS "accepts_cash_in_store" BOOLEAN DEFAULT false;
ALTER TABLE "shops" ADD COLUMN IF NOT EXISTS "accepts_cash_in_store" BOOLEAN DEFAULT false;

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "payment_method" TEXT DEFAULT 'online';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "platform_fee_status" TEXT DEFAULT 'not_applicable';
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "platform_fee_amount" DOUBLE PRECISION;

CREATE TABLE IF NOT EXISTS "provider_fee_wallets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "shop_id" TEXT,
    "balance" DOUBLE PRECISION DEFAULT 0,
    "currency" TEXT DEFAULT 'EUR',
    "accepts_cash_in_store" BOOLEAN DEFAULT false,
    "minimum_balance" DOUBLE PRECISION DEFAULT 5,
    "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "provider_fee_wallets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "provider_fee_wallets_user_shop_key"
    ON "provider_fee_wallets"("user_id", "shop_id");

CREATE UNIQUE INDEX IF NOT EXISTS "provider_fee_wallets_shop_id_key"
    ON "provider_fee_wallets"("shop_id")
    WHERE "shop_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "provider_fee_transactions" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "booking_id" TEXT,
    "stripe_checkout_session_id" TEXT,
    "description" TEXT,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "provider_fee_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "provider_fee_transactions_wallet_id_idx" ON "provider_fee_transactions"("wallet_id");
CREATE INDEX IF NOT EXISTS "provider_fee_transactions_user_id_idx" ON "provider_fee_transactions"("user_id");
CREATE INDEX IF NOT EXISTS "provider_fee_transactions_booking_id_idx" ON "provider_fee_transactions"("booking_id");

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_fee_wallets_user_id_fkey') THEN
        ALTER TABLE "provider_fee_wallets" ADD CONSTRAINT "provider_fee_wallets_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_fee_wallets_shop_id_fkey') THEN
        ALTER TABLE "provider_fee_wallets" ADD CONSTRAINT "provider_fee_wallets_shop_id_fkey"
            FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_fee_transactions_wallet_id_fkey') THEN
        ALTER TABLE "provider_fee_transactions" ADD CONSTRAINT "provider_fee_transactions_wallet_id_fkey"
            FOREIGN KEY ("wallet_id") REFERENCES "provider_fee_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'provider_fee_transactions_user_id_fkey') THEN
        ALTER TABLE "provider_fee_transactions" ADD CONSTRAINT "provider_fee_transactions_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;
