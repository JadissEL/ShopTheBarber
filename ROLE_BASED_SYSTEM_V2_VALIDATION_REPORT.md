# Role-Based System V2 — Validation & Quality Audit Report

> **Date:** 2026-07-08  
> **Scope:** Post-implementation validation of V2 RBAC (Phases 1–5 + Playwright journeys)  
> **Method:** Codebase audit, automated test inventory, simulated user journeys (static UX review), permission penetration analysis, data-model review  
> **Authority:** Complements `ROLE_BASED_SYSTEM_V2_SPEC.md`; does **not** replace production QA or live Clerk/browser runs  
> **Verdict:** **Not production-ready** until critical security findings (§3) are remediated

---

## Executive summary

V2 successfully delivers the **business vision at the product shell level**: distinct dashboards, onboarding embeds, capability-filtered navigation, and role-aware routing for all six account types. Automated tests cover representative RBAC scenarios (spec §7) and pass.

However, this audit found **authorization gaps outside the tested paths** in the generic entity router, **duplicated role logic** across frontend and backend, and **dashboard depth** that falls short of the spec’s KPI promises for Seller, Company, and Blogger. The onboarding system is the strongest UX surface; several dashboards are structurally correct but analytically shallow.

**Overall score: 67 / 100** — strong foundation, not shippable without security hardening.

| Dimension | Score | Summary |
|-----------|------:|---------|
| Architecture | 72 | Central capability model exists; not fully adopted; fail-open generic router |
| Security | 52 | Spec §7 paths guarded; generic CRUD and FK scope have critical holes |
| UX | 68 | Provider + onboarding strong; Seller/Company/Blogger dashboards immature |
| Scalability | 64 | New account type requires 9+ coordinated edits; dual FE/BE grant tables |
| Business alignment | 74 | Role separation achieved; commerce/analytics gaps vs spec §2 |
| Code quality | 70 | Consistent patterns in new V2 code; legacy duplication remains |

---

## 1. Architecture audit

### 1.1 Is the permission system centralized?

**Partially yes — with important exceptions.**

| Layer | Central authority | Location |
|-------|-------------------|----------|
| Capability grants | ✅ | `server/src/auth/capabilities.ts` — 20 capability keys, grant table |
| Entity write mapping | ✅ | `server/src/auth/entityWriteCapabilities.ts` — entity → capability |
| Route pre-handlers | ✅ | `server/src/auth/authPreHandlers.ts` — `requireCapability()` |
| Dedicated APIs | ✅ | Products, jobs, articles, admin routes use capability or role checks |
| Generic entity router | ⚠️ **Fail-open** | `server/src/index.ts` — entities not listed in guard sets may allow unauthenticated or unscoped writes |
| Frontend UX | ✅ (non-authoritative) | `src/lib/capabilities.js` — mirrors grants for nav/hide |

**Good architectural decisions**

1. **Immutable `account_type`** at signup with `409 ACCOUNT_TYPE_CONFLICT` on mismatch (`server/src/auth/provisionUser.ts`).
2. **Backend-as-authority** principle documented and mostly followed on dedicated routes.
3. **`requireCapability` factory** enables consistent route-level guards without per-route ad hoc strings.
4. **Entity write capability map** cleanly separates admin-only entities (`legal_document`) from role-gated ones.
5. **Adaptive Provider dashboard** (OQ-1) avoids duplicate solo/shop dashboard code paths.
6. **`dashboardRegistry.js` + `accountTypeNav.js`** give a registry pattern for dashboards and nav.

**Technical debt**

1. **Duplicated grant logic** — `capabilities.ts` and `src/lib/capabilities.js` maintain parallel `CAPABILITY_GRANTS` tables by hand. Drift is undetected.
2. **Contract test checks key names only** — `server/src/auth/capabilities.contract.test.ts` verifies `CAPABILITY_KEYS` arrays match; it does **not** verify grant parity per `(accountType, capability)`.
3. **Legacy dual identity** — `users.role` (barber, shop_owner, provider) coexists with `users.account_type` (solo_barber, shop). Resolution bridges exist but ~25+ sites still hardcode `role ===`.
4. **Local `isAdmin` redefinitions** in jobs, articles, marketplace logic instead of importing `isAdminRole` from `platformRbac.ts`.
5. **`companyCommerce`** is env-allowlist only (`COMPANY_COMMERCE_USER_IDS`); DB-backed activation is TODO (`server/src/auth/companyCommerce.ts`).
6. **Two shop permission systems** — platform capabilities (`staff.manage`) vs granular shop RBAC (`shopRbac.ts`, `requireShopPermission`). Generic router uses only the former.

**Future scalability risks**

| Risk | Impact | Likelihood |
|------|--------|------------|
| New entity added to `ENTITY_TABLE` without guard set entry | Unauthenticated or unscoped writes | **High** (already happened for `brand`) |
| FE/BE capability drift | UI shows actions backend rejects (or hides valid actions) | Medium |
| Adding 7th account type touches 9+ files with no exhaustiveness | Incomplete rollout | High |
| Orphan `provider` role with no `account_type` source | Confusing auth resolution | Medium |

**Can a new account type be added easily?**

**No — not without rewriting many files.** Required touchpoints today:

1. `server/src/auth/accountType.ts` — enum, platform role, labels, predicates  
2. `server/src/auth/capabilities.ts` — whitelist + every relevant grant  
3. `src/lib/capabilities.js` — mirror grants  
4. `server/src/auth/provisionUser.ts` — `createTypedProfiles`  
5. `src/lib/dashboardRegistry.js`  
6. `src/lib/accountTypeNav.js`  
7. `src/lib/accountType.js`  
8. `src/lib/onboardingWizard.js`  
9. Route zones in `RouteGuard.jsx` / `navigationConfig`

This contradicts spec §1.3’s “additive without guard rewrites” goal for entities already on the generic router.

**Are frontend and backend using the same source of truth?**

**No — they mirror the same design, not the same artifact.**

- Backend: `server/src/auth/capabilities.ts` (authoritative)  
- Frontend: `src/lib/capabilities.js` (UX-only copy)  
- Partial FE mirror: `src/lib/accountType.js` ↔ `server/src/auth/accountType.ts`  

There is no shared package or code generation. The contract test does not enforce behavioral parity.

---

## 2. Real user simulation

> **Method note:** Journeys below are simulated by tracing routes, components, onboarding flows, and existing Playwright specs. Live Clerk sign-in was **not** re-run for this report. Gaps marked **Verified bug** come from static analysis.

### 2.1 Client

| Step | Status | Findings |
|------|--------|----------|
| Account creation | ✅ | `/chooseaccounttype` → Clerk → provision with locked type |
| Login | ✅ | Clerk + `/api/auth/me` sync |
| Dashboard | ⚠️ | Rich hub (loyalty, spending, picks, rebook). **Verified bug:** `MapPin` used in Featured Studios (`Dashboard.jsx:445`) but not imported — section crashes when shops render |
| Search | ✅ | Explore + search field on dashboard |
| Booking | ✅ | BookingFlow; guest path exists |
| Favorites | ✅ | Dedicated page; RouteGuard protects |
| Wallet | ✅ | `ClientWallet` |
| Profile / Settings | ✅ | Account settings available |

**UX issues:** Non-client users hitting `/Dashboard` redirect correctly. Payment return toasts on dashboard are good. Featured Studios crash is a **P0 UX bug**.

**Unnecessary steps:** None critical; onboarding banner may repeat for returning users (by design).

---

### 2.2 Solo barber

| Step | Status | Findings |
|------|--------|----------|
| First login | ✅ | Redirect to `ProviderDashboard` |
| Onboarding | ✅ **Strong** | Wizard with real embeds, Stripe return, completion from live data |
| Profile creation | ✅ | Barber record via onboarding / provider settings |
| Adding services | ✅ | ProviderSettings services tab |
| Availability | ✅ | Schedule / time blocks |
| Receiving bookings | ✅ | ProviderBookings |
| Managing clients | ✅ | ClientList |
| Publishing content | ⚠️ | Showcase/blog paths exist; not prominent on dashboard |
| Analytics | ✅ | Provider dashboard has revenue chart, operational stats, trust score |

**Quality vs Fresha/Square (~65–70%):** Core booking loop is credible. Dashboard is the richest role surface. Missing: simpler first-day checklist prominence, mobile-first calendar polish, marketing automation.

**Designed for barber business?** **Yes** for booking operations; **partial** for retail product management (marketplace products accessible but not hero-level on dashboard).

---

### 2.3 Barber shop

| Step | Status | Findings |
|------|--------|----------|
| Multi-staff management | ✅ | Staff roster, shop employee management |
| Services | ✅ | Shared provider settings |
| Employees | ✅ | Shop members (dedicated + generic API — see §3 security) |
| Calendar | ✅ | Staff schedule |
| Inventory / Expenses | ✅ | Shop-specific pages |
| Reviews | ✅ | Provider review flows |
| Analytics | ✅ | Shop sections on adaptive ProviderDashboard |

**Quality vs Fresha (~65%):** Multi-staff features exist but shop dashboard differentiation from solo barber is subtle (adaptive sections, not a distinct “shop command center”).

---

### 2.4 Seller

| Step | Status | Findings |
|------|--------|----------|
| Store creation | ✅ | Onboarding embed + `SellerSettings` profile |
| Product creation | ✅ | `MarketplaceProductEditor`, products nav |
| Inventory | ⚠️ | Low-stock count on dashboard; no dedicated inventory UX |
| Orders | ✅ | `SellerOrders` |
| Analytics | ❌ **Gap** | No sales chart, no time-series, no conversion funnel |
| Settings | ✅ | **Own** `SellerSettings` (not ProviderSettings) — V2 win |

**Quality vs Shopify (~40%):** Layout is clean and **feels like a seller shell**, not a repurposed provider dashboard. However:

- **“Catalog value” KPI** (`useSellerDashboardData.js:36`) = sum(price × stock), **not revenue** — misleading label vs spec §2 “Revenue” KPI  
- No trend deltas on `MetricCard` anywhere in seller dashboard  
- No fulfillment SLA or shipping status summary beyond pending count  

**Verdict:** Correct role identity; **not** a real seller platform analytics-wise.

---

### 2.5 Company

| Step | Status | Findings |
|------|--------|----------|
| Company profile | ✅ | Onboarding embed |
| Job posting | ✅ | CreateJob, company employer type (fixed in Phase 5) |
| Applicant management | ✅ | ApplicantReview |
| Recruitment workflow | ⚠️ | Pipeline on dashboard; no funnel visualization |
| Commerce (if enabled) | ⚠️ | Gated by env allowlist, not admin UI; products nav hidden until `company.commerce` |

**Quality vs LinkedIn Jobs (~40–45%):** Hub layout and CTAs (“Post job”) are appropriate. Missing: applicant stage breakdown, team collaboration, company page SEO metrics, sponsored job analytics.

**N+1 performance:** Dashboard fires up to **5 parallel applicant list queries** per job (`useCompanyDashboardData.js:41–47`) — acceptable at small scale, costly at scale.

---

### 2.6 Blogger

| Step | Status | Findings |
|------|--------|----------|
| Creator profile | ✅ | Author profile via onboarding |
| Article creation | ✅ | BlogArticleEditor |
| Publishing workflow | ⚠️ | Draft queue on dashboard; review states exist |
| Audience analytics | ⚠️ | Total views only; no engagement rate, referrals, or growth chart |
| Product selling | ✅ | Marketplace products nav + count on dashboard |
| Book as client | ✅ | Next appointment / Explore CTA |

**Quality vs Medium/Substack (~45%):** Creator studio naming and draft queue are right. Missing: newsletter/subscriber metrics, read-time, publication calendar, revenue from products tied to articles.

**Settings gap:** Uses generic `AccountSettings`, not a blogger-specific settings page (unlike Seller).

---

## 3. Permission penetration testing

### 3.1 Spec §7 scenarios (automated — passing)

Integration and unit tests cover the **representative matrix** in spec §7: client/seller/solo barber/shop/company/blogger write paths, admin denial, seller provider-wallet 403, RouteGuard seller redirect.

**Limitation:** Tests prove **known scenarios**; they do not exhaust the generic entity surface.

### 3.2 Attempted breakouts — results

| Actor | Attack | Frontend | Backend | DB bypass |
|-------|--------|----------|---------|-----------|
| Client | `POST /api/services` | N/A (API) | **403** ✅ | Blocked |
| Client | `POST /api/barbers` | **403** ✅ | **403** ✅ | Blocked |
| Client | Access `/ProviderSettings` | Redirect to client dashboard ✅ | N/A | N/A |
| Seller | `/ProviderSettings` | Redirect to SellerDashboard ✅ | Wallet API **403** ✅ | N/A |
| Seller | `POST /api/services` | Hidden | **403** ✅ | Blocked |
| Blogger | `POST /api/services` | Hidden | **403** ✅ | Blocked |
| Blogger | Company job routes | Nav hidden | Would need capability — jobs allowed for employer types including blogger via `job.write` if implemented | — |
| Company | `POST /api/admin/*` | Nav hidden | **403** ✅ | Blocked |
| Any | `POST /api/brands` (no auth) | N/A | **200 possible** ❌ | **Write succeeds** ❌ |
| Shop account | `POST /api/shop_members` with victim `shop_id` | N/A | Capability passes; **no shop scope on create** ❌ | **Insert succeeds** ❌ |
| Provider | `POST /api/services` with competitor `shop_id` | N/A | Capability passes; **FK not bound to caller** ❌ | **Insert succeeds** ❌ |
| Provider | `PATCH /api/services/:id` reassign `shop_id` | N/A | Scope on old row only ❌ | **Update succeeds** ❌ |

### 3.3 Documented vulnerabilities

#### CRITICAL

| ID | Issue | Location | Impact |
|----|-------|----------|--------|
| **V1** | Unauthenticated write to `brand`, `brand_accolade`, `brand_collection` | `server/src/index.ts:211-218, 1215-1219` — not in `AUTH_WRITE_ENTITIES` or `AUTH_REQUIRED_ENTITIES` | Anyone can create/edit/delete marketplace brand catalog |
| **V2** | Cross-shop takeover via `POST /api/shop_members` | Generic CREATE has capability check but **no `shop_id` scope validation** | Attacker gains `owner` membership on任意 shop → full shop data access |
| **V3** | Generic CREATE accepts arbitrary `shop_id` / `barber_id` | `index.ts` create handler after capability check | Pollute competitor calendars, services, inventory |
| **V4** | PATCH allows FK reassignment out of scope | Only `promo_code` re-validates new `shop_id` on update | Hijack/move records across tenants |

#### HIGH

| ID | Issue | Location |
|----|-------|----------|
| **V5** | `pricing_rule` generic admin write broken; public read exposes fee structure | `ADMIN_ONLY_WRITE_ENTITIES` without auth preHandler |
| **V6** | `POST /api/barbers/:id/sync-trust` — any authenticated user | `financialTrustRoutes.ts` |
| **V7** | FE `FeatureGuard` checks feature flags only, not capabilities | `FeatureGuard.jsx` |

#### MEDIUM / LOW

- FE/BE grant table drift (no parity test)  
- `provider` legacy role without account_type source  
- Company commerce env-gated only  
- Author attribution spoofing on generic `inspiration_post` create  

### 3.4 Penetration verdict

**Spec §7 RBAC: PASS** for tested endpoints.  
**Holistic RBAC: FAIL** — generic entity router is fail-open and create/update scope is incomplete.

**Production gate:** Fix V1–V4 before any production launch claiming “V2 RBAC complete.”

---

## 4. Dashboard quality review

| Dashboard | Hierarchy | Primary actions visible | KPI quality | Empty states | Premium feel | Benchmark gap |
|-----------|-----------|-------------------------|-------------|--------------|--------------|---------------|
| Client | Good | Book, rebook, explore | Meaningful | Helpful | Good | Crash bug hurts trust |
| Provider (solo/shop) | Strong | Services, payouts, bookings | Strong + charts | Good | Best in app | ~30% below Fresha polish |
| Seller | Clear | Add product, orders | **Misleading** catalog value | Good | Clean but thin | ~60% below Shopify |
| Company | Clear | Post job, applicants | Snapshot only | Good | Professional | ~55% below LinkedIn Jobs |
| Blogger | Clear | New draft, articles | Views only | Good | Clean | ~55% below Medium |

**Cross-cutting issues**

1. `MetricCard` trend/delta props unused across all role dashboards — missed opportunity for “premium” feel.  
2. No role dashboard uses skeleton loading consistently beyond `PageLoading`.  
3. Company/Blogger lack role-owned settings pages.  
4. Spec §2 promises sales charts for Seller and company analytics — **not implemented**.

---

## 5. Database and data model review

### 5.1 Account types

- `users.account_type` + `account_type_locked_at` — ✅ correct immutable model  
- Sub-profiles: `seller_profiles`, `company_accounts`, `author_profiles` — ✅ 1:1 with cascade  
- Legacy `users.role` retained for admin and migration — ⚠️ dual source of truth  

### 5.2 Relationships

- Company → jobs via `company_id` — ✅ fixed in Phase 5  
- Shop ownership via `shops.owner_id` + `shop_members` — ✅ structurally sound  
- **Gap:** Write-time FK enforcement not modeled — scope only on read/update/delete (`entityScope.ts`)

### 5.3 Permissions storage

- Capabilities are **computed**, not stored in DB — ✅ correct for RBAC  
- Company commerce flag **not in DB** (env only) — ⚠️ operational gap  
- Shop granular permissions in `shop_members.role` — parallel to platform capabilities  

### 5.4 Orphaned / obsolete structures

| Item | Notes |
|------|-------|
| `provider` role | In `PLATFORM_PROVIDER_ROLES` but not produced by signup |
| `AccountTypeDashboard` | Deleted per V2 — ✅ |
| String-typed timestamps on most tables | Legacy; complicates analytics queries |
| `guest` role in FE helpers | Cosmetic legacy |

### 5.5 Future roles

Adding `supplier` or `academy` requires new profile tables + provision switch + capability rows — pattern exists but is manual.

---

## 6. Performance review

| Surface | API calls (typical) | Concern | Recommendation |
|---------|---------------------|---------|--------------|
| Seller dashboard | 2 parallel (`products.mine`, `listSellerOrders`) | Low | Add React Query staleTime; single aggregated endpoint optional |
| Company dashboard | 1 + up to 5 applicant lists + optional products | **Medium N+1** | Batch applicants API or include counts on jobs list |
| Blogger dashboard | 3 parallel + 2 booking filters | Low–medium | Consolidate booking lookup |
| Provider dashboard | 7+ sequential-gated queries | **Waterfall** | Parallelize independent queries; dashboard BFF endpoint |
| Capability checks | Per-request async (company commerce DB/env) | Low | Cache commerce flag on session/me response (partially on `/api/auth/me`) |
| Permission overhead | `rowInScope` + scope cache on reads | Acceptable | Keep; extend to writes |

**Dashboard load:** No measured p95 in this audit. Provider dashboard is the highest risk for perceived slowness due to query chaining.

---

## 7. Documentation status

This audit adds:

- **`ROLE_BASED_SYSTEM_V2_VALIDATION_REPORT.md`** (this file)  
- Updates to **`ROLE_BASED_SYSTEM_V2_SPEC.md`** §10 — final architecture, limitations, expansion guide  

Recommended follow-up docs (not created in this pass):

- `docs/RBAC_SECURITY_RUNBOOK.md` — generic entity router rules, default-deny policy  
- Penetration test checklist for each release  

---

## 8. Critical issues — must fix before production

| Priority | Issue | Owner area |
|----------|-------|------------|
| **P0** | V1 — Unauthenticated brand writes | `server/src/index.ts` |
| **P0** | V2 — Cross-shop `shop_member` create | Generic router + scope |
| **P0** | V3/V4 — Create/PATCH FK scope validation | Generic router |
| **P0** | Client dashboard `MapPin` import crash | `src/pages/Dashboard.jsx` |
| **P1** | Default-deny policy for all `ENTITY_TABLE` writes | Architecture |
| **P1** | FE/BE capability grant parity test (table-driven) | Tests — ✅ fixed 2026-07-08 |
| **P1** | DB-backed company commerce activation | `companyCommerce.ts` + admin API — ✅ fixed 2026-07-08 (admin UI TBD) |
| **P2** | Seller “Catalog value” → rename or replace with real revenue KPI | Dashboard |
| **P2** | Run full Playwright journey suite on provisioned QA users | QA |

---

## 9. Recommended improvements for V3

### Security & architecture

1. **Single capability source** — shared package or generated from `capabilities.ts` for FE.  
2. **Default-deny generic router** — unmapped entities return 403 on write.  
3. **Unified write scope helper** — `assertForeignKeysInScope(user, body)` on all creates/patches.  
4. **Retire legacy `provider` role** — migration + remove from RBAC sets.  
5. **Consolidate shop RBAC** — route all `shop_member` mutations through `requireShopPermission`.

### Product & UX

1. **Seller analytics v2** — revenue time-series, order funnel, fulfillment SLA (Shopify-class).  
2. **Company recruitment analytics** — applicant funnel by stage, time-to-hire.  
3. **Blogger analytics** — engagement, top referrers, article↔product attribution.  
4. **Role-owned settings** for Company and Blogger.  
5. **Provider product retail** — hero section on provider dashboard for marketplace SKUs.

### Platform

1. **`supplier` account type** (OQ-5 follow-up) — B2B wholesale.  
2. **Admin UI for company commerce** — replace env allowlist.  
3. **Dashboard BFF endpoints** — one call per role dashboard.  
4. **Academy type** — when approved, follow registry pattern with codegen for touchpoints.

### Quality

1. Expand contract tests to full grant matrix.  
2. Add generic-router security integration tests for every `ENTITY_TABLE` entry.  
3. CI: Playwright role journeys with `qa:provision`.

---

## 10. Test inventory (what “passing tests” actually proves)

| Suite | Count (approx) | Proves | Does not prove |
|-------|----------------|--------|----------------|
| Spec §7 integration tests | 25+ | Role write allow/deny on dedicated + gated generic entities | Brand bypass, FK injection, shop_member takeover |
| `capabilities.contract.test.ts` | 11 | Full FE/BE grant parity (20 keys × 10 contexts) | Runtime capability enforcement on every route |
| Dashboard unit tests | 3 | Static render with mocks | Real data, UX quality |
| `onboardingWizard.test.js` | 25 | Wizard logic/completion rules | Live Stripe/Clerk |
| `RouteGuard.test.jsx` | 3 | Redirect rules | All routes |
| Playwright journeys | 13 new + legacy | Browser navigation when Clerk env present | Production URLs (skipped) |

---

## 11. Sign-off checklist

| Gate | Status |
|------|--------|
| V2 Phases 1–5 implemented | ✅ |
| Spec §7 automated scenarios | ✅ |
| Business vision — role separation in UI | ✅ |
| Business vision — analytics depth | ❌ |
| Security — holistic RBAC | ⚠️ **P0 fixes applied 2026-07-08** (see §12) |
| Production-ready | ⚠️ **Re-audit recommended** — P0 generic-router fixes shipped; UX/analytics gaps remain |

---

## 12. Remediation log (2026-07-08)

| ID | Fix | Status |
|----|-----|--------|
| V1 | Brand/accolade/collection writes require auth + admin | ✅ Fixed |
| V2 | `shop_member` create scoped to managed shops; owner role restricted | ✅ Fixed |
| V3 | Generic CREATE FK scope validation (`entityWriteScope.ts`) | ✅ Fixed |
| V4 | Generic PATCH FK scope validation | ✅ Fixed |
| V5 | `pricing_rule` writes require auth preHandler | ✅ Fixed |
| V6 | `sync-trust` scoped to barber owner or admin | ✅ Fixed |
| UX P0 | Client dashboard `MapPin` import | ✅ Fixed |
| P1 | Default-deny generic CREATE via `isGenericCreateAllowed` | ✅ Fixed |
| P1 | Expanded capability contract baseline tests | ✅ Fixed — full FE/BE grant matrix |
| P1 | DB-backed company commerce (`commerce_enabled`, admin PATCH) | ✅ Fixed |
| P1 | Admin UI for company commerce toggle | ⏳ Open (API only) |

**New tests:** `api.genericEntityWriteScope.integration.test.ts`, `entityWriteScope.test.ts`, `companyCommerce.test.ts`; integration tests use DB flag via `seedCompanyWorkspace(..., { commerceEnabled })`

---

*Report generated from codebase state at commit `85d441c` (main). Updated 2026-07-08 after P0 security fixes and P1 company commerce + capability parity.*
