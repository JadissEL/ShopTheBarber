# Security Audit — ShopTheBarber

**Purpose**: Record of security checks for production readiness. Run periodically or before release.

## No hardcoded secrets in repo

- **Clerk**: `CLERK_SECRET_KEY` (server) and `VITE_CLERK_PUBLISHABLE_KEY` (frontend) must be set in env. No keys are committed.
- **Stripe**: `server/src/webhooks/stripe.ts` uses a mock fallback key when `STRIPE_API_KEY` is unset (for server stability). **Production must set STRIPE_API_KEY and STRIPE_WEBHOOK_SECRET** in env.
- **`.env`**: Ignored by `.gitignore`; `server/.env.example` documents required vars without values.

**Verdict**: No production secrets in repo. All sensitive config is via env; see README and `server/.env.example`.

## Auth checks on protected routes

- **Backend**: Auth is **Clerk-only**. `authenticateRequest` in `server/src/auth/requestUser.ts` verifies Clerk Bearer tokens and resolves Neon `users.id`. Public auth routes: `GET /api/auth/me`, `POST /api/auth/logout` (stateless). There is no email/password login or legacy `JWT_SECRET` / `@fastify/jwt` path.
- **Frontend**: RouteGuard and role-based nav restrict client/provider/admin zones; unauthenticated users are redirected to Clerk SignIn.

**Verdict**: Auth and role-based access are in place. For any new protected API route, call `authenticateRequest` (or a route preHandler that uses it).

## Rate limiting

- Distributed IP throttling via **Upstash Redis** (`server/src/lib/ipRateLimit.ts`) — required in production (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`).
- Booking creation uses layered limits in `server/src/middleware/rateLimit.ts` (user quota, duplicate barber, IP rapid-fire).
- Public endpoints (availability, promo validate, geocode, travel quote) share the same Upstash-backed limiter.

---

*Last audit: 2026-06-26 — removed legacy JWT/password_hash paths. Re-run before major releases.*
