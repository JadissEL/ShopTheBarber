# AGENTS.md

## Cursor Cloud specific instructions

**ShopTheBarber** is a barbershop booking SaaS platform with a React/Vite frontend (port 3000) and Fastify/SQLite backend (port 3001).

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Frontend | `npm run dev` (root) | 3000 | Proxies `/api` to backend via Vite config |
| Backend | `npm run dev` (`server/`) | 3001 | Fastify + SQLite (embedded, no external DB) |

### First-time database setup

If `server/sovereign.sqlite` does not exist or is corrupted, recreate it:

```bash
cd server
npm run push   # applies Drizzle schema to SQLite
npm run seed   # populates sample barbers, shops, services, shifts
```

If `npm run push` fails with "index already exists", delete `server/sovereign.sqlite` and re-run.

### Environment

Backend requires `server/.env` with at least `JWT_SECRET`. Copy from `server/.env.example`. Stripe, Resend, and AI keys are optional; the app gracefully degrades without them.

### Clerk + database user id (SQLite)

After pulling schema changes that add `users.clerk_user_id`, apply the **non-destructive** column migration (avoid `drizzle-kit push` if it prompts to drop tables):

```bash
cd server && node scripts/add-clerk-user-id-column.js
```

**PostgreSQL:** with `DATABASE_URL` set, apply versioned migrations (never rely on interactive `drizzle-kit push` in production):

```bash
cd server && npm run migrate
```

The first checked-in migration adds `users.clerk_user_id` idempotently ([`server/drizzle/0000_clerk_user_id.sql`](server/drizzle/0000_clerk_user_id.sql)). Local SQLite continues to use `npm run push` / `db:add-clerk-column` as above.

**Promo codes + bookings discount (SQLite):** after pulls that add `promo_codes.shop_id` / `bookings.discount_code`, run the additive script so local DB matches schema (skipped if DB or tables missing):

```bash
cd server && npm run db:add-promo-columns
```

**PostgreSQL:** those columns are applied by [`server/drizzle/0001_promo_shop_discount.sql`](server/drizzle/0001_promo_shop_discount.sql) via `npm run migrate`.

`npm run test` in `server/` runs `db:add-promo-columns` first so Vitest stays aligned with Drizzle schema.

### Native SQLite driver (server tests / local Node upgrades)

If Vitest fails loading `better-sqlite3` with `NODE_MODULE_VERSION` mismatch, rebuild the binary for your Node version:

```bash
cd server && npm rebuild better-sqlite3
```

### Optional Playwright API checks

**Staging health (no JWT):**

```bash
npx playwright install chromium   # once per machine / CI image
E2E_API_BASE_URL=https://your-api.example.com npm run test:e2e:health
```

**Clerk Bearer** (JWT from signed-in browser session — do not commit):

```bash
E2E_API_BASE_URL=https://your-api.example.com E2E_CLERK_JWT="<token_body>" npm run test:e2e -- e2e/clerk-bearer-api.spec.ts
```

Without env vars, specs **skip** (exit 0). GitHub Actions: **Playwright API checks** (manual `workflow_dispatch`) runs health against an input URL; optional Clerk Bearer step uses `E2E_CLERK_JWT`; optional **browser** step uses `@clerk/testing` (repo secrets `CLERK_SECRET_KEY`, `E2E_CLERK_USER_EMAIL`, input `frontend_base_url`).

**Clerk browser (@clerk/testing)** — frontend must be reachable and use the same Clerk app as `CLERK_SECRET_KEY`. Start locally: `npm run dev` + `cd server && npm run dev`, then:

```bash
npx playwright install chromium
set E2E_FRONTEND_URL=http://localhost:3000
set CLERK_SECRET_KEY=sk_test_...   # server key, same as server/.env — do not commit
set E2E_CLERK_USER_EMAIL=your-test-user@example.com
npm run test:e2e:clerk-browser
```

(PowerShell: ` $env:VAR="value" ` per line.)

### Postgres first deploy (`DATABASE_URL`)

If Postgres is empty, either run **`npx drizzle-kit push`** once from your machine against `DATABASE_URL`, or temporarily set **`DRIZZLE_BOOTSTRAP=push`** on Render for a single deploy (**remove immediately after** — can be destructive), then rely on **`migrate`** builds.

### Key commands

See `README.md` for the full list. Quick reference:

- **Lint**: `npm run lint` (root)
- **Frontend tests**: `npm run test` (root, Vitest + jsdom)
- **Backend tests**: `npm run test` (`server/`, Vitest)
- **Build**: `npm run build` (root, Vite production build)

### Production deployment

- **Frontend**: Vercel at `https://shop-the-barber.vercel.app` — env var `VITE_API_URL` points to backend
- **Backend**: Render at `https://shopthebarber.onrender.com` — env vars: `JWT_SECRET`, `FRONTEND_URL`, `STRIPE_API_KEY`, `STRIPE_PUBLISHABLE_KEY`
- **Database**: Auto-initializes on first boot — schema pushed during build, seed runs if barbers table is empty
- **Build command** (Render): `npm install --include=dev && node scripts/build-database.mjs` ([`render.yaml`](render.yaml)). With **`DATABASE_URL`** (Postgres), runs `drizzle-kit migrate` (additive). Without it, resets SQLite then `push` as before.
- **Start command** (Render): `npm run start`
- Render free tier: server spins down after inactivity; first request takes ~30s to cold-start
- SQLite on free tier is ephemeral (resets on redeploy). For persistent data, upgrade Render plan or migrate to PostgreSQL.

### Gotchas

- The auth registration endpoint is `/api/auth/register` and expects `full_name` (not `name`).
- Booking creation (`POST /api/bookings`) expects `date_text` in PPP format (e.g. "March 10, 2026") and `time_text` in "h:mm a" format (e.g. "10:00 AM"), not ISO date/time.
- The SQLite DB file is `server/sovereign.sqlite`. It is git-ignored and must be created locally via `npm run push` + `npm run seed`.
- Frontend proxy config lives in `vite.config.js` — all `/api` requests forward to `localhost:3001`.
- Zod v4 is used on the backend — use `.issues` (not `.errors`) for validation error handling.
- Server refuses to start in production without `JWT_SECRET` set.
- All entity write operations (CREATE/PATCH/DELETE) require JWT auth and ownership checks.
