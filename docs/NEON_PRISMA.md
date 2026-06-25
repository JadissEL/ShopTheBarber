# Neon + Prisma (ShopTheBarber production database)

ShopTheBarber uses **Neon PostgreSQL** in production with **Prisma** for schema migrations and **Drizzle** for runtime queries (existing Fastify routes).

## Neon project (created via MCP)

- **Project:** `shopthebarber` (`purple-glade-90739580`)
- **Region:** AWS us-west-2
- **Schema:** applied via `prisma migrate deploy` + `npm run seed`
- **Local:** `server/.env` has pooled `DATABASE_URL` (git-ignored)

| Variable | Use |
|----------|-----|
| `DATABASE_URL` | Pooled Neon connection — app runtime on Render (`-pooler` host) |

For **local Prisma migrations** on Neon, temporarily set `DATABASE_URL` to the **direct** (non-pooler) connection string from the Neon dashboard, then run `npx prisma migrate deploy`.

## Local commands

```bash
cd server
npm run prisma:generate
npx prisma migrate dev --name init   # first time, with DATABASE_URL + DIRECT_URL set
npm run seed                         # sample data after tables exist
```

## Render build

When `DATABASE_URL` contains `neon.tech`, `build-database.mjs` runs:

1. `prisma generate`
2. `prisma migrate deploy`

Force Prisma on any Postgres URL: `USE_PRISMA_MIGRATE=true`.

Legacy Drizzle migrate still runs for non-Neon Postgres (e.g. Render Postgres).

## Clerk

- Frontend: `VITE_CLERK_PUBLISHABLE_KEY` on Vercel
- Backend: `CLERK_SECRET_KEY` on Render
- Users table: `users.clerk_user_id` links Clerk subjects to API scope

## Verify production

```bash
curl https://shopthebarber.onrender.com/api/health
curl https://shop-the-barber.vercel.app/
```

Expected: `{"ok":true,"db":"ok"}` and Vercel HTTP 200.
