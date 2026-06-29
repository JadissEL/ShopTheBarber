# Observability and production data

ShopTheBarber runs **Fastify + Prisma on Neon PostgreSQL** (Render API, Vercel frontend). This document covers error tracking, health checks, uptime monitoring, and database stability.

## Error tracking (Sentry)

Both apps ship with Sentry SDKs wired but **disabled until you set DSN env vars**.

| Layer | Package | Env vars |
|-------|---------|----------|
| API (Render) | `@sentry/node` | `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE`, optional `SENTRY_RELEASE` |
| Frontend (Vercel) | `@sentry/react` | `VITE_SENTRY_DSN`, `VITE_SENTRY_ENVIRONMENT`, optional `VITE_SENTRY_RELEASE` |

### Setup

1. Create a Sentry org/project at [sentry.io](https://sentry.io) — one **Node/Fastify** project for the API and one **React** project for the client.
2. Copy DSNs into Render (`SENTRY_DSN`) and Vercel (`VITE_SENTRY_DSN`).
3. Redeploy both services.

### What gets captured

- **Server**: unhandled 5xx errors (global Fastify error handler), optional transaction traces (10% in production).
- **Client**: React error boundary crashes, session replay on errors (production), browser traces (10%).

Auth headers and cookies are stripped before events are sent.

## Health endpoints

Wire load balancers and uptime tools to these paths on the **API host** (not Vercel):

| Path | Purpose |
|------|---------|
| `GET /api/health/live` | Process alive — always 200 if the server is running |
| `GET /api/health/ready` | **Production readiness** — DB + migrations + critical schema (`promo_targeting`, `fixed_fee`, `offers_mobile_service`) |
| `GET /api/health` | Deep check in production; lightweight DB ping in development |

Render uses `healthCheckPath: /api/health/ready` (see `render.yaml`).

A 503 response includes `checks` showing which schema objects are missing.

## Uptime monitoring

### GitHub Actions (included)

Workflow [`.github/workflows/uptime-monitor.yml`](../.github/workflows/uptime-monitor.yml) runs every **5 minutes** and calls `/api/health/ready`.

**Required secret:** `PRODUCTION_API_URL` — base URL of the Render API (no trailing slash).

**Optional:** `SLACK_WEBHOOK_URL` — posts an alert when the check fails.

### External monitors (recommended redundancy)

Also configure one of:

- [Better Stack Uptime](https://betterstack.com/uptime) — HTTP monitor on `/api/health/ready`, alert via email/Slack/PagerDuty
- [UptimeRobot](https://uptimerobot.com) — free tier, 5‑minute interval
- Render dashboard — service health from `healthCheckPath`

## Production alerts (Sentry)

After DSNs are set, configure in Sentry → **Alerts**:

| Alert | Condition | Action |
|-------|-----------|--------|
| API errors spike | Issue count > 10 in 5 min (production, `shopthebarber-api`) | Email + Slack |
| New fatal issue | First seen, level fatal/error | Email |
| Health degradation | Custom: GitHub uptime workflow failure | Slack (via webhook secret) |

Enable **Release Health** if you set `SENTRY_RELEASE` / `VITE_SENTRY_RELEASE` to your git SHA on deploy.

## Public status page

| Path | Purpose |
|------|---------|
| `GET /api/status/public` | JSON status for API, DB, geocoding, payments + optional incidents |
| Frontend `/StatusPage` | User-facing status (linked from Help Center + footer) |

**Active incidents:** set Render env `STATUS_PAGE_INCIDENTS` to a JSON array:

```json
[{"title":"Brief title","status":"investigating","message":"User-visible update","updated_at":"2026-06-26T12:00:00Z"}]
```

Status values: `investigating` | `identified` | `monitoring` | `resolved`.

**Incident response:** see [INCIDENT_RUNBOOK.md](./INCIDENT_RUNBOOK.md).

## Database stability (Neon + Prisma)

### Runtime

- **Single source of truth:** Neon PostgreSQL via `DATABASE_URL`.
- **Migrations:** `prisma migrate deploy` runs on every Render build (`scripts/build-database.mjs`).
- **Post-migrate verification:** `scripts/verify-production-schema.mjs` asserts critical objects exist.

### Critical schema (verified on every deploy)

- `barbers.offers_mobile_service`
- `provider_fixed_fee_plans` + `pricing_rules.fixed_fee_monthly_barber`
- `promo_codes.audience` + `promo_code_targets` (promo targeting)
- VIP / group booking columns and `group_booking_guests`

Local verification (with production or staging `DATABASE_URL`):

```bash
cd server
npm run verify:schema
```

### Neon project

Production database: Neon project **shopthebarber** (`purple-glade-90739580`), primary branch. Use the Neon MCP integration or dashboard for SQL inspection and branch management — never commit connection strings.

### If deploy fails schema verify

1. Check Render build logs for failed migration name.
2. Fix migration SQL (prefer idempotent `IF NOT EXISTS` patterns).
3. Run `npx prisma migrate deploy` against Neon (from CI secret or local with `DATABASE_URL`).
4. Re-run `npm run verify:schema`.

## Logging

Fastify structured logging (`fastify.log`) remains the first line of defense. Sentry complements logs for aggregation and alerting; Render/Vercel runtime logs retain full detail for debugging.

## Frontend API base URL

Production builds resolve the API via `VITE_API_URL`; local dev proxies `/api` to port 3001 (see `vite.config.js`).

See also [`docs/DEPLOYMENT.md`](DEPLOYMENT.md) for full deploy checklist.
