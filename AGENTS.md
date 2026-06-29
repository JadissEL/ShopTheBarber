# AGENTS.md

## Cursor Cloud specific instructions

**ShopTheBarber** is a barbershop booking SaaS: **React/Vite** frontend (port 3000) and **Fastify + Prisma + Neon PostgreSQL** backend (port 3001).

> **Doc drift:** If another file mentions SQLite, Drizzle, `JWT_SECRET`, or `DRIZZLE_BOOTSTRAP`, treat **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** and **[docs/NEON_PRISMA.md](docs/NEON_PRISMA.md)** as canonical for production.

### Documentation (single source of truth)

| Topic | Canonical doc |
|-------|----------------|
| Deploy & production env | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| Database, Prisma, Neon, migrations | [docs/NEON_PRISMA.md](docs/NEON_PRISMA.md) |
| Tracker & architecture history | [PROJECT_TRACKER.md](PROJECT_TRACKER.md) |
| Repo layout | [PROJECT_SCHEMA.md](PROJECT_SCHEMA.md) |
| GTM: ICP, pricing, pilot, partners | [docs/ICP.md](docs/ICP.md), [docs/GTM_PRICING.md](docs/GTM_PRICING.md), `/pricing` |
| Marketplace legal (VAT, seller/buyer terms) | [docs/MARKETPLACE_LEGAL.md](docs/MARKETPLACE_LEGAL.md) |

**Schema source of truth:** `server/prisma/schema.prisma` and `server/prisma/migrations/`.

### Services

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Frontend | `npm run dev` (root) | 3000 | Proxies `/api` → backend via Vite |
| Backend | `npm run dev` (`server/`) | 3001 | Requires `DATABASE_URL` + `CLERK_SECRET_KEY` in `server/.env` |

### First-time database setup

```bash
cd server
cp .env.example .env
# Set DATABASE_URL (Neon pooled URL) and CLERK_SECRET_KEY

npm run generate
npx prisma migrate deploy
npm run seed    # optional — barbers, shops, promos for E2E
```

There is no local SQLite database in the current server package.

### Lint & typecheck

```bash
npm run lint          # ESLint (frontend + server)
npm run lint:fix
npm run typecheck     # Frontend (jsconfig)
npm run typecheck:server  # Backend strict TypeScript
```

### Environment

- **Frontend:** copy [`.env.example`](.env.example) → `.env.local` — **`VITE_CLERK_PUBLISHABLE_KEY`** required.
- **Backend:** copy [`server/.env.example`](server/.env.example) → `server/.env` — **`DATABASE_URL`**, **`CLERK_SECRET_KEY`** required for normal dev.

Production also requires Upstash Redis and Mapbox/Google geocoding on Render (see `server/src/index.ts` fail-fast).

### Optional Playwright API checks

**Staging health (no JWT):**

```bash
npx playwright install chromium
E2E_API_BASE_URL=https://your-api.example.com npm run test:e2e:health
```

**Clerk Bearer** (JWT from signed-in browser session — do not commit):

```bash
E2E_API_BASE_URL=https://your-api.example.com E2E_CLERK_JWT="<token_body>" npm run test:e2e -- e2e/clerk-bearer-api.spec.ts
```

Without env vars, specs **skip** (exit 0). GitHub Actions: **Playwright API checks** (`workflow_dispatch`) — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

**Clerk browser (@clerk/testing)** — frontend + API must be running; seed Neon (`npm run seed`):

```bash
npx playwright install chromium
set E2E_FRONTEND_URL=http://localhost:3000
set E2E_API_BASE_URL=http://localhost:3001
set CLERK_SECRET_KEY=sk_test_...
set E2E_CLERK_USER_EMAIL=your-client@example.com
set E2E_CLERK_PROVIDER_EMAIL=your-provider@example.com
set E2E_CLERK_ADMIN_EMAIL=admin@example.com
npm run test:e2e:clerk-browser
```

**Auto-start servers:** `E2E_START_SERVERS=1 npm run test:e2e:public` — Playwright boots `npm run dev` + `npm run dev:server`.

**Focused suites:**

| Script | Covers |
|--------|--------|
| `npm run test:e2e:health` | Public API smoke |
| `npm run test:e2e:api` | Booking checkout + promotions REST |
| `npm run test:e2e:booking` | Booking API + browser |
| `npm run test:e2e:promotions` | Provider/admin promo API + browser |
| `npm run test:e2e:geocoding` | Geocoding config + suggest |
| `npm run test:e2e:public` | Public routes, iPhone viewport (no Clerk) |
| `npm run test:e2e:mobile` | Public + authenticated mobile nav |
| `npm run test:e2e:clerk-browser` | All `*.browser.spec.ts` |

**Frontend unit tests:** `npm run test` — 64 Vitest tests (mobile nav, Explore critical path, onboarding, feature flags, GlobalFinancials, apiClient, libs).

Browser specs use seeded IDs from `e2e/fixtures/seed-data.ts` (`gb1`, `s1`, `DOWNTOWN10`, …).

(PowerShell: `$env:VAR="value"` per line.)

### Geolocation (Mapbox / Google Maps)

Production requires **either** `MAPBOX_ACCESS_TOKEN` **or** `GOOGLE_MAPS_API_KEY` on the API host.

| Variable | Where | Purpose |
|----------|-------|---------|
| `MAPBOX_ACCESS_TOKEN` | Render / `server/.env` | Geocode, reverse geocode, autocomplete |
| `GOOGLE_MAPS_API_KEY` | Render / `server/.env` | Alternative provider |
| `VITE_MAPBOX_ACCESS_TOKEN` | Vercel / root `.env` | Map tiles (OSM fallback) |

**Public endpoints:** `GET /api/geocoding/config`, `GET /api/at-home-service/suggest`, `POST /api/at-home-service/geocode`, `POST /api/at-home-service/reverse-geocode`.

Deploy backfills: barber coordinates and at-home areas (via `build-database.mjs`).

### Key commands

| Task | Command |
|------|---------|
| Frontend dev | `npm run dev` |
| Backend dev | `cd server && npm run dev` |
| Frontend tests | `npm run test` |
| Backend tests | `cd server && npm run test` (needs `TEST_DATABASE_URL` or skips DB tests in CI) |
| Production build | `npm run build` |
| DB migrate (local) | `cd server && npx prisma migrate deploy` |
| New migration (dev) | `cd server && npx prisma migrate dev --name describe_change` |
| DB seed | `cd server && npm run seed` |
| Schema verify | `cd server && npm run verify:schema` |

### Production deployment

| Layer | Host | URL (prod) |
|-------|------|------------|
| Frontend | Vercel | `https://shop-the-barber.vercel.app` |
| API | Render | `https://shopthebarber.onrender.com` |
| Database | Neon | via `DATABASE_URL` |

**Full checklist:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) · **Env vars:** [`server/.env.example`](server/.env.example) · **Blueprint:** [`render.yaml`](render.yaml)

- **Render build:** `npm install --include=dev && node scripts/build-database.mjs` → Prisma migrate + schema verify + backfills
- **Render start:** `npm run start`
- **Health check:** `/api/health/ready`
- Render free tier cold-starts (~30s) after idle

### Gotchas

- Auth is **Clerk-only** on the API (`authenticateRequest`); no `JWT_SECRET` in current server.
- **Never** use `drizzle-kit`, SQLite files, or manual prod SQL without a Prisma migration.
- Booking `POST /api/bookings` expects `date_text` (PPP) and `time_text` (`h:mm a`), not raw ISO.
- Frontend proxy: `vite.config.js` forwards `/api` → `localhost:3001`.
- Zod v4 on backend — use `.issues` for validation errors.
- Entity writes require authenticated Clerk user + ownership checks.
