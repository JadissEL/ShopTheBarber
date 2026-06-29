# ShopTheBarber — Premium Barbershop Booking Platform

A modern booking and marketplace platform for barbershops and grooming professionals: **React (Vite)** frontend, **Fastify** API, **Neon PostgreSQL** with **Prisma**, **Clerk** authentication.

**Production:** Vercel (frontend) + Render (API) + Neon (database).

---

## Documentation (read this first)

**If two docs disagree, use the canonical source for that topic.**

| Topic | Canonical doc |
|-------|----------------|
| **Deploy & production env** | **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** |
| **Database, Prisma, Neon, migrations** | **[docs/NEON_PRISMA.md](docs/NEON_PRISMA.md)** |
| **Agent / CI / E2E commands** | **[AGENTS.md](AGENTS.md)** |
| **Feature modules (optional verticals)** | **[docs/FEATURE_MODULES.md](docs/FEATURE_MODULES.md)** |
| **Git branching → production** | **[docs/GIT_BRANCHING_AND_DEPLOYMENT.md](docs/GIT_BRANCHING_AND_DEPLOYMENT.md)** |

**Schema source of truth:** `server/prisma/schema.prisma` and `server/prisma/migrations/`.

**Obsolete:** Any doc mentioning SQLite, Drizzle, `JWT_SECRET`, or `DRIZZLE_BOOTSTRAP` — production uses **Prisma + Neon only**.

**UX:** Desktop-first SaaS; see [docs/ARCHITECTURE_DESKTOP_FIRST.md](docs/ARCHITECTURE_DESKTOP_FIRST.md) and [docs/RESPONSIVE_LAYOUT.md](docs/RESPONSIVE_LAYOUT.md).

---

## Quick start

### Prerequisites

- Node.js 20+
- [Neon](https://neon.tech) PostgreSQL connection string (free tier works for dev)
- [Clerk](https://clerk.com) application (publishable + secret keys)

### Install

```bash
cd shop-the-barber
npm install
cd server && npm install && cd ..
```

### Configure environment

```bash
cp .env.example .env.local          # VITE_CLERK_PUBLISHABLE_KEY (required)
cd server && cp .env.example .env   # DATABASE_URL, CLERK_SECRET_KEY (required)
```

Do not commit `.env` or `.env.local`. Full checklist: [.cursor_memory/api_keys_checklist.md](.cursor_memory/api_keys_checklist.md).

### Database (first time)

Follow **[docs/NEON_PRISMA.md](docs/NEON_PRISMA.md)**:

```bash
cd server
npm run generate
npx prisma migrate deploy
npm run seed   # optional demo barbers, shops, promos
```

There is **no local SQLite** database in the current server package.

### Run locally

**Terminal 1 — API (port 3001):**

```bash
cd server && npm run dev
```

**Terminal 2 — Frontend (port 3000):**

```bash
npm run dev
```

Vite proxies `/api` to the backend.

---

## Project structure

```
shop-the-barber/
├── src/                    # React application
│   ├── pages/              # Route pages
│   ├── components/         # UI, layouts, guards
│   ├── lib/                # Auth, feature registry, utilities
│   └── api/                # API client
├── server/
│   ├── prisma/             # schema.prisma + migrations/  ← DB SSOT
│   ├── src/                # Fastify server (index.ts, logic/, db/)
│   └── scripts/            # build-database.mjs, verify-production-schema.mjs
├── docs/                   # DEPLOYMENT.md, NEON_PRISMA.md, …
├── e2e/                    # Playwright tests
└── render.yaml             # Render production blueprint
```

---

## Technology stack

### Frontend

- React 18 + Vite 6
- TailwindCSS, Radix UI / shadcn
- TanStack React Query, React Router 6
- Clerk (`@clerk/react`)

### Backend

- Fastify 5, TypeScript, Zod
- **Prisma Client** → Neon PostgreSQL
- Clerk (`@clerk/backend`) — session JWT → `users.clerk_user_id`
- Stripe, Resend, Twilio, Upstash Redis (production)

### Auth

Authentication is **Clerk-only** (no legacy JWT/password login in the API). Setup: [docs/CLERK_SETUP.md](docs/CLERK_SETUP.md) or `CLERK_QUICKSTART.md`.

---

## Database

- **Host:** Neon PostgreSQL (pooled URL in `DATABASE_URL` for runtime)
- **Schema:** `server/prisma/schema.prisma` (70+ models)
- **Changes:** `npx prisma migrate dev --name your_change` locally → commit migration files
- **Production / CI:** `prisma migrate deploy` only (via Render build or manual)
- **Verify:** `cd server && npm run verify:schema`

Details: **[docs/NEON_PRISMA.md](docs/NEON_PRISMA.md)**.

---

## Deployment

**Canonical guide:** **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**

| Layer | Host | Branch |
|-------|------|--------|
| Frontend | Vercel | `main` |
| API | Render (`render.yaml`) | `main` |
| Database | Neon | migrations on every Render build |

Render build runs `server/scripts/build-database.mjs`: `prisma generate` → `migrate deploy` → schema verify → backfills.

---

## Development commands

### Frontend

```bash
npm run dev
npm run build
npm run lint
npm run test              # Vitest
npm run test:e2e:public   # Playwright (see AGENTS.md)
```

### Backend

```bash
cd server
npm run dev
npm run generate          # prisma generate
npm run migrate           # prisma migrate deploy
npm run migrate:dev       # prisma migrate dev (local schema changes)
npm run seed
npm run studio            # Prisma Studio
npm run verify:schema
npm run test
```

### Schema changes (developers)

1. Edit `server/prisma/schema.prisma`
2. `cd server && npx prisma migrate dev --name describe_change`
3. Commit new files under `server/prisma/migrations/`
4. Never use Drizzle or manual prod SQL without a migration file

---

## API overview

Base URL (local): `http://localhost:3001`

- **Auth:** `GET /api/auth/me` — Clerk Bearer token required for protected routes
- **Health:** `GET /api/health/live`, `GET /api/health/ready`
- **Entities:** CRUD under `/api/{entity}` (barbers, shops, bookings, …)
- **Functions:** `/api/functions/*` (availability, taxes, promos, email, …)

Full route list: `server/src/index.ts`.

---

## Testing

| Suite | Command |
|-------|---------|
| Unit / component (Vitest) | `npm run test` |
| Playwright API / browser | See [AGENTS.md](AGENTS.md) |

CI runs on `master` / `main`; integration tests use GitHub secret `TEST_DATABASE_URL` (isolated Neon branch).

---

## Integrations (setup docs)

- **Stripe:** [docs/STRIPE_SETUP.md](docs/STRIPE_SETUP.md)
- **Resend:** [docs/RESEND_SETUP.md](docs/RESEND_SETUP.md)
- **Booking flows:** [docs/BOOKING_FLOWS.md](docs/BOOKING_FLOWS.md)

---

## Security

- Clerk session authentication
- Zod input validation
- Parameterized queries (Prisma)
- Rate limiting (Upstash in production)
- Helmet, CORS, audit logging
- See [docs/SECURITY_AUDIT.md](docs/SECURITY_AUDIT.md)

---

## License

Proprietary — All Rights Reserved.

**Author:** Jadiss — Shop The Barber Platform
