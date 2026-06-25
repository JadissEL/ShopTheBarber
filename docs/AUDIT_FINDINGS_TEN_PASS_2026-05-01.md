# Ten-pass audit — findings and actions (2026-05-01)

Structured review per the **Ten-pass UI/UX, backend, and database audit** methodology (30 themed passes). Severity: **blocker** / **should-fix** / **nice-to-have**.

---

## Part A — UI/UX (10 passes)

| Pass | Finding | Severity | Status / note |
|------|---------|----------|----------------|
| 1 Journey | Route guard covers CLIENT / PROVIDER / ADMIN + employer paths; booking payment branch has commented redirect fallback | nice-to-have | [`RouteGuard.jsx`](../src/components/routing/RouteGuard.jsx) L43–48 — consider enforcing redirect off stale URLs |
| 2 Desktop-first | Client: `ClientLayout` + `ClientDesktopSidebar` + bottom nav hidden at `lg` per [`RESPONSIVE_LAYOUT.md`](RESPONSIVE_LAYOUT.md) | OK | Matches [`ClientLayout.jsx`](../src/components/layout/ClientLayout.jsx) |
| 3 Responsive | Provider/admin use desktop sidebar + [`ProviderBottomNav`](../src/components/layout/ProviderBottomNav.jsx) with `pb-20 lg:pb-0` | OK | Pattern consistent |
| 4 Feedback | Heavy pages use `PageLoading`, `PageError`, `EmptyState`, Radix dialogs | OK | Spot-check remainder of marketplace edge cases ongoing |
| 5 Forms/booking | `BookingFlow.jsx` large surface — confirm inline validation parity with backend booking rules | should-fix | Add Playwright/Vitest flow later |
| 6 A11y | Duplicate skip link in `AppLayout` vs `Layout` | **resolved** | **Fix:** single [`SkipLink`](../src/components/ui/SkipLink.jsx) in [`Layout.jsx`](../src/Layout.jsx); removed redundant anchor from [`AppLayout`](../src/components/layout/AppLayout.jsx) |
| 7 Tokens | Design tokens broadly used | OK | Sweep for rogue `bg-slate` in provider pages periodically |
| 8 Docs vs code | RESPONSIVE said provider “dark”; `Layout.jsx` forces `forcedTheme=dark` for non-client; `AppLayout` comment updated | resolved | Comment fix in [`AppLayout.jsx`](../src/components/layout/AppLayout.jsx) |
| 9 Perceived perf | Explore + booking prefetch multiple entity lists via server pagination | OK | Post server-side filter migration |
| 10 Automation | `npm run lint`, `npm test`, `npm run build` pass | OK | Run after substantial UI changes |

**UX remediated in this session**

- **Clerk `user.id` vs API:** [`AuthContext.jsx`](../src/lib/AuthContext.jsx) now calls `sovereign.auth.me()` after Clerk session and sets **`id` from the database** so `user_id` / `client_id` filters match SQLite (full-stack fix with backend below).

---

## Part B — Backend intelligence (10 passes)

| Pass | Finding | Severity | Status / note |
|------|---------|----------|----------------|
| 1 Auth coherence | `/api/auth/me` and entity preHandlers used JWT-only; Clerk Bearer did not resolve to `users.id` — broken scopes + front `user.id` | **blocker** | **Fixed:** [`requestUser.ts`](../server/src/auth/requestUser.ts) `authenticateRequest` — JWT first, else Clerk verify + DB link/provision |
| 2 Authorization | `entityScope` assumes `request.user.id` is DB UUID | **blocker** | Fixed by same resolver |
| 3 Non-generic routes | Booking + payments remain custom; re-verify role checks when touching | should-fix | Keep parity on new endpoints |
| 4 Validation | Zod on auth register/login; entity `validateEntityBody` strips unknown keys | OK | Extend Zod on hot POST paths over time |
| 5 Error semantics | 401/404 patterns on scope; 503 DB hints | OK | — |
| 6 List/filter | GET `order` + POST filter operators aligned with client | OK | [`apiClient.js`](../src/api/apiClient.js) |
| 7 Rate limits | Booking rate limit in DB + IP throttle | OK | [`rateLimit.ts`](../server/src/middleware/rateLimit.ts) |
| 8 Integrations | Stripe/Resend degrade without keys | OK | Docs in `docs/` |
| 9 Observability | Fastify logger + [`OBSERVABILITY_AND_DATA.md`](OBSERVABILITY_AND_DATA.md) | OK | Optional Sentry |
| 10 Tests | `authenticateRequest` covered with mocked Clerk + JWT | **resolved** | [`auth.authenticateRequest.test.ts`](../server/src/__tests__/auth.authenticateRequest.test.ts) |

**Backend files touched**

- [`server/src/auth/requestUser.ts`](../server/src/auth/requestUser.ts) (new)
- [`server/src/auth/clerk.ts`](../server/src/auth/clerk.ts) (richer Clerk profile)
- [`server/src/index.ts`](../server/src/index.ts) (`requireAuthPreHandler` / admin)
- [`server/src/auth/routes.ts`](../server/src/auth/routes.ts) (`/me`, `/refresh`)

---

## Part C — Database architecture (10 passes)

| Pass | Finding | Severity | Status / note |
|------|---------|----------|----------------|
| 1 Schema | `users.clerk_user_id` added for Clerk linkage | **blocker** | [`schema.ts`](../server/src/db/schema.ts) |
| 2 Relationships | SQLite FKs via Drizzle references | OK | Postgres path uses same schema |
| 3 Indexes | bookings, messages, notifications, favorites indexed | OK | [`schema.ts`](../server/src/db/schema.ts) |
| 4 Scope cost | Repeated barber/shop id selects per scope call | **resolved** | **`EntityScopeCache`** in [`entityScope.ts`](../server/src/entityScope.ts): `createEntityScopeCache()` attached in `requireAuthPreHandler`; list/get/filter/patch/delete + `rowInScope` pass cache |
| 5 Pagination | Server cap 1000 + client defaults | OK | — |
| 6 Migrations | `drizzle-kit push` prompted **destructive** full reset on this DB — **do not use blindly** | **blocker** (ops) | Use [`server/scripts/add-clerk-user-id-column.js`](../server/scripts/add-clerk-user-id-column.js) for SQLite additive migration |
| 7 PII | Messages/notifications scoped by user | OK | Retention policy TBD |
| 8 Naming | `date_text` / `time_text` booking contract documented in AGENTS | OK | — |
| 9 Seed | Seed creates consistent demo users | OK | Re-run after column add if needed |
| 10 Backup | Admin backup routes present | OK | Operational runbook in OBSERVABILITY doc |

**DB migration (SQLite, non-destructive)**

```bash
cd server && node scripts/add-clerk-user-id-column.js
```

**PostgreSQL (`DATABASE_URL`):** add nullable `clerk_user_id TEXT UNIQUE` (or partial unique index) via your migration pipeline — not covered by the SQLite-only script.

---

## Prioritized backlog (remaining)

1. ~~**should-fix:** Request-scoped cache for barber/shop scope lookups~~ → **Done** (`EntityScopeCache`, 2026 follow-up).
2. **should-fix:** ~~API smoke + Clerk Bearer + browser path~~ → [`e2e/health-public.spec.ts`](../e2e/health-public.spec.ts), [`e2e/clerk-bearer-api.spec.ts`](../e2e/clerk-bearer-api.spec.ts), [`e2e/clerk-browser-signin.spec.ts`](../e2e/clerk-browser-signin.spec.ts) (`@clerk/testing` + `CLERK_SECRET_KEY` / `E2E_CLERK_USER_EMAIL` / `E2E_FRONTEND_URL`), [`.github/workflows/playwright-api.yml`](../.github/workflows/playwright-api.yml). Sovereign JWT: [`api.authFavorite.integration.test.ts`](../server/src/__tests__/api.authFavorite.integration.test.ts).
3. ~~**nice-to-have:** Duplicate skip-link~~ → **Done** (AppLayout duplicate removed).
4. ~~**nice-to-have:** Vitest for `authenticateRequest`~~ → **Done**.
5. ~~**ops:** Formal Drizzle Postgres migration~~ → **Done** [`server/drizzle/0000_clerk_user_id.sql`](../server/drizzle/0000_clerk_user_id.sql) + `npm run migrate` ([`AGENTS.md`](../AGENTS.md)).
6. ~~**nice-to-have:** Router v7 future flags in frontend tests~~ → **Done** (`BrowserRouter future` in Explore critical-path test).

---

## Verification commands

```bash
npm run lint && npm test && npm run build
cd server && npm test && node scripts/add-clerk-user-id-column.js
```
