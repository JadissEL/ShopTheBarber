# Neon + Prisma (ShopTheBarber database)

Production and local development use **Neon PostgreSQL** with **Prisma** for schema migrations and the **Prisma Client** for all runtime queries.

Legacy **SQLite / Drizzle** docs elsewhere in the repo are historical — do not use them for new environments.

---

## Neon project (reference)

| Item | Value |
|------|--------|
| Project | `shopthebarber` (`purple-glade-90739580`) |
| Region | AWS us-west-2 |
| Runtime connection | **Pooled** URL (`-pooler` host) → `DATABASE_URL` |
| Migrations | **Direct** (non-pooler) URL recommended for `prisma migrate dev` only |

Never commit connection strings. Store in `server/.env` (gitignored) and Render env.

---

## Local setup

```bash
cd server
cp .env.example .env
# Edit DATABASE_URL → Neon pooled (or dev branch) connection string

npm run generate              # prisma generate
npx prisma migrate deploy     # apply pending migrations
npm run seed                  # optional demo data
npm run dev                   # API on :3001
```

### Create a new migration (developers)

Use a **direct** Neon connection string temporarily:

```bash
cd server
npx prisma migrate dev --name describe_your_change
# Commit new files under prisma/migrations/
```

CI and Render always run **`prisma migrate deploy`** (non-interactive).

---

## Render build

[`scripts/build-database.mjs`](../server/scripts/build-database.mjs) runs on every deploy when `DATABASE_URL` is set:

1. `prisma generate`
2. `prisma migrate deploy`
3. `node scripts/verify-production-schema.mjs`
4. `backfill-barber-cities.ts`
5. `backfill-barber-coordinates.ts`
6. `backfill-at-home-areas.ts`

If `DATABASE_URL` is missing, the build **fails** (no SQLite fallback).

---

## CI (GitHub Actions)

Secret **`TEST_DATABASE_URL`** → isolated Neon branch.

`.github/workflows/ci.yml` runs `prisma migrate deploy` + `npm run verify:schema` + server Vitest when the secret is present.

---

## Clerk ↔ users table

- Frontend: `VITE_CLERK_PUBLISHABLE_KEY`
- Backend: `CLERK_SECRET_KEY`
- DB column: `users.clerk_user_id` links Clerk subjects to API user scope

---

## Verify production

```bash
curl -s https://shopthebarber.onrender.com/api/health/ready | jq .
curl -sI https://shop-the-barber.vercel.app/ | head -1
```

Expected: readiness JSON with DB checks OK; Vercel HTTP 200.

Local schema check (with production or staging URL in env — **read-only caution**):

```bash
cd server && npm run verify:schema
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deploy steps.
