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

### 7. **Analytics, Security & User Navigation Tracking**

| Area | What to add | Env / integration |
|------|-------------|-------------------|
| **Analytics** | Product analytics: page views, funnels, conversion. Use one of: **Google Analytics 4**, **PostHog**, **Plausible**, or **Mixpanel**. | **Frontend:** `VITE_GA_MEASUREMENT_ID` (GA4), or `VITE_POSTHOG_KEY` + `VITE_POSTHOG_HOST`, or `VITE_PLAUSIBLE_DOMAIN`, or `VITE_MIXPANEL_TOKEN`. **Backend (optional):** server-side events via `ANALYTICS_WRITE_KEY` (Segment) or PostHog/Mixpanel server API key. |
| **Security / Error tracking** | **Sentry** (or similar) for frontend and backend errors, stack traces, release tracking. | **Frontend:** `VITE_SENTRY_DSN`. **Backend:** `SENTRY_DSN`. Optional: `SENTRY_AUTH_TOKEN` for releases, `SENTRY_ENVIRONMENT` (e.g. `production`). |
| **User navigation tracking** | Track which pages users visit and when (for UX, funnels, support). Your app already has `NavigationTracker` and `sovereign.analytics.track()`; wire them to your analytics provider. | Same as Analytics: when `VITE_POSTHOG_KEY` or `VITE_GA_MEASUREMENT_ID` is set, **NavigationTracker** can send `page_view` (pathname, page name) and **sovereign.analytics.track** can send custom events (e.g. `booking_started`, `profile_view`) to that provider. Optional backend: `NAVIGATION_TRACKING_ENABLED` + POST `/api/analytics/navigation` to store server-side if you want your own DB of page views. |

**Implementation notes**

- **Analytics:** Add a small init module (e.g. `src/lib/analytics.js`) that, when `VITE_GA_MEASUREMENT_ID` or `VITE_POSTHOG_KEY` etc. is set, initializes the SDK and exposes `track(eventName, properties)` and `pageView(path, name)`. Call `pageView` from `NavigationTracker` and keep calling `sovereign.analytics.track()` from BookingFlow, BarberProfile, etc.; have the client send those to the chosen provider.
- **Security (Sentry):** Frontend: init Sentry with `VITE_SENTRY_DSN` in `main.jsx`. Backend: add `@sentry/node` (or Fastify plugin), init with `SENTRY_DSN`. Redact PII in both (e.g. no emails in breadcrumbs).
- **Navigation:** No extra env beyond analytics; navigation is a subset of analytics. If you add a backend endpoint to log nav events (e.g. for compliance or custom dashboards), use `NAVIGATION_TRACKING_ENABLED` and optionally `ANALYTICS_API_KEY` or the same Sentry/PostHog backend key.

---

### 8. **Observability & Performance**

As you scale, "knowing" what's happening becomes more important than "doing" the task.

| Variable | Description | Use Case |
|----------|-------------|----------|
| **SENTRY_DSN** | Error tracking DSN. | Catching frontend/backend crashes in real-time before users report them. |
| **DATADOG_API_KEY** | Infrastructure monitoring. | Monitoring CPU/RAM spikes and database query latency. |
| **NEW_RELIC_LICENSE_KEY** | Application Performance Monitoring (APM). | Identifying slow API endpoints and bottlenecks in the booking logic. |
| **LOG_LEVEL** | `debug`, `info`, `warn`, `error`. | Controlling verbosity without redeploying code. |

---

### 9. **High-Scale Infrastructure & Storage**

Local storage and basic SQLite won't cut it when you have thousands of barbers uploading high-res portfolio photos.

| Variable | Description | Use Case |
|----------|-------------|----------|
| **AWS_S3_BUCKET_NAME** | Cloud storage bucket name. | Storing high-resolution barber portfolio images and videos. |
| **AWS_ACCESS_KEY_ID** | AWS credentials. | Programmatic access to S3 or CloudFront. |
| **AWS_REGION** | The physical location of data. | Minimizing latency for image uploads/downloads. |
| **CDN_URL** | e.g. CloudFront or Cloudflare. | Serving static assets and images via a global edge network to speed up load times. |
| **REDIS_URL** | Connection string for Redis. | Distributed caching for session data and rate-limiting across multiple server instances. |

---

### 10. **Localization & Internationalization (i18n)**

For a world-class ecosystem, you need to handle currencies and timezones like a pro.

| Variable | Description | Use Case |
|----------|-------------|----------|
| **DEFAULT_CURRENCY** | e.g. `USD`, `EUR`, `MAD`. | Setting the baseline for multi-currency shop setups. |
| **SUPPORTED_LOCALES** | e.g. `en,fr,es,ar`. | Restricting the app to specific markets during phased rollouts. |
| **IPSTACK_API_KEY** | IP Geolocation service. | Automatically detecting a user's country to set their local currency and language. |

---

### 11. **Advanced Security & Compliance**

High-stakes contracts and business deals require enterprise-grade security.

| Variable | Description | Use Case |
|----------|-------------|----------|
| **ENCRYPTION_KEY** | 32-byte string. | Encrypting sensitive data at rest (e.g. OAuth tokens or tax IDs) in the database. |
| **CORS_ALLOWED_ORIGINS** | Comma-separated list. | Strictly controlling which domains can talk to your API (essential for security). |
| **CLOUDFLARE_WEBHOOK_SECRET** | Secret for CF Turnstile/Captcha. | Preventing bot-driven fake appointments or account creation spam. |

---

### 12. **Specialized Styling & Business Tools**

Deepening the ecosystem for professional "Stylisme."

| Variable | Description | Use Case |
|----------|-------------|----------|
| **CLOUDINARY_URL** | Image optimization API. | Auto-resizing and "beautifying" barber portfolio photos (e.g. auto-cropping for thumbnails). |
| **VAT_LAYER_API_KEY** | Tax calculation service. | Calculating real-time VAT/Sales Tax for different countries during checkout. |
| **PDF_GENERATOR_API_KEY** | e.g. Browserless or PDFMonkey. | Generating professional invoices and high-stakes contract PDFs for business deals. |
| **INTERCOM_APP_ID** | Customer Support/Success. | Real-time chat for shop owners needing technical assistance. |
| **UNSPLASH_ACCESS_KEY** | Stock image API. | Helping shop owners find professional placeholder images for their storefronts. |

**Pro-Tip: Secret Management**  
When you reach this many variables, your `.env` file becomes a security risk. In a high-scale operation, move these into a **Secret Manager** (e.g. AWS Secrets Manager, HashiCorp Vault, or the native "Secrets" UI in Render/Vercel) rather than keeping them in a flat file.

**Note on high-stakes deals:** Since you are targeting 25-year industry veterans, ensure `PDF_GENERATOR_API_KEY` is linked to a service that supports **digital signatures** (e.g. DocuSign or HelloSign API) for those high-value contracts.

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
| **SENTRY_DSN** | Optional | Sentry DSN for backend error tracking. | Not yet implemented; use with `@sentry/node` or Fastify plugin. |
| **SENTRY_AUTH_TOKEN** | Optional | Sentry auth token for release uploads (source maps). | CI or deploy. |
| **SENTRY_ENVIRONMENT** | Optional | e.g. `production`, `staging`. | Sentry backend init. |
| **ANALYTICS_WRITE_KEY** | Optional | Server-side analytics (e.g. Segment write key). | Not yet implemented. |
| **NAVIGATION_TRACKING_ENABLED** | Optional | If `true`, backend may log nav events (e.g. POST `/api/analytics/navigation`). | Not yet implemented. |
| **DATADOG_API_KEY** | Optional | Datadog API key for infrastructure monitoring. | CPU/RAM, DB query latency. |
| **NEW_RELIC_LICENSE_KEY** | Optional | New Relic APM license key. | Slow endpoints, booking logic bottlenecks. |
| **LOG_LEVEL** | Optional | `debug` \| `info` \| `warn` \| `error`. | Control log verbosity without redeploy. |
| **AWS_S3_BUCKET_NAME** | Optional | S3 bucket for uploads. | Barber portfolio images/videos. |
| **AWS_ACCESS_KEY_ID** | Optional | AWS access key (S3/CloudFront). | Programmatic S3 access. |
| **AWS_SECRET_ACCESS_KEY** | Optional | AWS secret key. | With AWS_ACCESS_KEY_ID. |
| **AWS_REGION** | Optional | e.g. `us-east-1`. | Data location, upload latency. |
| **CDN_URL** | Optional | e.g. CloudFront or Cloudflare origin. | Serve assets/images from edge. |
| **REDIS_URL** | Optional | Redis connection string. | Sessions, rate-limiting, multi-instance cache. |
| **DEFAULT_CURRENCY** | Optional | e.g. `USD`, `EUR`, `MAD`. | Multi-currency shop baseline. |
| **SUPPORTED_LOCALES** | Optional | e.g. `en,fr,es,ar`. | Phased market rollouts. |
| **IPSTACK_API_KEY** | Optional | IP geolocation API key. | Auto-detect country for currency/locale. |
| **ENCRYPTION_KEY** | Optional | 32-byte key (e.g. base64). | Encrypt OAuth tokens, tax IDs at rest. |
| **CORS_ALLOWED_ORIGINS** | Optional | Comma-separated origins. | Strict API origin allowlist (override FRONTEND_URL list). |
| **CLOUDFLARE_WEBHOOK_SECRET** | Optional | Cloudflare Turnstile/Captcha secret. | Bot protection for bookings/signup. |
| **CLOUDINARY_URL** | Optional | Cloudinary cloud URL. | Image optimization, thumbnails for portfolios. |
| **VAT_LAYER_API_KEY** | Optional | VAT Layer (or similar) API key. | Real-time VAT/sales tax at checkout. |
| **PDF_GENERATOR_API_KEY** | Optional | e.g. Browserless, PDFMonkey, DocuSign. | Invoices, contracts; prefer one with digital signatures. |
| **INTERCOM_APP_ID** | Optional | Intercom app ID. | Customer support chat (can be passed to frontend). |
| **UNSPLASH_ACCESS_KEY** | Optional | Unsplash API key. | Stock placeholder images for storefronts. |

### Frontend (Vite / build-time)

| Variable | Required | Description | Where used |
|----------|----------|-------------|------------|
| **VITE_API_URL** | Yes (prod) | Backend base URL (e.g. `https://shopthebarber-api.onrender.com`). No trailing slash. | `src/api/apiClient.js` (BASE_URL). |
| **VITE_sovereign_APP_ID** | No | Legacy/app param default. | `src/lib/app-params.js`. |
| **VITE_sovereign_BACKEND_URL** | No | Legacy server URL default. | `src/lib/app-params.js`. |
| **VITE_GA_MEASUREMENT_ID** | No | Google Analytics 4 measurement ID (e.g. `G-XXXXXXXXXX`). | Reserved; wire in `src/lib/analytics.js` + NavigationTracker. |
| **VITE_POSTHOG_KEY** | No | PostHog project API key (covers analytics + nav tracking). | Reserved; wire in analytics init + NavigationTracker. |
| **VITE_POSTHOG_HOST** | No | PostHog host (e.g. `https://app.posthog.com`). | Reserved. |
| **VITE_PLAUSIBLE_DOMAIN** | No | Plausible domain (e.g. `yourapp.com`). | Reserved; script in index.html or analytics module. |
| **VITE_MIXPANEL_TOKEN** | No | Mixpanel project token. | Reserved; wire in analytics init. |
| **VITE_SENTRY_DSN** | No | Sentry DSN for frontend error tracking. | Reserved; init in `main.jsx`. |
| **VITE_INTERCOM_APP_ID** | No | Intercom app ID for support widget. | Reserved; load Intercom script when set. |
| **VITE_CDN_URL** | No | CDN base URL for images/assets (if different from API). | Reserved; asset URLs when using S3/CloudFront. |

### CI / Hosting (e.g. GitHub Actions, Render, Vercel)

| Variable | Context | Description |
|----------|---------|-------------|
| **NODE_ENV** | Build/runtime | Set to `production` in production. |
| **VITE_API_URL** | Vercel (build) | Set so frontend build gets correct API URL. |
| **JWT_SECRET**, **STRIPE_***, **RESEND_***, **FRONTEND_URL**, **BACKEND_URL**, **GOOGLE_***, etc. | Render (runtime) | Same as server list above; set in Render dashboard. |

---

## Part 3 — Single Checklist (Copy-Paste)

**Server (e.g. Render)**  
`JWT_SECRET` · `FRONTEND_URL` · `BACKEND_URL` · `PORT` · `NODE_ENV` · `STRIPE_API_KEY` · `STRIPE_PUBLISHABLE_KEY` · `STRIPE_WEBHOOK_SECRET` · `RESEND_API_KEY` · `EMAIL_FROM` · `GOOGLE_CLIENT_ID` · `GOOGLE_CLIENT_SECRET` · `FACEBOOK_APP_ID` · `FACEBOOK_APP_SECRET` · `LINKEDIN_CLIENT_ID` · `LINKEDIN_CLIENT_SECRET` · `GOOGLE_MAPS_API_KEY` · `MAPBOX_ACCESS_TOKEN` · `TWILIO_ACCOUNT_SID` · `TWILIO_AUTH_TOKEN` · `TWILIO_WHATSAPP_NUMBER` · `LOCAL_AI_ENDPOINT` · `GROK_API_KEY` · `DATABASE_PATH` · `SENTRY_DSN` · `SENTRY_AUTH_TOKEN` · `SENTRY_ENVIRONMENT` · `ANALYTICS_WRITE_KEY` · `NAVIGATION_TRACKING_ENABLED` · `DATADOG_API_KEY` · `NEW_RELIC_LICENSE_KEY` · `LOG_LEVEL` · `AWS_S3_BUCKET_NAME` · `AWS_ACCESS_KEY_ID` · `AWS_SECRET_ACCESS_KEY` · `AWS_REGION` · `CDN_URL` · `REDIS_URL` · `DEFAULT_CURRENCY` · `SUPPORTED_LOCALES` · `IPSTACK_API_KEY` · `ENCRYPTION_KEY` · `CORS_ALLOWED_ORIGINS` · `CLOUDFLARE_WEBHOOK_SECRET` · `CLOUDINARY_URL` · `VAT_LAYER_API_KEY` · `PDF_GENERATOR_API_KEY` · `INTERCOM_APP_ID` · `UNSPLASH_ACCESS_KEY`

**Frontend (e.g. Vercel)**  
`VITE_API_URL` · `VITE_sovereign_APP_ID` · `VITE_sovereign_BACKEND_URL` · `VITE_GA_MEASUREMENT_ID` · `VITE_POSTHOG_KEY` · `VITE_POSTHOG_HOST` · `VITE_PLAUSIBLE_DOMAIN` · `VITE_MIXPANEL_TOKEN` · `VITE_SENTRY_DSN` · `VITE_INTERCOM_APP_ID` · `VITE_CDN_URL`

---

## Part 4 — LinkedIn: Where It Fits

- **Auth**: “Sign in with LinkedIn” → same flow as Google (authorize URL, callback, create or link user by email, issue JWT).
- **Roles**: Especially valuable for **barber**, **shop_owner**, and **manager** (and applicants in Career Hub).
- **Profile import**: After LinkedIn login (or a “Import from LinkedIn” button in Professional Portfolio / Barber profile), call LinkedIn API for profile (headline, summary, positions, skills) and prefill:
  - `applicant_profiles`: professional_summary, work_experience, skills, portfolio_links (e.g. LinkedIn URL).
  - `barbers`: bio, or new fields like `linkedin_url`, `headline`.
- **Manager view**: In ApplicantReview, show “LinkedIn” link and “Imported from LinkedIn” when applicable.

Adding LinkedIn Sign-In and optional profile import will make the platform clearly professional and manager-friendly while keeping a single, consistent env and auth model.
