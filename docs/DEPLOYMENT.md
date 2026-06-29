# Deploy ShopTheBarber (production)

**Canonical guide** for hosting the app: **Vercel** (frontend) + **Render** (API) + **Neon** (PostgreSQL). Older docs that mention SQLite, Drizzle, or `DRIZZLE_BOOTSTRAP` are **obsolete** — production uses **Prisma migrations only** (`server/scripts/build-database.mjs`).

**Related docs**

| Doc | Purpose |
|-----|---------|
| [GIT_BRANCHING_AND_DEPLOYMENT.md](GIT_BRANCHING_AND_DEPLOYMENT.md) | `master` (CI) → `main` (production deploy) |
| [NEON_PRISMA.md](NEON_PRISMA.md) | Neon project, local Prisma commands |
| [OBSERVABILITY_AND_DATA.md](OBSERVABILITY_AND_DATA.md) | Sentry, health checks, uptime workflow |
| [AGENTS.md](../AGENTS.md) | Agent/dev commands, E2E, geocoding |
| `.cursor_memory/api_keys_checklist.md` | Full env-var walkthrough |

**MCP deploy:** [DEPLOYMENT_MCP.md](DEPLOYMENT_MCP.md) (Vercel + Render MCP in Cursor).

---

## Architecture (current)

| Layer | Host | Branch | Build |
|-------|------|--------|-------|
| Frontend | Vercel | `main` | `npm run build` → `dist/` |
| API | Render (`render.yaml`) | `main` | `npm install --include=dev && node scripts/build-database.mjs` |
| Database | Neon PostgreSQL | — | `prisma migrate deploy` on every Render build |

**URLs (production):**

- Frontend: `https://shop-the-barber.vercel.app`
- API: `https://shopthebarber.onrender.com`
- Health: `GET https://shopthebarber.onrender.com/api/health/ready`

---

## Branching

- Develop and run CI on **`master`**.
- Promote to **`main`** only after CI passes ([GIT_BRANCHING_AND_DEPLOYMENT.md](GIT_BRANCHING_AND_DEPLOYMENT.md)).
- Vercel and Render production must deploy from **`main`** only.

---

## 1. Neon (database)

1. Create a [Neon](https://neon.tech) project (or use existing **shopthebarber**).
2. Copy the **pooled** connection string (`?sslmode=require`) → Render env **`DATABASE_URL`**.
3. Optional: create an isolated branch → GitHub secret **`TEST_DATABASE_URL`** for CI integration tests.
4. Local dev: set **`DATABASE_URL`** in `server/.env`, then:

```bash
cd server
npm run generate          # prisma generate
npx prisma migrate deploy # apply migrations
npm run seed              # sample barbers, shops, promos (optional)
```

**Never** use `drizzle-kit push` or SQLite paths in production. Migrations live in `server/prisma/migrations/`.

---

## 2. Render (backend API)

### Option A — Blueprint (recommended)

1. Render → **New** → **Blueprint** → connect repo.
2. Uses root [`render.yaml`](../render.yaml): service `shopthebarber-api`, root `server`, health check `/api/health/ready`.
3. Set **`sync: false`** secrets in the Render dashboard (see table below).

### Option B — Manual Web Service

| Setting | Value |
|---------|--------|
| Root directory | `server` |
| Build command | `npm install --include=dev && node scripts/build-database.mjs` |
| Start command | `npm run start` |
| Health check path | `/api/health/ready` |
| Production branch | `main` |

### Build pipeline (`build-database.mjs`)

Requires **`DATABASE_URL`** at build time. Runs in order:

1. `prisma generate`
2. `prisma migrate deploy`
3. `verify-production-schema.mjs`
4. Backfills: barber cities, coordinates, at-home areas

If build fails on schema verify, fix migrations locally and redeploy — do not bypass with manual SQL on production without a migration file.

### Render environment variables

#### Required (server refuses to start in production without these)

| Variable | Notes |
|----------|--------|
| `DATABASE_URL` | Neon pooled PostgreSQL URL |
| `CLERK_SECRET_KEY` | Same Clerk app as `VITE_CLERK_PUBLISHABLE_KEY` |
| `FRONTEND_URL` | Vercel URL, no trailing slash |
| `UPSTASH_REDIS_REST_URL` | [Upstash](https://console.upstash.com) REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |
| `MAPBOX_ACCESS_TOKEN` **or** `GOOGLE_MAPS_API_KEY` | Geocoding / address autocomplete |

#### Required for payments

| Variable | Notes |
|----------|--------|
| `STRIPE_API_KEY` | Secret key |
| `STRIPE_PUBLISHABLE_KEY` | Publishable key |
| `STRIPE_WEBHOOK_SECRET` | Endpoint: `POST /api/webhooks/stripe` on Render URL |

#### SMS reminders (optional but wired in `render.yaml`)

| Variable | Notes |
|----------|--------|
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` | SMS |
| `CRON_SECRET` | Same value as GitHub Actions secret for [booking-sms-reminders.yml](../.github/workflows/booking-sms-reminders.yml) |
| `SMS_REMINDER_HOURS_BEFORE` | Default `24` |

#### Recommended

| Variable | Notes |
|----------|--------|
| `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE` | Error tracking |
| `RESEND_API_KEY`, `EMAIL_FROM` | Transactional email |
| `SENTRY_RELEASE` | Git SHA (Render sets `RENDER_GIT_COMMIT`) |

Copy the full annotated list from [`server/.env.example`](../server/.env.example).

---

## 3. Vercel (frontend)

1. Import repo → **Framework**: Vite.
2. **Root directory**: repo root (default).
3. **Build**: `npm run build` · **Output**: `dist`.
4. **Production branch**: `main`.

### Vercel environment variables

| Variable | Required | Notes |
|----------|----------|--------|
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `VITE_API_URL` | Yes | Render API origin **without** `/api` suffix |
| `VITE_SITE_URL` | Recommended | Public site URL (SEO, sitemap) |
| `VITE_MAPBOX_ACCESS_TOKEN` | Recommended | Map tiles (falls back to OSM if unset) |
| `VITE_SENTRY_DSN` | Recommended | Client error tracking |

`prebuild` runs `scripts/generate-sitemap.mjs` (uses `VITE_API_URL` when set).

---

## 4. Cross-link frontend ↔ API

| Where | Variable | Value |
|-------|----------|--------|
| Render | `FRONTEND_URL` | `https://shop-the-barber.vercel.app` |
| Vercel | `VITE_API_URL` | `https://shopthebarber.onrender.com` |

Redeploy both after changing either URL. CORS on the API uses `FRONTEND_URL`.

---

## 5. Clerk

- One Clerk application for dev/staging/prod (or separate apps per environment — keys must match on Vercel + Render).
- Frontend: `VITE_CLERK_PUBLISHABLE_KEY` (root `.env.local`).
- Backend: `CLERK_SECRET_KEY` (`server/.env` / Render).
- Users linked via `users.clerk_user_id` in Neon.

See [CLERK_SETUP.md](CLERK_SETUP.md) for dashboard steps.

---

## 6. CI / post-deploy verification

### GitHub Actions CI (`.github/workflows/ci.yml`)

Runs on push/PR to `master` and `main`:

- **Frontend:** lint → `npm run test` (Vitest) → build
- **Server:** `prisma generate` → migrate + verify on **`TEST_DATABASE_URL`** (skipped if secret unset) → `npm run test`

### Manual smoke (no Clerk)

Actions → **Playwright API checks** → set `api_base_url` to Render URL → runs `e2e/health-public.spec.ts`.

Optional inputs: Clerk Bearer JWT, Clerk browser E2E (`CLERK_SECRET_KEY`, `E2E_CLERK_USER_EMAIL`).

Local:

```bash
# API health only
E2E_API_BASE_URL=https://shopthebarber.onrender.com npm run test:e2e:health

# Public mobile browser (frontend must be running or E2E_START_SERVERS=1)
E2E_START_SERVERS=1 npm run test:e2e:public
```

### Uptime

Workflow [uptime-monitor.yml](../.github/workflows/uptime-monitor.yml) — secret **`PRODUCTION_API_URL`** = Render API base URL.

---

## 7. Local development (aligned with production)

```bash
# Terminal 1 — API (requires server/.env with DATABASE_URL + CLERK_SECRET_KEY)
cd server && npm run dev    # http://localhost:3001

# Terminal 2 — Frontend (requires .env.local with VITE_CLERK_PUBLISHABLE_KEY)
npm run dev                 # http://localhost:3000 — proxies /api → 3001
```

There is **no** embedded SQLite database in the current server package. Use Neon (free tier or a dev branch) for local `DATABASE_URL`.

---

## Quick checklist

| Step | Where | What |
|------|--------|------|
| 1 | GitHub | `master` for dev/CI, `main` for production deploy |
| 2 | Neon | Pooled `DATABASE_URL` → Render |
| 3 | Render | Blueprint or manual; set required env vars; branch `main` |
| 4 | Vercel | `VITE_*` env vars; branch `main` |
| 5 | Cross-link | `FRONTEND_URL` ↔ `VITE_API_URL` |
| 6 | Stripe | Webhook to Render `/api/webhooks/stripe` |
| 7 | Verify | `GET /api/health/ready` → 200; Playwright health smoke |

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Render build fails immediately | `DATABASE_URL` missing at **build** time |
| `FATAL: missing … UPSTASH` | Set Upstash REST URL + token on Render |
| `FATAL: missing … MAPBOX` | Set Mapbox or Google geocoding key |
| API 503 on `/api/health/ready` | Render logs → failed migration or schema verify |
| Frontend “Clerk Not Configured” | `VITE_CLERK_PUBLISHABLE_KEY` on Vercel / `.env.local` |
| API calls fail from Vercel | `VITE_API_URL` must match Render; CORS `FRONTEND_URL` |
| Cold start ~30s | Render free tier spin-down — expected |

For deeper ops detail see [OBSERVABILITY_AND_DATA.md](OBSERVABILITY_AND_DATA.md) and [AGENTS.md](../AGENTS.md).
