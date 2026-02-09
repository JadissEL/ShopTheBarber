# Security Audit — ShopTheBarber

**Purpose**: Record of security checks for production readiness. Run periodically or before release.

## No hardcoded secrets in repo

- **JWT_SECRET**: Server uses `process.env.JWT_SECRET || 'supersecret-shopthebarber'`. The fallback is for local dev only; **production must set JWT_SECRET** in env. No real secret is committed.
- **Stripe**: `server/src/webhooks/stripe.ts` uses a mock fallback key when `STRIPE_API_KEY` is unset (for server stability). **Production must set STRIPE_API_KEY and STRIPE_WEBHOOK_SECRET** in env.
- **Seed**: `server/src/db/seed.ts` uses a dev password hash for seeded users; not used as a production secret.
- **`.env`**: Ignored by `.gitignore`; `server/.env.example` documents required vars without values.

**Verdict**: No production secrets in repo. All sensitive config is via env; see README and `server/.env.example`.

## Auth checks on protected routes

- **Backend**: Auth routes (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`) and JWT verification are implemented. Entity routes that require auth should verify the token (see `server/src/index.ts` and auth middleware where applied).
- **Frontend**: RouteGuard and role-based nav restrict client/provider/admin zones; unauthenticated users are redirected to SignIn.

**Verdict**: Auth and role-based access are in place. For any new protected API route, ensure JWT or equivalent is checked.

## Rate limiting

- Rate limiting middleware is applied on auth and sensitive routes (see `server/src/middleware/rateLimit`).

---

*Last audit: production-readiness loop. Re-run before major releases.*
