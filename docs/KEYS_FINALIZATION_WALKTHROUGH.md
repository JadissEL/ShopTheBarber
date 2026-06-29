# API keys finalization — guided walkthrough

Use this doc when you say **“Walk me through all API keys.”**  
Full variable reference: [`.cursor_memory/api_keys_checklist.md`](../.cursor_memory/api_keys_checklist.md).

---

## Before you start

1. Open browser tabs: [Neon](https://console.neon.tech), [Clerk](https://dashboard.clerk.com), [Render](https://dashboard.render.com), [Vercel](https://vercel.com), [Stripe](https://dashboard.stripe.com), [Sentry](https://sentry.io), [GitHub Actions secrets](https://github.com/settings/secrets/actions).
2. Local check (no values printed):

   ```bash
   npm run verify:secrets
   npm run verify:secrets -- --probe-production   # if PRODUCTION_API_URL or VITE_API_URL is set
   ```

3. After deploy, admin UI: **`/AdminKeysWalkthrough`** (server-side boolean checks only).

---

## Step 1 — Neon (database)

| Action | Where |
|--------|--------|
| Copy **pooled** `DATABASE_URL` | Neon → shopthebarber → Connection string (pooler) |
| Paste on Render | `shopthebarber-api` → Environment → `DATABASE_URL` |
| Test branch for CI | GitHub secret `TEST_DATABASE_URL` |

**Verify:** Render redeploy → `GET https://<api>/api/health/ready` returns `"db":"ok"`.

---

## Step 2 — Clerk (auth)

| Variable | Destination |
|----------|-------------|
| `CLERK_SECRET_KEY` | Render |
| `VITE_CLERK_PUBLISHABLE_KEY` | Vercel (Production + Preview) |

**Clerk dashboard:** add allowed origins — localhost, Vercel prod URL, `*.vercel.app` for previews.

**Verify:** Sign in on production site; `GET /api/auth/me` returns user.

---

## Step 3 — Cross-link URLs

| Variable | Value |
|----------|--------|
| `FRONTEND_URL` (Render) | Vercel production URL, no trailing slash |
| `VITE_API_URL` (Vercel) | Render API URL, no trailing slash |
| `VITE_SITE_URL` (Vercel) | Public marketing URL (SEO/sitemap) |

**Verify:** Browser network tab — API calls hit Render, not localhost.

---

## Step 4 — Upstash + geocoding (prod required)

| Variable | Render |
|----------|--------|
| `UPSTASH_REDIS_REST_URL` | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |
| `MAPBOX_ACCESS_TOKEN` **or** `GOOGLE_MAPS_API_KEY` | Geocoding provider |

**Verify:** `/api/health/ready` → `geocoding.production_ready: true`.

---

## Step 5 — Stripe (payments)

| Variable | Where |
|----------|--------|
| `STRIPE_API_KEY` | Render (`sk_test_` first) |
| `STRIPE_PUBLISHABLE_KEY` | Render |
| `STRIPE_WEBHOOK_SECRET` | Render — from webhook endpoint |

**Webhook URL:**

```
https://<render-host>/api/webhooks/stripe
```

**Verify:** Test checkout + Connect onboarding in staging.

---

## Step 6 — Observability

| Variable | Where |
|----------|--------|
| `SENTRY_DSN` | Render |
| `VITE_SENTRY_DSN` | Vercel |
| `PRODUCTION_API_URL` | GitHub secret (uptime workflow) |
| `SLACK_WEBHOOK_URL` | GitHub (optional alerts) |

**Verify:** [Status page](/StatusPage), GitHub Actions → **Uptime Monitor** green.

---

## Step 7 — Email & SMS (optional)

| Variable | Purpose |
|----------|---------|
| `RESEND_API_KEY` + `EMAIL_FROM` | Booking emails |
| `TWILIO_*` | SMS reminders + STOP webhook |
| `CRON_SECRET` | GitHub `booking-sms-reminders` workflow |

**Twilio inbound webhook:** `POST /api/webhooks/twilio/sms`

---

## Step 8 — Support routing (optional)

| Variable | Purpose |
|----------|---------|
| `SUPPORT_DESK_USER_ID` | UUID of admin user — support tickets route here |

**Verify:** Client opens Support Chat → ticket appears in **Admin Support Inbox**.

---

## Step 9 — Smoke test checklist

- [ ] `GET /api/health/live` → 200  
- [ ] `GET /api/health/ready` → 200, migrations + schema ok  
- [ ] `GET /api/status/public` → overall operational  
- [ ] Sign in (Clerk)  
- [ ] Create booking (test mode Stripe)  
- [ ] Admin → **API keys** walkthrough — all required green  
- [ ] GitHub **Uptime Monitor** scheduled run succeeds  

---

## Incident during key rotation

If a bad secret is deployed:

1. Roll back Render/Vercel env to last known good (see [INCIDENT_RUNBOOK.md](./INCIDENT_RUNBOOK.md)).
2. Re-run `npm run verify:secrets` locally before redeploy.
3. Post status on `/StatusPage` via `STATUS_PAGE_INCIDENTS` env (see incident runbook).
