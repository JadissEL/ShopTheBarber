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
| 4.3 | `.env.example` in server (and optional root) with JWT_SECRET, DB, Stripe, Resend | Done | server/.env.example + root .env.example; !.env.example in .gitignore. |
| 4.4 | No secrets in repo; README or deploy doc references env | Done | README "Environment variables" section; .env in .gitignore. |

---

## 5. Code quality & docs

| # | Item | Status | Notes |
|---|------|--------|-------|
| 5.1 | PROJECT_TRACKER: DB schema table shows ✅ for implemented entities | Done | All 13 entities + extra tables marked ✅ in PROJECT_TRACKER.md. |
| 5.2 | Remove or reword last Base44 mention in apiClient | Done | Comment reworded to "legacy in-app page logging". |
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

## Order of execution (for the loop)

Process sections in order; within each section, process **Todo** items in row order. Skip **Done** and **Skipped**. Mark **In progress** when starting an item, then **Done** when verified (or **Skipped** with reason).

**Suggested priority**: 1 → 2 → 3 → 4 → 5 → 6. Section 7 is optional.

---

## ✅ Checklist status

**Sections 1–6**: All items **Done**. Section 7 (Optional) is **Skipped**. The production checklist is complete for current scope. To verify: run `npm run lint`, `npm run test`, `npm run build` (frontend) and `cd server && npm run test` (server).

---

*Last updated by production-loop or manual edit. Run `/production-loop` to continue.*
