# Project context

## Purpose

**ShopTheBarber** is a barbershop booking and grooming marketplace SaaS: clients discover barbers, book appointments, shop products, and manage loyalty; providers run bookings, payouts, marketplace listings, and shop operations; admins oversee platform health, disputes, and analytics.

**Canonical workspace root:** `c:\Users\Jadiss\OneDrive\Bureau\ShopTheBarber\shop-the-barber` (repo folder `shop-the-barber/`).

---

## Stack / tech

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 6, TailwindCSS, Radix/shadcn, React Router 6, TanStack Query |
| Backend | Fastify 5, TypeScript, Zod validation |
| **Database** | **Neon PostgreSQL** (hosted) |
| **ORM / migrations** | **Prisma 6** — `server/prisma/schema.prisma` + `server/prisma/migrations/` |
| Auth | **Clerk** (frontend publishable key + backend secret; `users.clerk_user_id`) |
| Payments | Stripe (Checkout, webhooks) |
| Email / SMS | Resend, Twilio (reminders) |
| Cache / rate limits | Upstash Redis (required in production API) |
| Geocoding | Mapbox and/or Google (required in production API) |
| Observability | Sentry, `/api/health/*`, GitHub uptime workflow |
| Hosting | Vercel (frontend), Render (API), Neon (DB) |

**Not in use (historical docs only):** SQLite, Drizzle ORM, `JWT_SECRET` / legacy email-password auth, `DRIZZLE_BOOTSTRAP`.

---

## Documentation — single source of truth

When docs conflict, use this order:

| Topic | Canonical doc | Code reference |
|-------|---------------|----------------|
| **Deploy (Vercel + Render + Neon)** | [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) | `render.yaml`, `server/scripts/build-database.mjs` |
| **Database & Prisma** | [docs/NEON_PRISMA.md](../docs/NEON_PRISMA.md) | `server/prisma/schema.prisma`, `server/prisma/migrations/` |
| **Agent / dev commands** | [AGENTS.md](../AGENTS.md) | — |
| **Env vars checklist** | [.cursor_memory/api_keys_checklist.md](api_keys_checklist.md) | `server/.env.example`, `.env.example` |
| **Feature modules / nav gating** | [docs/FEATURE_MODULES.md](../docs/FEATURE_MODULES.md) | `src/lib/featureRegistry.js` |
| **Branching & promote** | [docs/GIT_BRANCHING_AND_DEPLOYMENT.md](../docs/GIT_BRANCHING_AND_DEPLOYMENT.md) | `.github/workflows/ci.yml` |

Obsolete if they mention SQLite/Drizzle/JWT-only auth: older migration reports, `PROJECT_SCHEMA.md` backend section (until updated), `VERCEL_DEPLOYMENT_GUIDE.md` (banner only).

---

## Layout

```
shop-the-barber/
├── src/                      # React app (pages, components, lib, api client)
│   ├── pages/                # ~100 route pages
│   ├── lib/featureRegistry.js  # Feature module gates (nav + routes)
│   └── components/           # UI, layouts, routing (RouteGuard, FeatureGuard)
├── server/
│   ├── prisma/
│   │   ├── schema.prisma     # SSOT for data model (70+ models)
│   │   └── migrations/       # SSOT for schema changes (migrate deploy in prod)
│   ├── src/
│   │   ├── index.ts          # Fastify app, entity CRUD, functions
│   │   ├── db/               # Prisma client, seed
│   │   └── logic/            # Business logic
│   └── scripts/              # build-database.mjs, verify-production-schema.mjs
├── docs/                     # Operational docs (DEPLOYMENT, NEON_PRISMA, …)
├── e2e/                      # Playwright specs
├── .cursor_memory/           # PCA agent memory (this folder)
├── render.yaml               # Render blueprint
└── README.md                 # Onboarding; points to canonical docs above
```

---

## Constraints

- **Production DB:** Neon PostgreSQL only; every schema change = Prisma migration committed under `server/prisma/migrations/`. CI/Render run `prisma migrate deploy` — never `drizzle-kit` or manual prod SQL without a migration.
- **Auth:** Clerk only; API resolves Bearer token → `users` via `clerk_user_id`.
- **Production API fail-fast:** `DATABASE_URL`, `CLERK_SECRET_KEY`, Upstash Redis, geocoding keys (see `server/src/index.ts`).
- **Branches:** CI on `master`; production deploy from `main` after green CI.
- **Secrets:** Never commit `.env`, `.env.local`, `server/.env`, or connection strings.
- **Feature flags:** Optional verticals via `VITE_FEATURE_*=false` at frontend build time ([FEATURE_MODULES.md](../docs/FEATURE_MODULES.md)).
- **Desktop-first UX** with responsive mobile (bottom nav for authenticated clients).

---

## Local dev (minimal)

```bash
# Frontend: .env.local with VITE_CLERK_PUBLISHABLE_KEY
# Backend: server/.env with DATABASE_URL + CLERK_SECRET_KEY
cd server && npm run generate && npx prisma migrate deploy && npm run seed  # seed optional
cd server && npm run dev    # :3001
npm run dev                 # :3000 (proxies /api)
```

---

## Links

- Production frontend: https://shop-the-barber.vercel.app
- Production API: https://shopthebarber.onrender.com
- Health: `GET /api/health/ready`
- Clerk dashboard: https://dashboard.clerk.com
- Neon console: https://console.neon.tech
