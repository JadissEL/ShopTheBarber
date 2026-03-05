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
- **Build command** (Render): `npm install --include=dev && rm -f sovereign.sqlite && npx drizzle-kit push`
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
