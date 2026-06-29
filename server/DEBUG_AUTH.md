# Auth debugging (Clerk-only)

Interactive sign-in and sign-up are handled by **Clerk** on the frontend. The Fastify API does not expose `/api/auth/login` or `/api/auth/register`.

## Architecture

1. User signs in via Clerk (`SignIn` / `SignUp` components).
2. Frontend sends `Authorization: Bearer <clerk_session_token>` to `/api/*`.
3. `server/src/auth/requestUser.ts` verifies the token with Clerk, then links or provisions a row in Neon `users` (`clerk_user_id`, email, role).
4. Protected routes use `authenticateRequest`; `/api/auth/me` returns the DB-backed profile.

## Required env

| Variable | Where |
|----------|--------|
| `CLERK_SECRET_KEY` | `server/.env` |
| `VITE_CLERK_PUBLISHABLE_KEY` | root `.env` (Vite) |

See `server/.env.example` — there is **no** `JWT_SECRET` for this app.

## Quick checks

1. **Backend health:** `GET http://localhost:3001/api/health` → `{ ok: true, ... }`
2. **Auth me (needs Bearer token):** `GET /api/auth/me` with Clerk session JWT
3. **401 on protected routes:** Missing/expired Clerk token, or `CLERK_SECRET_KEY` mismatch with the frontend tenant

## Common issues

| Symptom | Fix |
|---------|-----|
| 401 on all authenticated calls | Confirm `CLERK_SECRET_KEY` matches the Clerk app used by `VITE_CLERK_PUBLISHABLE_KEY` |
| User not found after sign-in | Check server logs for Clerk verify errors; ensure email is present on the Clerk user |
| DB errors on first login | Run `npx prisma migrate deploy` against `DATABASE_URL` |
