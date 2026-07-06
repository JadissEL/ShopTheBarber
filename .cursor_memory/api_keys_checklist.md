# API keys & secrets — finalization checklist

**Local vault (gitignored):** [`secrets.local.env`](../secrets.local.env) — master copy of all keys.  
**Render deploy:** [`render.secrets.local.env`](../render.secrets.local.env) → `node scripts/apply-render-env.mjs`  
**Never commit** real values; only `.env.example` files are tracked.

**Purpose:** Single reference for a later guided walkthrough (“set all keys at once”).  
**Last updated:** 2026-06-26  
**Rule:** Never commit real values. Only `.env.example` files are tracked.

---

## Quick map — where each secret lives

| Secret / config | Local dev | Render (API) | Vercel (frontend) | GitHub Actions | External dashboard |
|-----------------|-----------|--------------|-------------------|----------------|--------------------|
| `DATABASE_URL` | `server/.env` | ✅ required | — | `TEST_DATABASE_URL` (CI only) | [Neon](https://console.neon.tech) |
| `CLERK_SECRET_KEY` | `server/.env` | ✅ required | — | `CLERK_SECRET_KEY` (E2E optional) | [Clerk](https://dashboard.clerk.com) |
| `VITE_CLERK_PUBLISHABLE_KEY` | `.env.local` (root) | — | ✅ required | — | Clerk (same app as secret) |
| `VITE_API_URL` | optional in `.env.local` | — | ✅ required (prod) | — | Your Render service URL |
| `FRONTEND_URL` | `server/.env` | ✅ required | — | — | Your Vercel URL |
| `VITE_SITE_URL` | `.env.local` | — | ✅ recommended | — | Public site origin (canonical/sitemap) |
| `STRIPE_API_KEY` | `server/.env` or `.stripe-keys.json` | ✅ for payments | — | — | [Stripe](https://dashboard.stripe.com/apikeys) |
| `STRIPE_PUBLISHABLE_KEY` | same | ✅ (served via API) | — | — | Stripe |
| `STRIPE_WEBHOOK_SECRET` | same | ✅ for webhooks | — | — | Stripe → Webhooks endpoint |
| `SENTRY_DSN` | `server/.env` | ✅ recommended | — | — | [Sentry](https://sentry.io) Node project |
| `VITE_SENTRY_DSN` | `.env.local` | — | ✅ recommended | — | Sentry React/Vite project |
| `RESEND_API_KEY` | `server/.env` | optional | — | — | [Resend](https://resend.com) |
| `TWILIO_ACCOUNT_SID` | `server/.env` | optional | — | — | [Twilio](https://console.twilio.com) |
| `TWILIO_AUTH_TOKEN` | `server/.env` | optional | — | — | Twilio |
| `TWILIO_PHONE_NUMBER` | `server/.env` | optional | — | — | Twilio (E.164, SMS-capable) |
| `UPSTASH_REDIS_REST_URL` | `server/.env` | ✅ required (prod) | — | — | [Upstash](https://console.upstash.com) |
| `UPSTASH_REDIS_REST_TOKEN` | `server/.env` | ✅ required (prod) | — | — | Upstash |
| `MAPBOX_ACCESS_TOKEN` | `server/.env` | ✅ required (prod)* | — | — | Mapbox (*or `GOOGLE_MAPS_API_KEY`) |
| `CRON_SECRET` | `server/.env` | dev optional | ✅ required | ✅ `CRON_SECRET` | Generate random string (openssl rand -hex 32) |
| `EMAIL_FROM` | `server/.env` | optional | — | — | Resend verified domain |
| `PRODUCTION_API_URL` | — | — | — | ✅ uptime workflow | Same as Render URL |
| `SLACK_WEBHOOK_URL` | — | — | — | optional | Slack incoming webhook |
| `E2E_CLERK_JWT` | local shell | — | — | optional (Playwright) | Clerk session token (manual) |
| `E2E_CLERK_USER_EMAIL` | local shell | — | — | optional (Playwright) | Clerk test user email |
| `SUPPORT_DESK_USER_ID` | `server/.env` | optional | — | — | Internal user UUID in DB |
| `RENDER_API_KEY` | Windows user env | — | — | — | Render account (ops/MCP only) |

---

## 1. Local development files

### Root — `.env.local` (copy from `.env.example`)

| Variable | Required locally? | Notes |
|----------|-------------------|-------|
| `VITE_CLERK_PUBLISHABLE_KEY` | **Yes** | App shows “Clerk Not Configured” without it |
| `VITE_API_URL` | No (dev proxy) | Vite proxies `/api` → `localhost:3001`; set for prod-like testing |
| `VITE_SITE_URL` | No | Defaults to `https://shop-the-barber.vercel.app` |
| `VITE_SENTRY_DSN` | No | Client error tracking |
| `VITE_SENTRY_ENVIRONMENT` | No | e.g. `development` |
| `VITE_SENTRY_RELEASE` | No | Git SHA for release tracking |

### Server — `server/.env` (copy from `server/.env.example`)

| Variable | Required locally? | Notes |
|----------|-------------------|-------|
| `DATABASE_URL` | **Yes** | Neon pooled connection string |
| `TEST_DATABASE_URL` | For integration tests | Isolated Neon branch recommended |
| `CLERK_SECRET_KEY` | **Yes** (with Clerk) | Same Clerk application as frontend publishable key |
| `CLERK_PUBLISHABLE_KEY` | No | Optional duplicate for scripts |
| `FRONTEND_URL` | Recommended | `http://localhost:5173` or `http://localhost:3000` |
| `BACKEND_URL` | OAuth placeholder | `http://localhost:3001` — OAuth routes not active in current codebase |
| `STRIPE_API_KEY` | For payments | `sk_test_...` or `sk_live_...` |
| `STRIPE_PUBLISHABLE_KEY` | For payments | `pk_test_...` — also exposed via `GET /api/payments/config` |
| `STRIPE_WEBHOOK_SECRET` | For webhooks | `whsec_...` — Stripe CLI or dashboard endpoint |
| `SENTRY_DSN` | No | Server error tracking |
| `SENTRY_ENVIRONMENT` | No | e.g. `development` |
| `SENTRY_TRACES_SAMPLE_RATE` | No | Default `0.1` |
| `SENTRY_RELEASE` | No | Git SHA |
| `RESEND_API_KEY` | No | Email disabled without it |
| `EMAIL_FROM` | No | e.g. `Shop The Barber <noreply@yourdomain.com>` |
| `SUPPORT_DESK_USER_ID` | No | UUID of admin user for support desk routing |
| `GOOGLE_CLIENT_*` / `APPLE_*` | No | Listed in `.env.example`; **not wired in current server code** |

### Local Stripe fallback (optional)

- File: `server/.stripe-keys.json` (gitignored)
- Populate via: `cd server && STRIPE_API_KEY=sk_... npm run set-stripe-keys`
- Env vars **override** the file at runtime.

---

## 2. Render — backend (`shopthebarber-api`)

**Dashboard:** Render → Web Service → Environment  
**Blueprint:** `render.yaml` (secrets marked `sync: false` — set manually)

### Required for production boot

| Variable | How to get it |
|----------|---------------|
| `DATABASE_URL` | Neon → Project `shopthebarber` → **pooled** connection string (`?sslmode=require`) |
| `CLERK_SECRET_KEY` | Clerk → Secret key (same app as Vercel publishable key) |
| `FRONTEND_URL` | Vercel production URL, no trailing slash |
| `UPSTASH_REDIS_REST_URL` | Upstash → REST API URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash → REST token |
| `MAPBOX_ACCESS_TOKEN` or `GOOGLE_MAPS_API_KEY` | Mapbox or Google Cloud geocoding |

### Required for payments (Stripe Connect, checkout)

| Variable | How to get it |
|----------|---------------|
| `STRIPE_API_KEY` | Stripe Dashboard → Developers → API keys → Secret key |
| `STRIPE_PUBLISHABLE_KEY` | Stripe → Publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → Add endpoint → `https://<render-host>/api/webhooks/stripe` → Signing secret |

### Recommended (observability)

| Variable | Value |
|----------|-------|
| `SENTRY_DSN` | Sentry Node.js project DSN |
| `SENTRY_ENVIRONMENT` | `production` |
| `SENTRY_TRACES_SAMPLE_RATE` | `0.1` |
| `SENTRY_RELEASE` | Git SHA (or rely on `RENDER_GIT_COMMIT`) |

### Optional

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` | Transactional email |
| `EMAIL_FROM` | Sender address (Resend verified domain) |
| `SUPPORT_DESK_USER_ID` | Support ticket routing |

### Auto-set by Render

| Variable | Notes |
|----------|-------|
| `NODE_ENV` | `production` (in `render.yaml`) |
| `PORT` | Injected by Render |
| `RENDER_GIT_COMMIT` | Used as Sentry release fallback |

### Build pipeline (uses `DATABASE_URL` at build time)

- Command: `npm install --include=dev && node scripts/build-database.mjs`
- Runs: `prisma migrate deploy` → schema verify → **barber city backfill**

---

## 3. Vercel — frontend

**Dashboard:** Vercel → Project → Settings → Environment Variables  
Apply to **Production** (and Preview if desired).

| Variable | Required? | Value |
|----------|-----------|-------|
| `VITE_CLERK_PUBLISHABLE_KEY` | **Yes** | Clerk publishable key (`pk_test_...` or `pk_live_...`) |
| `VITE_API_URL` | **Yes** | Render API origin, no trailing slash, e.g. `https://shopthebarber.onrender.com` |
| `VITE_SITE_URL` | Recommended | Public site URL for SEO/sitemap/canonicals |
| `VITE_SENTRY_DSN` | Recommended | Sentry React project DSN |
| `VITE_SENTRY_ENVIRONMENT` | Recommended | `production` |
| `VITE_SENTRY_RELEASE` | Optional | Git SHA |

**Build note:** `prebuild` runs `scripts/generate-sitemap.mjs` — fetches live sitemap from `VITE_API_URL` when set.

---

## 4. Neon — database (not an “API key” in app env, but critical)

| Item | Where used | Notes |
|------|------------|-------|
| Connection string | `DATABASE_URL` on Render | Use **pooled** host for runtime |
| Direct connection | Local migrations only | Neon dashboard → direct URL for `prisma migrate dev` |
| Test branch | `TEST_DATABASE_URL` | GitHub CI + local integration tests |
| Project ID | Ops reference | `purple-glade-90739580` (shopthebarber) |
| Production branch | Ops reference | `br-mute-bar-afuyo1w3` |

**Never commit** connection strings. Rotate in Neon if leaked.

---

## 5. GitHub — repository secrets

**Settings → Secrets and variables → Actions**

| Secret | Used by | Value |
|--------|---------|-------|
| `TEST_DATABASE_URL` | `.github/workflows/ci.yml` | Neon test branch connection string |
| `PRODUCTION_API_URL` | `.github/workflows/uptime-monitor.yml` | Render API URL (no trailing slash) |
| `CRON_SECRET` | `.github/workflows/booking-sms-reminders.yml` | Same as Render `CRON_SECRET` |
| `SLACK_WEBHOOK_URL` | uptime-monitor (optional) | Slack incoming webhook URL |
| `CLERK_SECRET_KEY` | `playwright-api.yml` (optional browser E2E) | Same as Render |
| `E2E_CLERK_USER_EMAIL` | playwright-api (optional) | Existing Clerk test user |
| `E2E_CLERK_JWT` | playwright-api (optional) | Short-lived Clerk session JWT for Bearer tests |

**Manual workflows (no secrets required except above):**

- **Playwright API checks** — input `api_base_url`, optional Clerk flags
- **Uptime Monitor** — needs `PRODUCTION_API_URL`

---

## 6. External services — setup order for finalization

Recommended order when we walk through together:

1. **Neon** — confirm production branch, copy pooled `DATABASE_URL` → Render  
2. **Clerk** — one application; copy publishable → Vercel, secret → Render (+ GitHub if E2E)  
3. **Render** — set env vars, redeploy, verify `GET /api/health/ready`  
4. **Vercel** — set `VITE_*`, redeploy, verify site loads and API calls work  
5. **Cross-link** — `FRONTEND_URL` on Render = Vercel URL; `VITE_API_URL` on Vercel = Render URL  
6. **Stripe** — test keys first; webhook endpoint on Render; Connect for provider payouts  
7. **Sentry** — two projects (Node + React); DSNs to Render + Vercel  
8. **Resend** — API key + verified domain → `EMAIL_FROM`  
9. **Twilio** — Account SID, Auth Token, phone number → Render; enable SMS on Twilio number; set **inbound webhook** (see §10)  
10. **GitHub secrets** — `PRODUCTION_API_URL`, `CRON_SECRET`, `TEST_DATABASE_URL`, optional Slack + E2E  
11. **Smoke tests** — curl health, sign-in, booking flow, Stripe test payment, manual cron POST  

---

## 7. Stripe webhook URL (production)

```
https://<your-render-service>.onrender.com/api/webhooks/stripe
```

Events needed: checkout sessions, Connect account updates (verify in `server/src/webhooks/stripe.ts` when configuring).

---

## 10. Twilio inbound SMS webhook (STOP opt-out)

In Twilio Console → Phone Numbers → your SMS number → **Messaging**:

```
https://<your-render-service>.onrender.com/api/webhooks/twilio/sms
```

Method: **POST**. Users who reply `STOP`, `UNSUBSCRIBE`, etc. are opted out (`sms_reminders_enabled = false`).

**Cron (hourly reminders):** GitHub Actions workflow `booking-sms-reminders.yml` → `POST /api/cron/booking-reminders` with header `x-cron-secret: $CRON_SECRET`. Sends both SMS and email reminders ~24h before appointments.

**Optional env:** `SMS_REMINDERS_ENABLED=false` disables all outbound SMS; `SMS_REMINDER_HOURS_BEFORE` (default 24); `SMS_REMINDER_WINDOW_MINUTES` (default 60).

---

## 8. Clerk allowed origins (finalization)

In Clerk Dashboard → Configure → Domains / Allowed origins:

- Local: `http://localhost:5173`, `http://localhost:3000`
- Production: Vercel URL
- Preview: `*.vercel.app` if using preview deploys

---

## 9. Files that must stay out of git

| Path | Contains |
|------|----------|
| `.env`, `.env.local`, `server/.env` | All runtime secrets |
| `server/.stripe-keys.json` | Stripe keys (local fallback) |
| Any file with `sk_live`, `whsec_`, `postgresql://` passwords | Rotate if committed |

---

## 10. Legacy / stale documentation notes

These appear in older docs but **current server code is Clerk-only** (no `@fastify/jwt` in `server/src/`):

- `JWT_SECRET` — mentioned in `DEPLOYMENT.md`, `README.md`, `App.jsx` help text; **not in `server/.env.example` or startup validation**. Safe to ignore unless legacy auth is reintroduced.
- `GOOGLE_CLIENT_*` / `APPLE_*` — in `server/.env.example` only; no active OAuth routes in codebase.

When finalizing, we will align docs vs reality.

---

## 11. Ops keys (not app runtime)

| Key | Where | Purpose |
|-----|-------|---------|
| `RENDER_API_KEY` | Windows user env (per `POSTGRESQL_MIGRATION_COMPLETE.md`) | Render API / MCP deploy ops |
| Neon API / MCP | Cursor MCP plugin | Database inspection, migrations |
| Vercel token | Cursor MCP / CLI | Deploy ops |

---

## 12. Finalization session — what to prepare

Before the guided walkthrough, have browser tabs open for:

- [Neon console](https://console.neon.tech) — connection strings  
- [Clerk dashboard](https://dashboard.clerk.com) — API keys, domains  
- [Render dashboard](https://dashboard.render.com) — env vars for `shopthebarber-api`  
- [Vercel dashboard](https://vercel.com) — env vars for frontend project  
- [Stripe dashboard](https://dashboard.stripe.com) — API keys + webhooks (test mode first)  
- [Sentry](https://sentry.io) — two DSNs  
- [Resend](https://resend.com) — API key + domain (if email wanted)  
- [GitHub repo Settings → Secrets](https://github.com) — Actions secrets  

Say: **“Walk me through all API keys”** and reference this file.
