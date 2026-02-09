# ShopTheBarber — First glance: what should be done

**Date**: 2026-02-03  
**Context**: Phase 4 – Final Polish & Handover. Base44 eradicated; sovereign stack (React/Vite + Fastify/Drizzle/SQLite) in place; auth, email, Stripe, analytics, booking flow operational.

---

## Status / progress

| Date       | Action |
|------------|--------|
| 2026-02-03 | Doc created; priorities defined. |
| 2026-02-03 | **Deep UX audit**: Journey Auditor subagent triggered to check and test UX thoroughly (report below). No code changes until report is reviewed. |
| 2026-02-03 | **UX audit fixes applied**: Auth context (isAuthenticated + role), provider zone paths, admin dashboard path, admin settings link, EditProfile→AccountSettings, RouteGuard barber/shop_owner, Loyalty→Loyalty link. |

---

## Priority 1 — Quick wins (low effort, high clarity)

| # | Item | Why | Action |
|---|------|-----|--------|
| 1 | **Tracker: DB schema table** | PROJECT_TRACKER still shows all entities as "⏳ Pending" but schema is implemented and migrated. | Update the "DATABASE SCHEMA" table: set Status to ✅ for all entities that exist in `server/src/db/schema.ts` and are migrated. |
| 2 | **Last remaining Base44 mention** | One comment in `src/api/apiClient.js`: "No-op shim for legacy Base44 logging." | Change to "No-op shim for legacy logging" (or remove) so codebase is 100% Base44-free in wording. |
| 3 | **`.env.example`** | No template for required env vars; onboarding and deployment are guesswork. | Add `server/.env.example` (and optional root `.env.example` for Vite) with placeholders: `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, etc. Document in README. |

---

## Priority 2 — Quality & correctness (confidence before scale)

| # | Item | Why | Action |
|---|------|-----|--------|
| 4 | **Tests** | No `test` script or test framework in frontend; server has `test: "echo Error: no test specified"`. Regressions are easy. | Add Vitest (or Jest) to frontend; add a few critical-path tests (e.g. auth flow, booking flow, apiClient). Add a minimal test for one server route or logic module. Wire `npm run test` (and optionally `npm run test:ci`). |
| 5 | **Lint & typecheck** | Already present; ensure they pass cleanly. | Run `npm run lint` and `npm run typecheck`; fix any failures. Add the same for `server/` if not already (e.g. `npm run lint` in server). |
| 6 | **Journey/UX audit** | Many pages and zones; broken links or guards are easy to miss. | Run **/audit-journeys** or invoke **Journey Auditor subagent** for deep UX check. Fix any broken links, guards, or redundant logic found. *(Deep audit triggered 2026-02-03; see report in this doc.)* |
| 7 | **Security pass** | Auth, payments, PII are present; one proactive pass reduces risk. | Run **/security-audit** (or security-auditor skill). Address any findings (secrets, injection, auth). |

---

## Priority 3 — Production readiness (deploy & maintain)

| # | Item | Why | Action |
|---|------|-----|--------|
| 8 | **CI pipeline** | No automated checks on push/PR. | Add GitHub Actions (or similar): install, lint, typecheck, test on push/PR. Optional: build frontend and server to catch build failures. |
| 9 | **Deployment notes** | README has local run only. | Add a short "Deployment" section: frontend (e.g. Vercel/Netlify), backend (e.g. Railway/Render/Fly), env vars, DB (SQLite file or Postgres when ready). Optionally add a one-command or script for local full stack. |
| 10 | **Open decisions in tracker** | "Auth transition must handle existing user sessions" and "Postgres-ready" are noted but not closed. | Either document current behavior (e.g. "New JWT only; no legacy session migration") or add a small "Phase 4 decisions" section and close/update items. |

---

## Priority 4 — Nice to have (when time allows)

| # | Item | Why | Action |
|---|------|-----|--------|
| 11 | **Bundle size / performance** | Large dependency set (three, recharts, etc.). | Run `vite build --mode production` and check bundle size; consider lazy routes or code-splitting for heavy pages. Optional: Lighthouse run. |
| 12 | **README "Development" section** | PROJECT_SCHEMA exists but README doesn’t point to it. | Add a "Development" subsection: link to PROJECT_SCHEMA.md, PROJECT_TRACKER.md, and where to add pages/API (per schema). |
| 13 | **Help / error boundaries** | Production errors should not white-screen. | Confirm a global error boundary exists (e.g. in Layout or App); add a simple "Something went wrong" fallback if missing. |

---

## Summary order of execution

1. **Do first**: Tracker DB table update, Base44 comment fix, `.env.example` + README note.  
2. **Then**: Add minimal tests and CI; run lint/typecheck; run `/audit-journeys` and `/security-audit` and fix findings.  
3. **Then**: CI pipeline, deployment notes, close open tracker decisions.  
4. **Later**: Bundle/performance, README dev section, error boundary check.

---

*This doc can be updated as items are completed. Sync status back to PROJECT_TRACKER "Phase 4" or "Pending tasks" as needed.*

---

## Journey Auditor — Deep UX audit report (2026-02-03)

*Report generated by running the Journey Auditor workflow (journey-ux-auditor skill). Findings only; no code changed. Apply fixes in a follow-up after review.*

### Summary

- **Critical**: 4 (auth context missing role/isAuthenticated; provider zone missing paths; broken nav links to non-existent pages; duplicate Auth providers).
- **High**: 3 (paths in config that don’t exist; role name mismatch risk; admin dashboard path wrong).
- **Medium**: 2 (redundant path lists; RouteGuard manager pages orphan).
- **Low**: 1 (route case sensitivity risk for direct URL typing).

---

### 1. UX organization

| Finding | Severity | Location | Detail |
|--------|----------|----------|--------|
| **Two Auth providers** | High | `App.jsx` (lib), `Layout.jsx` (context) | App uses `AuthProvider` from `@/lib/AuthContext`; Layout uses `AuthProvider` from `@/components/context/AuthContext`. Two parallel auth trees. Layout’s RouteGuard and GlobalNavigation use context Auth only. |
| **Auth context missing `role` and `isAuthenticated`** | **Critical** | `src/components/context/AuthContext.jsx` | Provider value has `user`, `isLoading`, `login`, `logout`, `register`, `checkSession` only. GlobalNavigation and RouteGuard use `const { role, isAuthenticated } = useAuth()`. So `role` and `isAuthenticated` are undefined. Nav visibility and route guards will not behave correctly. **Fix**: Expose `isAuthenticated: !!user` and `role: user?.role ?? 'client'` (or derive from API shape). |
| **Single source of truth** | OK | navigationVisibility.js, navigationConfig.jsx | Nav visibility and zone logic are centralized; both use lowercase pathname for comparison. |

---

### 2. User journey (CLIENT)

| Finding | Severity | Location | Detail |
|--------|----------|----------|--------|
| **Link to non-existent page** | **Critical** | SidebarMenu.jsx, GlobalNavigation | `createPageUrl('EditProfile')` → `/EditProfile`. No `EditProfile` in `pages.config.js` (only `AccountSettings`). Results in 404. **Fix**: Use `AccountSettings` or add EditProfile page. |
| **Dashboard/Sidebar links** | Medium | SidebarMenu.jsx | All menu items use `link: 'Dashboard'`; "My Profile", "My Bookings", etc. all go to Dashboard. Likely intentional placeholder; confirm intended targets (e.g. UserBookings, AccountSettings). |

---

### 3. Barber / shop journey (PROVIDER)

| Finding | Severity | Location | Detail |
|--------|----------|----------|--------|
| **Provider zone missing paths** | **Critical** | `navigationConfig.jsx` `getZoneFromPath` | PROVIDER zone only checks `/providerdashboard`, `/providerbookings`, `/providersettings`, `/shop/`. Does **not** include `/providerpayouts` or `/providertermsofservice`. So `ProviderPayouts` and `ProviderTermsOfService` are classified as **CLIENT** (fallback). Layout and nav will treat them as client zone. **Fix**: Add `path === '/providerpayouts'` and `path === '/providertermsofservice'` to the PROVIDER branch. |
| **RouteGuard role check** | High | RouteGuard.jsx | Uses `role !== 'provider' && role !== 'admin'`. Backend may return `barber` or `shop_owner` instead of `provider`. If so, providers would be redirected to Dashboard. **Fix**: Align with API: e.g. `['provider','barber','shop_owner'].includes(role)` for provider zone. |
| **Manager-only pages** | Medium | RouteGuard.jsx | `managerPages = ['/staffroster', '/staffschedule', '/finances', '/inventorymanagement']`. None of these routes exist in `pages.config.js`. Either add routes or remove guard until pages exist. |

---

### 4. Admin journey (ADMIN)

| Finding | Severity | Location | Detail |
|--------|----------|----------|--------|
| **Admin dashboard path wrong** | **Critical** | `navigationVisibility.js` `getDashboardPath(role)` | For `role === 'admin'` returns `'UserManagement'`. There is no page `UserManagement` in `pages.config.js` (admin pages: AdminBackups, AdminDisputes, AdminUserModeration, GlobalFinancials, UserModerationDetail). Logo/home link for admin goes to `/UserManagement` → 404. **Fix**: Return an existing admin page, e.g. `'GlobalFinancials'` or `'AdminUserModeration'`. |
| **Admin settings link** | High | GlobalNavigation.jsx | `path: role === 'admin' ? 'AdminSettings' : 'ProviderSettings'`. No page `AdminSettings` in config. Results in 404. **Fix**: Use existing admin page (e.g. AdminBackups or a dedicated settings page) or add AdminSettings. |

---

### 5. Discrepancies & redundancy

| Finding | Severity | Location | Detail |
|--------|----------|----------|--------|
| **Paths that don’t exist** | High | navigationConfig.jsx, navigationVisibility.js | `getZoneFromPath` and PUBLIC_PATHS/ROOT_PATHS reference `/about`, `/registershop`, `/termsofservice`, `/privacypolicy`, `/onboarding`, `/user-management`. `pages.config.js` has TermsOfService, Privacy, etc. (PascalCase). Lowercase comparison is correct for pathname, but `/about`, `/registershop`, `/onboarding`, `/user-management` have no corresponding pages. Either add pages or remove from path lists to avoid misleading zone/visibility. |
| **Duplicate Auth** | High | See §1 | Two Auth providers; Layout’s context does not expose role/isAuthenticated. Consolidate on one Auth context (prefer lib or extend context with role + isAuthenticated). |

---

### 6. Broken workflows

| Finding | Severity | Location | Detail |
|--------|----------|----------|--------|
| **Auth/role flow** | Critical | context AuthContext + RouteGuard + GlobalNavigation | Without `role` and `isAuthenticated` from context, provider/admin guards and nav visibility cannot work correctly. |
| **Booking flow** | OK | RouteGuard | Payment/bookingconfirm guard present; redirect commented out but logic exists. |
| **Route case** | Low | App.jsx | Routes are PascalCase (`/Home`, `/SignIn`). If user types `/home` or `/signin` in the browser, React Router may not match (case-sensitive). In-app links use createPageUrl (PascalCase) so OK. Optional: add lowercase redirects or case-insensitive route matching. |

---

### 7. Fixes applied (2026-02-03)

1. **Auth context** — In `src/components/context/AuthContext.jsx`, exposed `isAuthenticated: !!user` and `role: user?.role ?? 'client'`. Backend `/api/auth/me` returns user with `role` (client, barber, admin, shop_owner).
2. **Provider zone** — In `navigationConfig.jsx` `getZoneFromPath`, added `/providerpayouts` and `/providertermsofservice` to the PROVIDER branch.
3. **Admin dashboard** — In `navigationVisibility.js` `getDashboardPath`, admin now returns `'GlobalFinancials'`; admin dashboard visibility check updated to `/globalfinancials`. Added `'provider'` to getDashboardPath for provider/barber/shop_owner.
4. **Admin settings** — In GlobalNavigation, settings link for admin now uses `'AdminUserModeration'` instead of `'AdminSettings'`.
5. **EditProfile** — In SidebarMenu and GlobalNavigation, Profile link now uses `'AccountSettings'` instead of `'EditProfile'`.
6. **RouteGuard provider role** — Provider zone now allows `role` in `['provider', 'barber', 'shop_owner', 'admin']`; dashboard redirect for provider/barber/shop_owner (non-admin) to ProviderDashboard.
7. **Loyalty link** — GlobalNavigation Loyalty item path changed from `'LoyaltyProgram'` to `'Loyalty'` (matches pages.config).

*Deferred: Consolidating two Auth providers (lib vs context); cleanup of path lists for /about, /registershop, etc. (optional).*
