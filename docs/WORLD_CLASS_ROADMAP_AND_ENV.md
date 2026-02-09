# World-Class Roadmap & Environment Variables

**Purpose**: High-impact improvements to make Shop The Barber best-in-class, and a single reference for **all** environment variables (server + frontend).

---

## Part 1 — Recommended Changes for World-Class Value

### 1. **Social & Professional Login**

| Change | Why | Notes |
|--------|-----|------|
| **Google Sign-In** | One-click sign-up; fewer drop-offs. | Env: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Redirect: `BACKEND_URL/api/auth/google/callback`. |
| **Facebook Sign-In** | Broad user base. | Env: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`. |
| **LinkedIn Sign-In** | **Critical for barbers, stylists, managers.** Lets professionals sign in with LinkedIn and optionally **import profile** (name, headline, summary, experience, skills, profile URL, photo). Ideal for Career Hub, Professional Portfolio, and employer views. | Env: `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`. Create app at [LinkedIn Developer Portal](https://www.linkedin.com/developers/). Request scopes: `openid`, `profile`, `email`, `r_liteprofile` (or current equivalent). Optional: store `linkedin_profile_url`, `linkedin_headline` on `users` or `applicant_profiles` and prefill barber/portfolio. |

**Implementation order**: Google → Facebook → LinkedIn. Reuse the same pattern as Google Calendar OAuth (authorize URL, callback, store refresh token or link to existing user by email).

---

### 2. **Managerial & Employer Experience**

| Change | Why |
|--------|-----|
| **Manager role** | You have `shop_members.role` = owner | manager | barber. Ensure manager-only routes (e.g. staff roster, schedules, finances) are enforced in RouteGuard and backend. |
| **LinkedIn for managers** | Managers/owners hiring stylists can view applicant LinkedIn; applicants who “Sign in with LinkedIn” can one-tap attach profile to applications. |
| **Import from LinkedIn** | On first LinkedIn login (or in Professional Portfolio / Barber profile): “Import from LinkedIn” → pull headline, summary, experience, skills into `applicant_profiles` or barber `bio` / extended profile. |
| **Applicant card** | In ApplicantReview, show LinkedIn profile link and “Imported from LinkedIn” badge when data came from LinkedIn. |

---

### 3. **Profile & Professional Data**

| Change | Why |
|--------|-----|
| **Barber / user: LinkedIn URL** | Add `linkedin_url` (or `linkedin_profile_url`) to `barbers` or `users` so profiles and Career Hub can show “View on LinkedIn”. |
| **Applicant profile: LinkedIn** | Store `linkedin_id` or `linkedin_profile_url` and optional imported snapshot (headline, summary) in `applicant_profiles`. |
| **Portfolio links** | You already have `portfolio_links` (JSON). Consider “Add from LinkedIn” to prefill experience as portfolio entries. |

---

### 4. **Trust, Safety & Compliance**

| Change | Why |
|--------|-----|
| **Rate limiting** | You have rate limiting; ensure it’s enabled on auth and OAuth callbacks (per IP and per user). |
| **CORS** | Keep `FRONTEND_URL` (or explicit origins) in production; avoid `origin: true` in prod. |
| **Secrets** | All keys in env only; no secrets in repo. Rotate JWT_SECRET and API keys if ever exposed. |
| **Audit log** | Keep logging sensitive actions (login, role change, payment, booking cancel). |
| **GDPR / data export** | Add “Export my data” (user’s bookings, profile, messages) and “Delete my account” to stay world-class on privacy. |

---

### 5. **UX & Product Polish**

| Change | Why |
|--------|-----|
| **Email verification** | Optional: require verified email before booking or applying; use Resend to send verification link. |
| **Phone verification** | Optional: Twilio (or similar) for SMS verify; useful for high-value bookings or payouts. |
| **WhatsApp reminders** | You reserved `TWILIO_*` for WhatsApp; implement reminder flow (e.g. 24h before appointment). |
| **Maps / “Near me”** | You have browser geolocation; add server-side distance/sort with `GOOGLE_MAPS_API_KEY` or `MAPBOX_ACCESS_TOKEN`. |
| **Calendar cancel sync** | When a booking is cancelled, delete the corresponding Google Calendar events (you have `calendar_sync` and delete helper). |
| **i18n** | If you target multiple countries, add locale/language switcher and translate strings. |

---

### 6. **Infrastructure & Ops**

| Change | Why |
|--------|-----|
| **DATABASE_PATH** | Wire `process.env.DATABASE_PATH` in `server/src/db/index.ts` so production can point to a persistent volume (e.g. Render disk or external DB). |
| **Health check** | You have `/api/health`; ensure deploy platform uses it for readiness. |
| **Structured logging** | In production, log JSON with request id, user id, and error codes for debugging. |
| **Backups** | You have backup/verify; schedule automated backups (e.g. cron + upload to S3 or similar). |

---

## Part 2 — All Environment Variables

### Server (`server/.env` or Render env)

| Variable | Required | Description | Where used |
|----------|----------|-------------|------------|
| **JWT_SECRET** | Yes | Long random string for signing JWTs. | `server/src/index.ts`, auth, integrations (state signing). |
| **FRONTEND_URL** | Yes (prod) | Frontend origin (e.g. `https://yourapp.vercel.app`). | CORS, emails, redirects, Stripe success/cancel URLs. |
| **BACKEND_URL** | Yes (prod, OAuth) | Backend base URL (e.g. `https://shopthebarber-api.onrender.com`). | Google Calendar (and future OAuth) redirect_uri. |
| **PORT** | No | Server port (default 3001). | `server/src/index.ts`. |
| **NODE_ENV** | No | `development` \| `production` \| `test`. | DB logging, tests, error boundaries. |
| **DATABASE_PATH** | No | Path to SQLite file. (Not yet wired in code; optional for future.) | `server/.env.example` only. |
| **STRIPE_API_KEY** | For payments | Stripe secret key (`sk_test_...` or `sk_live_...`). | `server/src/config/stripeKeys.ts`, payments, webhooks. |
| **STRIPE_PUBLISHABLE_KEY** | For payments | Stripe publishable key (`pk_test_...` or `pk_live_...`). | `server/src/config/stripeKeys.ts`; expose to frontend via API if needed. |
| **STRIPE_WEBHOOK_SECRET** | For webhooks | Stripe webhook signing secret (`whsec_...`). | `server/src/webhooks/stripe.ts`. |
| **RESEND_API_KEY** | For email | Resend API key. | `server/src/logic/email.ts`. |
| **EMAIL_FROM** | For email | Sender address (e.g. `Shop The Barber <bookings@yourdomain.com>`). | `server/src/logic/email.ts`. |
| **GOOGLE_CLIENT_ID** | For Google | Google OAuth Client ID (Calendar + optional Sign-In). | `server/src/logic/calendar.ts`, future Google Sign-In. |
| **GOOGLE_CLIENT_SECRET** | For Google | Google OAuth Client secret. | `server/src/logic/calendar.ts`, future Google Sign-In. |
| **FACEBOOK_APP_ID** | For Facebook | Facebook App ID. | Reserved; future Facebook Sign-In. |
| **FACEBOOK_APP_SECRET** | For Facebook | Facebook App secret. | Reserved; future Facebook Sign-In. |
| **LINKEDIN_CLIENT_ID** | For LinkedIn | LinkedIn OAuth Client ID. | Not yet implemented; for LinkedIn Sign-In + profile import. |
| **LINKEDIN_CLIENT_SECRET** | For LinkedIn | LinkedIn OAuth Client secret. | Not yet implemented. |
| **GOOGLE_MAPS_API_KEY** | Optional | Google Maps API key (Maps/Geocoding). | Reserved; “near me” / distance. |
| **MAPBOX_ACCESS_TOKEN** | Optional | Mapbox token (alternative to Google Maps). | Reserved. |
| **TWILIO_ACCOUNT_SID** | For WhatsApp/SMS | Twilio Account SID. | Reserved; WhatsApp reminders / SMS. |
| **TWILIO_AUTH_TOKEN** | For WhatsApp/SMS | Twilio Auth Token. | Reserved. |
| **TWILIO_WHATSAPP_NUMBER** | For WhatsApp | Twilio WhatsApp number (e.g. `whatsapp:+14155238886`). | Reserved. |
| **LOCAL_AI_ENDPOINT** | Optional | Local LLM endpoint (e.g. `http://localhost:1234/v1`). | `server/src/logic/ai.ts`. |
| **GROK_API_KEY** | Optional | Grok API key if you add cloud AI fallback. | Not yet implemented. |

### Frontend (Vite / build-time)

| Variable | Required | Description | Where used |
|----------|----------|-------------|------------|
| **VITE_API_URL** | Yes (prod) | Backend base URL (e.g. `https://shopthebarber-api.onrender.com`). No trailing slash. | `src/api/apiClient.js` (BASE_URL). |
| **VITE_sovereign_APP_ID** | No | Legacy/app param default. | `src/lib/app-params.js`. |
| **VITE_sovereign_BACKEND_URL** | No | Legacy server URL default. | `src/lib/app-params.js`. |

### CI / Hosting (e.g. GitHub Actions, Render, Vercel)

| Variable | Context | Description |
|----------|---------|-------------|
| **NODE_ENV** | Build/runtime | Set to `production` in production. |
| **VITE_API_URL** | Vercel (build) | Set so frontend build gets correct API URL. |
| **JWT_SECRET**, **STRIPE_***, **RESEND_***, **FRONTEND_URL**, **BACKEND_URL**, **GOOGLE_***, etc. | Render (runtime) | Same as server list above; set in Render dashboard. |

---

## Part 3 — Single Checklist (Copy-Paste)

**Server (e.g. Render)**  
`JWT_SECRET` · `FRONTEND_URL` · `BACKEND_URL` · `PORT` · `NODE_ENV` · `STRIPE_API_KEY` · `STRIPE_PUBLISHABLE_KEY` · `STRIPE_WEBHOOK_SECRET` · `RESEND_API_KEY` · `EMAIL_FROM` · `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` · `FACEBOOK_APP_ID` · `FACEBOOK_APP_SECRET` · `LINKEDIN_CLIENT_ID` · `LINKEDIN_CLIENT_SECRET` · `GOOGLE_MAPS_API_KEY` · `MAPBOX_ACCESS_TOKEN` · `TWILIO_ACCOUNT_SID` · `TWILIO_AUTH_TOKEN` · `TWILIO_WHATSAPP_NUMBER` · `LOCAL_AI_ENDPOINT` · `GROK_API_KEY` · `DATABASE_PATH`

**Frontend (e.g. Vercel)**  
`VITE_API_URL` · `VITE_sovereign_APP_ID` · `VITE_sovereign_BACKEND_URL`

---

## Part 4 — LinkedIn: Where It Fits

- **Auth**: “Sign in with LinkedIn” → same flow as Google (authorize URL, callback, create or link user by email, issue JWT).
- **Roles**: Especially valuable for **barber**, **shop_owner**, and **manager** (and applicants in Career Hub).
- **Profile import**: After LinkedIn login (or a “Import from LinkedIn” button in Professional Portfolio / Barber profile), call LinkedIn API for profile (headline, summary, positions, skills) and prefill:
  - `applicant_profiles`: professional_summary, work_experience, skills, portfolio_links (e.g. LinkedIn URL).
  - `barbers`: bio, or new fields like `linkedin_url`, `headline`.
- **Manager view**: In ApplicantReview, show “LinkedIn” link and “Imported from LinkedIn” when applicable.

Adding LinkedIn Sign-In and optional profile import will make the platform clearly professional and manager-friendly while keeping a single, consistent env and auth model.
