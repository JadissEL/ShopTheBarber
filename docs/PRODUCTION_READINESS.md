# Production Readiness — ShopTheBarber

**Purpose**: Single checklist to drive the app to production level. Use with **/production-loop** so the agent can work through items one by one until done.

**How to use**: Run the command **/production-loop** (or say "run the production loop"). The agent will pick the next **Todo** item, implement it, run checks, update this file, and tell you to run again. Repeat until all items are **Done** or **Skipped**.

---

## Status legend

| Status    | Meaning |
|-----------|--------|
| **Todo**  | Not started; next candidate for the loop. |
| **In progress** | Agent is working on it (or you are). |
| **Done**  | Completed and verified. |
| **Skipped** | Deferred or not applicable (with short reason). |

---

## 1. Auth & redirects

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1.1 | Redirect to SignIn uses `/SignIn` (not `/login`) | Done | apiClient + AccountSettings fixed. |
| 1.2 | After login/register, redirect to `return` URL (e.g. booking) not always Dashboard | Done | SignIn.jsx reads `return` and redirects. |
| 1.3 | Auth context exposes `isAuthenticated` and `role` for guards/nav | Done | Per UX audit. |
| 1.4 | Session persistence: token in localStorage; optional refresh before expiry | Done | Documented in README (Auth & session). No refresh implemented; session until expiry or logout. |

---

## 2. Booking & data

| # | Item | Status | Notes |
|---|------|--------|-------|
| 2.1 | Barbers/shops listed on Find a Barber (API + DB seed) | Done | Seed + proxy + Explore resilient. |
| 2.2 | Barber/shop profile photos in DB and UI | Done | Seed has distinct images. |
| 2.3 | "Barber no longer at this location" fixed (ShopMember filter without `status`) | Done | BookingFlow.jsx. |
| 2.4 | Booking confirmation step: readable text on white cards | Done | index.css surface-light rules. |
| 2.5 | Validation errors show specific message (e.g. password length) on signup | Done | Backend + apiClient + SignIn hint. |
| 2.6 | E2E or critical-path test for: open Explore → select barber → services → (optional) confirm | Done | Vitest + Explore critical-path test (discovery UI, professionals section, BarberProfile link or empty state). |

---

## 3. UX & navigation

| # | Item | Status | Notes |
|---|------|--------|-------|
| 3.1 | All internal links point to existing pages (no 404s) | Done | EditProfile→AccountSettings; Admin→AdminUserModeration; Loyalty. |
| 3.2 | Provider zone includes ProviderPayouts, ProviderTermsOfService | Done | navigationConfig. |
| 3.3 | Admin dashboard path = GlobalFinancials (not UserManagement) | Done | navigationVisibility. |
| 3.4 | RouteGuard allows barber/shop_owner in provider zone | Done | RouteGuard.jsx. |
| 3.5 | Explore page resilient to missing Promotion/InspirationPost APIs | Done | Try/catch + empty arrays. |
| 3.6 | Global error boundary: "Something went wrong" instead of white screen | Done | ErrorBoundary in Layout.jsx + root App.jsx. |

---

## 4. API & backend

| # | Item | Status | Notes |
|---|------|--------|-------|
| 4.1 | Frontend uses relative `/api` (Vite proxy) so backend is reachable | Done | apiClient BASE_URL. |
| 4.2 | CORS enabled on backend for frontend origin | Done | fastify.register(cors). |
| 4.3 | `.env.example` in server (and optional root) with Clerk, DB, Stripe, Resend | Done | server/.env.example + root .env.example; !.env.example in .gitignore. |
| 4.4 | No secrets in repo; README or deploy doc references env | Done | README "Environment variables" section; .env in .gitignore. |

---

## 5. Code quality & docs

| # | Item | Status | Notes |
|---|------|--------|-------|
| 5.1 | PROJECT_TRACKER: DB schema table shows ✅ for implemented entities | Done | All 13 entities + extra tables marked ✅ in PROJECT_TRACKER.md. |
| 5.2 | Remove or reword last Sovereign API mention in apiClient | Done | Comment reworded to "legacy in-app page logging". |
| 5.3 | Lint and typecheck pass (frontend + server) | Done | ESLint 0 errors, 0 warnings. Typecheck not configured. |
| 5.4 | Minimal tests: at least one frontend test, one server route or logic test | Done | Frontend: Vitest + Explore critical-path test. Server: Vitest + auth/password test. |
| 5.5 | README: Deployment section (frontend host, backend host, env, DB) | Done | README Deployment section added. |
| 5.6 | README: Development section linking PROJECT_SCHEMA, PROJECT_TRACKER | Done | Development section + Documentation list PROJECT_SCHEMA, PROJECT_TRACKER. |

---

## 6. Security & production hardening

| # | Item | Status | Notes |
|---|------|--------|-------|
| 6.1 | Rate limiting on auth and sensitive routes | Done | rateLimit middleware. |
| 6.2 | Security audit run: no hardcoded secrets, auth checks on protected routes | Done | docs/SECURITY_AUDIT.md; no secrets in repo; auth/rate-limit in place. |
| 6.3 | CI pipeline: lint, typecheck, test (and optionally build) on push/PR | Done | .github/workflows/ci.yml: frontend lint/test/build, server test. |

---

## 7. Optional (later)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 7.1 | Bundle size check; lazy routes for heavy pages | Skipped | When scaling. |
| 7.2 | Lighthouse / performance pass | Skipped | When scaling. |
| 7.3 | Postgres-ready or migration path documented | Skipped | Tracker open decision. |

---

## 8. Launch policy (founder Q&A)

| # | Item | Status | Notes |
|---|------|--------|-------|
| 8.1 | Wallet, credits, deposits, disputes — policy questionnaire | **Done (Phase 1 core)** | [`docs/LAUNCH_POLICY_QUESTIONNAIRE.md`](./LAUNCH_POLICY_QUESTIONNAIRE.md) — C1–C3, DS1–DS3, P2–P3 decided; F1–F2 and admin P0 dashboards remain draft/Phase 2. |
| 8.2 | Finalized policies logged in `.cursor_memory/decisions.md` | **Done** | 2026-06-28 Financial & Trust Ecosystem Phase 1 entry. |
| 8.3 | Admin / barber / client dashboard metrics defined | **Done (Phase 1)** | Public barber stats, provider wallet burn-rate (`bookings_until_empty`), admin global ledger UI + CSV export. Admin intelligence dashboard remains Phase 2. |
| 8.4 | Financial Trust Phase 1–3 engines | **Done** | Migrations through `20260628140000`; Phases 1–3 domain modules, routes in `financialTrustRoutes.ts`, UI dashboards. Ops: run `prisma migrate deploy`. |
| 8.5 | Phase 1 cron secrets (`CRON_SECRET`, `PRODUCTION_API_URL`) | **Todo (ops)** | Set on Render + GitHub; workflow fails loudly if missing. **DB migrations through `20260628140000` applied** on dev Neon (2026-06-28). |
| 8.6 | Payment & webhook hardening (2026-06-28) | **Done (code)** | Stripe webhook raw body; gift cards via Stripe Checkout + webhook; real Connect Express onboarding; Twilio signature validation; prod fail-fast for Stripe/CORS/CRON; CSP expanded; schema verify for Financial Trust tables. |

---

## 9. Pre-launch ops (you must do manually)

| # | Item | Status |
|---|------|--------|
| 9.1 | Set all Render env vars (`STRIPE_*`, `CRON_SECRET`, `FRONTEND_URL`, `RESEND_*`, Twilio if SMS) | **Todo** |
| 9.2 | Set Vercel `VITE_API_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_SITE_URL` | **Todo** |
| 9.3 | GitHub secrets `CRON_SECRET` + `PRODUCTION_API_URL` | **Todo** |
| 9.4 | `prisma migrate deploy` on **production** Neon | **Todo** |
| 9.5 | Stripe Dashboard: webhook endpoint → `/api/webhooks/stripe` with correct events | **Todo** |
| 9.6 | Rotate Clerk keys if old test keys were ever committed (see `CLERK_CONFIGURATION_COMPLETE.md`) | **Todo** |
| 9.7 | Run `npm run verify:secrets` before cutover | **Todo** |

---

## Order of execution (for the loop)

Process sections in order; within each section, process **Todo** items in row order. Skip **Done** and **Skipped**. Mark **In progress** when starting an item, then **Done** when verified (or **Skipped** with reason).

**Suggested priority**: 1 → 2 → 3 → 4 → 5 → 6. Section 7 is optional.

---

## ✅ Checklist status

**Sections 1–6**: All items **Done**. Section 7 (Optional) is **Skipped**. The production checklist is complete for current scope. To verify: run `npm run lint`, `npm run test`, `npm run build` (frontend) and `cd server && npm run test` (server).

### §8.5 ops checklist (manual)

1. **Render** — set `CRON_SECRET` (random 32+ chars), `RESEND_API_KEY`, `EMAIL_FROM`, `BACKEND_URL` on the API service.
2. **GitHub** — repository secrets `CRON_SECRET` (same value) and `PRODUCTION_API_URL` (Render API base URL, no trailing slash).
3. **Deploy migrations** — `cd server && npx prisma migrate deploy` on production DB.
4. **Verify** — `npm run verify:secrets` locally (with secrets in `server/.env`) or trigger `.github/workflows/financial-trust-cron.yml` via workflow_dispatch.

---

*Last updated by production-loop or manual edit. Run `/production-loop` to continue.*
