-- Language learning programs and paid waitlist (20% non-refundable deposit)

CREATE TABLE "language_programs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "language_code" TEXT NOT NULL,
    "total_price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT DEFAULT 'EUR',
    "max_waitlist" INTEGER,
    "status" TEXT DEFAULT 'draft',
    "estimated_start_at" TEXT,
    "duration_weeks" INTEGER,
    "format" TEXT DEFAULT 'online',
    "image_url" TEXT,
    "created_by" TEXT,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "language_programs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "language_program_waitlist" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "barber_id" TEXT,
    "target_language_code" TEXT NOT NULL,
    "status" TEXT DEFAULT 'pending_payment',
    "deposit_percent" DOUBLE PRECISION DEFAULT 20,
    "deposit_amount" DOUBLE PRECISION NOT NULL,
    "total_program_price" DOUBLE PRECISION NOT NULL,
    "payment_status" TEXT DEFAULT 'unpaid',
    "stripe_checkout_session_id" TEXT,
    "stripe_payment_intent_id" TEXT,
    "terms_accepted_at" TEXT,
    "terms_version" TEXT,
    "position" INTEGER,
    "enrolled_at" TEXT,
    "cancelled_at" TEXT,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "language_program_waitlist_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "language_program_waitlist_program_id_user_id_key" ON "language_program_waitlist"("program_id", "user_id");
CREATE INDEX "language_program_waitlist_user_id_idx" ON "language_program_waitlist"("user_id");
CREATE INDEX "language_program_waitlist_program_id_status_idx" ON "language_program_waitlist"("program_id", "status");
CREATE INDEX "language_programs_status_idx" ON "language_programs"("status");
CREATE INDEX "language_programs_language_code_idx" ON "language_programs"("language_code");

ALTER TABLE "language_programs" ADD CONSTRAINT "language_programs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "language_program_waitlist" ADD CONSTRAINT "language_program_waitlist_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "language_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "language_program_waitlist" ADD CONSTRAINT "language_program_waitlist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "language_program_waitlist" ADD CONSTRAINT "language_program_waitlist_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "barbers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
