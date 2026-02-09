# Google Calendar Sync — Setup

Bookings are synced to Google Calendar for both **clients** and **barbers** when they connect their account in **Account Settings → Integrations**.

## 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. **APIs & Services** → **Library** → search **Google Calendar API** → **Enable**.
4. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**.
5. If prompted, configure the **OAuth consent screen** (External, add your app name and support email).
6. Application type: **Web application**.
7. **Authorized redirect URIs**: add exactly:
   - Local: `http://localhost:3001/api/integrations/google/callback`
   - Production: `https://YOUR-BACKEND-URL/api/integrations/google/callback` (e.g. `https://shopthebarber-api.onrender.com/api/integrations/google/callback`)
8. Copy the **Client ID** and **Client secret**.

## 2. Server environment

In `server/.env` or Render environment:

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID from step 1 |
| `GOOGLE_CLIENT_SECRET` | OAuth 2.0 Client secret |
| `BACKEND_URL` | Backend base URL (e.g. `https://shopthebarber-api.onrender.com`). Used as OAuth `redirect_uri` base. Omit in local dev if backend runs on port 3001. |

## 3. User flow

1. User goes to **Account Settings** → **Integrations**.
2. Clicks **Connect Google Calendar** → redirected to Google → authorizes.
3. Callback stores a refresh token for that user.
4. When a **booking is created**, the server creates a calendar event in the **client’s** and **barber’s** primary Google Calendar (if they have connected).

## 4. Behaviour

- **Create booking** → event is added to client’s and barber’s Google Calendar when they have connected.
- **Cancel booking** → calendar events are not removed automatically in this version; you can extend the cancel flow to call the Calendar API delete.
- Scopes used: `calendar`, `calendar.events`.

## 5. Optional: cancellation sync

To remove the event when a booking is cancelled, add a call to `deleteCalendarEvent(refreshToken, eventId)` in your cancel-booking logic, using the `calendar_sync` JSON on the booking (e.g. `clientEventId`, `barberEventId`) and the stored refresh tokens for client and barber.
