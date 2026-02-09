-- Google Calendar sync: store refresh token per user and calendar event ids per booking
ALTER TABLE users ADD COLUMN google_calendar_refresh_token TEXT;
ALTER TABLE bookings ADD COLUMN calendar_sync TEXT;
