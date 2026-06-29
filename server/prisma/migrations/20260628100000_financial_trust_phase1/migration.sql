-- Financial & Trust Ecosystem Phase 1

ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "chair_id" TEXT;
ALTER TABLE "bookings" ADD COLUMN IF NOT EXISTS "qr_check_in_token" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "bookings_qr_check_in_token_key" ON "bookings"("qr_check_in_token");

ALTER TABLE "provider_fee_wallets" ADD COLUMN IF NOT EXISTS "promotional_balance" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "provider_fee_wallets" ADD COLUMN IF NOT EXISTS "purchased_balance" DOUBLE PRECISION DEFAULT 0;
ALTER TABLE "provider_fee_wallets" ADD COLUMN IF NOT EXISTS "health_status" TEXT DEFAULT 'good';

ALTER TABLE "waiting_list_entries" ADD COLUMN IF NOT EXISTS "shop_id" TEXT;
ALTER TABLE "waiting_list_entries" ADD COLUMN IF NOT EXISTS "service_id" TEXT;
ALTER TABLE "waiting_list_entries" ADD COLUMN IF NOT EXISTS "slot_start" TEXT;
ALTER TABLE "waiting_list_entries" ADD COLUMN IF NOT EXISTS "preferred_time" TEXT;
ALTER TABLE "waiting_list_entries" ADD COLUMN IF NOT EXISTS "position" INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS "waiting_list_entries_barber_id_slot_start_idx" ON "waiting_list_entries"("barber_id", "slot_start");
CREATE INDEX IF NOT EXISTS "waiting_list_entries_client_id_idx" ON "waiting_list_entries"("client_id");

CREATE TABLE IF NOT EXISTS "ledger_entries" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload_json" TEXT,
    "actor_id" TEXT,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ledger_entries_entity_type_entity_id_idx" ON "ledger_entries"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "ledger_entries_event_type_idx" ON "ledger_entries"("event_type");

CREATE TABLE IF NOT EXISTS "shop_chairs" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    "sort_order" INTEGER DEFAULT 0,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shop_chairs_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "shop_chairs_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "shop_chairs_shop_id_idx" ON "shop_chairs"("shop_id");

CREATE TABLE IF NOT EXISTS "chair_assignments" (
    "id" TEXT NOT NULL,
    "chair_id" TEXT NOT NULL,
    "barber_id" TEXT NOT NULL,
    "day_of_week" TEXT,
    "effective_from" TEXT,
    "effective_to" TEXT,
    CONSTRAINT "chair_assignments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "chair_assignments_chair_id_fkey" FOREIGN KEY ("chair_id") REFERENCES "shop_chairs"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chair_assignments_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "chair_assignments_chair_id_idx" ON "chair_assignments"("chair_id");
CREATE INDEX IF NOT EXISTS "chair_assignments_barber_id_idx" ON "chair_assignments"("barber_id");

CREATE TABLE IF NOT EXISTS "barber_capacity_settings" (
    "id" TEXT NOT NULL,
    "barber_id" TEXT NOT NULL,
    "default_buffer_minutes" INTEGER DEFAULT 0,
    CONSTRAINT "barber_capacity_settings_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "barber_capacity_settings_barber_id_key" UNIQUE ("barber_id"),
    CONSTRAINT "barber_capacity_settings_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "booking_check_ins" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "qr_token" TEXT NOT NULL,
    "scanned_at" TEXT,
    "scanned_by" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "booking_check_ins_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "booking_check_ins_booking_id_key" UNIQUE ("booking_id"),
    CONSTRAINT "booking_check_ins_qr_token_key" UNIQUE ("qr_token"),
    CONSTRAINT "booking_check_ins_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "booking_check_ins_qr_token_idx" ON "booking_check_ins"("qr_token");

CREATE TABLE IF NOT EXISTS "marketplace_reservations" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quantity" INTEGER DEFAULT 1,
    "status" TEXT DEFAULT 'active',
    "expires_at" TEXT NOT NULL,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "marketplace_reservations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "marketplace_reservations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "marketplace_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "marketplace_reservations_product_id_status_idx" ON "marketplace_reservations"("product_id", "status");
CREATE INDEX IF NOT EXISTS "marketplace_reservations_user_id_idx" ON "marketplace_reservations"("user_id");

CREATE TABLE IF NOT EXISTS "waitlist_offers" (
    "id" TEXT NOT NULL,
    "waitlist_entry_id" TEXT NOT NULL,
    "slot_start" TEXT NOT NULL,
    "slot_end" TEXT,
    "status" TEXT DEFAULT 'pending',
    "offer_expires_at" TEXT NOT NULL,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "waitlist_offers_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "waitlist_offers_waitlist_entry_id_fkey" FOREIGN KEY ("waitlist_entry_id") REFERENCES "waiting_list_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "waitlist_offers_waitlist_entry_id_idx" ON "waitlist_offers"("waitlist_entry_id");
CREATE INDEX IF NOT EXISTS "waitlist_offers_status_offer_expires_at_idx" ON "waitlist_offers"("status", "offer_expires_at");

ALTER TABLE "bookings" ADD CONSTRAINT "bookings_chair_id_fkey" FOREIGN KEY ("chair_id") REFERENCES "shop_chairs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "bookings_chair_id_start_time_idx" ON "bookings"("chair_id", "start_time");
