# Observability and production data

This project uses **structured logging via Fastify** out of the box (`fastify.logger`). For production workloads, extend with the patterns below rather than scattering `console.log` in routes.

## Error tracking

- **Recommended**: `@sentry/node` (Fastify instrumentation) plus `@sentry/react` on the Vite app. Capture unhandled exceptions, 500 responses, and client navigation errors.
- **Environment**: `SENTRY_DSN` — not wired by default so the repo stays dependency-light; add SDKs when you need a centralized dashboard.
- Until Sentry is added, rely on **Render / Vercel build & runtime logs** and Fastify logs for traces.

## Health

- **`GET /api/health`** — pings the database (`users` probe). Wire uptime monitors / load balancers to this path on the deployed API host.

## Data persistence

- **Local dev**: SQLite file `server/sovereign.sqlite` (gitignored). Recreate with `npm run push` and `npm run seed` under `server/`.
- **Render / free tier**: Hosted SQLite without a persistent volume is typically **wiped on redeploy**. For real customer data treat one of these as mandatory:
  1. **Persistent disk / paid plan** backing the SQLite file, or  
  2. **PostgreSQL** (Drizzle is engine-friendly; migration is production work but avoids surprise data loss).

Document your chosen persistence in your deployment checklist next to [`docs/DEPLOYMENT.md`](DEPLOYMENT.md).

## Frontend API base URL

- Production builds resolve the API via `VITE_API_URL`; local dev proxies `/api` to port 3001 (see `vite.config.js`).
