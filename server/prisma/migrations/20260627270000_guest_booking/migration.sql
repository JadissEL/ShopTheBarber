-- Guest booking: contact fields + magic-link token for booking management
ALTER TABLE "bookings" ADD COLUMN "client_phone" TEXT;
ALTER TABLE "bookings" ADD COLUMN "client_email" TEXT;
ALTER TABLE "bookings" ADD COLUMN "guest_access_token" TEXT;

CREATE UNIQUE INDEX "bookings_guest_access_token_key" ON "bookings"("guest_access_token");
