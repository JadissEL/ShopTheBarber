# Decisions

Append-only log of **what was decided**, **why**, and **what was rejected**. Newest entries at the **bottom** (or top — pick one convention and keep it).

## Template (copy per entry)

```markdown
### YYYY-MM-DD — Short title

- **Context:** …
- **Decision:** …
- **Rationale:** …
- **Alternatives considered:** …
- **Status:** proposed | accepted | superseded (by …)
```

---

### 2026-05-01 — Clerk session maps to sovereign `users.id`

- **Context:** Ten-pass backend audit found entity scope and FK-shaped fields expecting DB UUID while Clerk-only paths used JWT `sub`.
- **Decision:** Unified auth via `authenticateRequest`: verify sovereign JWT first; else Clerk; then lookup/link by `clerk_user_id` or email or provision row; attach `{ id, email, role }` from DB.
- **Rationale:** Row-level scope and client `user.id` stay consistent without duplicating Clerk id as synthetic UUID.
- **Alternatives considered:** Store only Clerk id in JWT and remap in every handler (rejected: error-prone, wide diff).
- **Status:** accepted

### 2026-05-01 — Postgres: versioned Drizzle SQL for `clerk_user_id`

- **Context:** Production must not use interactive destructive `push`.
- **Decision:** Checked-in migration [`server/drizzle/0000_clerk_user_id.sql`](server/drizzle/0000_clerk_user_id.sql) (journal dialect `postgresql`); operators run `npm run migrate` with `DATABASE_URL`; SQLite unchanged (`db:add-clerk-column`).
- **Rationale:** Idempotent ADD COLUMN / partial unique index; matches schema intent.
- **Alternatives considered:** Only hand scripts (rejected — no Drizzle bookkeeping).
- **Status:** accepted

### 2026-05-01 — Clerk browser E2E via `@clerk/testing`

- **Context:** Audit asked for Clerk browser path beyond Bearer JWT scraping.
- **Decision:** `@clerk/testing/playwright` `clerk.signIn({ page, emailAddress })` plus Playwright **`clerk-browser`** project targeting `E2E_FRONTEND_URL`; secrets-driven; skipped when unset.
- **Rationale:** Official helper uses `CLERK_SECRET_KEY` server-side token (no flaky UI selectors for MFA-heavy flows).
- **Alternatives considered:** Raw Playwright fills on `<SignIn/>` (rejected — brittle across Clerk UI changes).
- **Status:** accepted

### 2026-05-01 — `DRIZZLE_BOOTSTRAP=push` for empty Postgres

- **Context:** `migrate`-only builds cannot create full schema from zero.
- **Decision:** Env-gated **`DRIZZLE_BOOTSTRAP=push`** in `build-database.mjs`; operators enable for one Render deploy, then delete.
- **Rationale:** Opt-in escape hatch vs documenting only local manual push.
- **Alternatives considered:** Full baseline migration bundle (deferred — large churn).
- **Status:** accepted

### 2026-05-01 — Render `build-database`: migrate vs push

- **Context:** Postgres production should not use interactive `push`; SQLite free tier keeps prior flow.
- **Decision:** `server/scripts/build-database.mjs` — if `DATABASE_URL`, `drizzle-kit migrate`; else delete `sovereign.sqlite` and `push`. Render Blueprint `buildCommand` calls this script.
- **Rationale:** One build entrypoint; additive migrations for linked Postgres; SQLite unchanged.
- **Alternatives considered:** Runtime migrate in `start` (rejected for now — build-time is enough).
- **Status:** accepted

### 2026-05-01 — Request-scoped `EntityScopeCache` for entity scope

- **Context:** `getEntityScopeCondition` / `rowInScope` issued repeated barber_id + shop_id lookups per HTTP request.
- **Decision:** Attach `createEntityScopeCache()` on `request` after successful `authenticateRequest`; pass into scope helpers so barber + shop ids load once per user id per request.
- **Rationale:** Cuts redundant SQLite round-trips without denormalizing schema.
- **Alternatives considered:** Global TTL cache (rejected — stale membership risk).
- **Status:** accepted

### 2026-06-25 — Workspace consolidation: shop-the-barber is canonical; legacy archived

- **Context:** Parent workspace `ShopTheBarber/` held 11 sibling folders across 4 lineages (this Vite+Fastify app, a base44 SDK export `shop-the-barber-66280349`, a Next.js+Supabase `lebarbier` ×3, a Builder.io+Express `pixel-verse` ×2, Stitch mockups, UML docs, editor settings).
- **Decision:** `shop-the-barber` selected as the single source of truth (78 pages, sovereign backend, base44-free, own git, deploy configs). All other folders moved to `ShopTheBarber/_archive/` (reversible same-volume move, no code changes). No cross-stack feature porting (gap analysis found zero safe candidates — legacy extras are base44-coupled or on incompatible stacks).
- **Rationale:** Master is the descendant superset; cross-stack merges would be rewrites and risk regressions; archiving keeps history recoverable.
- **Alternatives considered:** Delete legacy folders (rejected — irreversible, only copies); rename master to `Final_Project/` (rejected — would break git/deploy wiring); port features across stacks (rejected — out of approved scope, high risk).
- **Status:** accepted

### 2026-06-26 — Backend migrated to Prisma + Neon (only DB) and Clerk-only auth

- **Context:** Backend was dual-ORM (Drizzle runtime over SQLite/Postgres + Prisma for migrations only) with a legacy JWT/password auth path alongside Clerk.
- **Decision:** Prisma Client is now the single runtime data layer against Neon PostgreSQL (only DB). Rewrote ~256 Drizzle queries across 24 files to Prisma (generic entity layer in `index.ts` uses `prisma[table]` delegates + DMMF field allow-list; `entityScope.ts` returns Prisma `where` objects). Removed SQLite + Drizzle (schema, drizzle config/migrations, better-sqlite3, drizzle-orm/kit, pg). Auth is Clerk-only: removed JWT email/password (`password.ts`, login/register/refresh, `@fastify/jwt`, bcrypt, jsonwebtoken); `requestUser.ts` resolves Clerk Bearer → Neon user via Prisma. Tests route to an isolated Neon branch (`automated-tests`, `br-proud-band-affvdwca`) via `TEST_DATABASE_URL`. Hardening: `@fastify/helmet`, fail-fast env validation, `build-database.mjs` = prisma generate + migrate deploy.
- **Rationale:** Single ORM/DB/auth removes drift and tech debt; Prisma column types kept as-is (incl. String timestamps) to avoid touching date handling app-wide.
- **Work done on branch:** `migration/prisma-neon-clerk` (commit `a6755df`). NOT pushed/deployed — production cutover gated on explicit go-ahead.
- **Validation:** backend 7/7, frontend 6/6, build + lint clean, 0 type errors, Neon CRUD/relations verified via MCP.
- **Status:** accepted (deploy pending)

### 2026-06-26 — Loyalty earn/redeem calibrated to industry (Booksy/Fresha)

- **Context:** Client-side loyalty used 10 pts/$1 and fake dashboard balances; no redemption path to checkout.
- **Decision:** Server-owned program: **1 pt/$1** base earn, **100 pts = $2** (~2% effective return), tier multipliers (Silver +10%, Gold +25%, Platinum +50%), marketplace **2×** earn. Redeem deducts points and issues user-scoped `LOYAL-*` promo codes (90-day expiry). Awards on booking `completed` (idempotent) and Stripe marketplace webhook.
- **Rationale:** Matches Booksy/Fresha norms; first $5 reward after ~2 visits ($25 ticket); sustainable margin vs aggressive 5–10% programs.
- **Alternatives considered:** 10 pts/$1 (rejected — 10% liability); points-only perks without promo codes (rejected — no checkout conversion).
- **Status:** accepted

### 2026-06-26 — Feature module registry for sprawl control

- **Context:** ~100 pages and flat 9–14 item sidebars; mock `AdminFeatureToggles` with no backend wiring.
- **Decision:** Single registry (`src/lib/featureRegistry.js`) groups pages into modules (core, marketplace, careers, content, engagement, messaging, programs, shop_ops, admin). Optional modules gated by `VITE_FEATURE_*=false` at build time. Nav components consume registry builders; `FeatureGuard` redirects disabled routes. Admin toggles page is read-only until runtime API exists.
- **Rationale:** Reduces cognitive load without deleting routes; enables lean prod builds (e.g. booking-only); one place to add new pages.
- **Alternatives considered:** Delete unused pages (rejected — high risk, breaks deep links); lazy-load only (insufficient — nav still cluttered).
- **Status:** accepted

### 2026-06-26 — Documentation SSOT: Prisma/Neon in tracker, AGENTS, Cursor rules

- **Context:** PROJECT_TRACKER, PROJECT_SCHEMA, and antigravity Cursor rule still described Drizzle/SQLite/JWT paths after Prisma/Neon migration.
- **Decision:** Current-state sections at top of PROJECT_TRACKER + AGENTS doc table + PROJECT_SCHEMA backend layout + three Cursor rules reference Prisma/Neon only. Historical SQLite/Drizzle content kept under "Historical archive" banner in tracker.
- **Rationale:** Agents and humans must not follow obsolete DB commands; single hierarchy matches README/DEPLOYMENT/NEON_PRISMA.
- **Alternatives considered:** Delete entire tracker history (rejected — loses prompt audit trail); leave drift banner only (rejected — insufficient for Cursor alwaysApply rules).
- **Status:** accepted

### 2026-06-28 — Financial & Trust Ecosystem Phase 1 policies

- **Context:** Launch needed documented wallet, booking, deposit, waitlist, marketplace, and trust rules before coding contradictory flows.
- **Decision:** Phase 1 implements tiered deposits (€10–30% floor), price lock at `price_at_booking`, wallet health tiers (cash blocked at &lt;-€20), chair/buffer capacity, QR check-in, 15-min waitlist cascade, marketplace first-reservation holds (30 min), public barber stats, ledger event types reserved, auto-confirm pending after 2h. Promotional credits consumed before purchased. Phase 2/3 scoped in `docs/specs/` only.
- **Implementation:** `server/src/domain/*`, migration `20260628100000_financial_trust_phase1`, cron routes under `/api/cron/bookings/auto-confirm`, `/api/cron/waitlist/expire-offers`, `/api/cron/marketplace/expire-reservations`.
- **Status:** accepted

### 2026-06-28 — Client late arrival & Phase 1 dispute policy

- **Context:** Launch gate required C1–C3 (late/no-show) and DS1–DS3 (disputes) before contradictory UX or support flows.
- **Decision:** **Late arrival:** slot held during 15 min grace; provider may mark no-show only after grace (`CLIENT_LATE_GRACE_MINUTES`); 30+ min strongly no-show eligible per payment protection. **Disputes:** admin resolves via existing dispute + support inbox; evidence = booking, messages, check-in, payments; one manual appeal within 7 days (Phase 2 structured appeals). **Promo credits:** expire via cron; non-transferable.
- **Implementation:** `server/src/domain/booking/clientLatePolicy.ts`; `paymentProtection/noShow.ts` uses shared grace constant; promo expiry cron; questionnaire Part D gate updated.
- **Status:** accepted

### 2026-07-08 — Company accounts can post jobs for linked company

- **Context:** V2 spec §7 requires `POST /api/jobs` → 200 for company role; prior logic threw "Only admins can post jobs on behalf of a company".
- **Decision:** `getEmployerProfiles()` loads `company_accounts` → `companyIds`; `resolveEmployerFields()` allows non-admin company users to post for their linked company; `userCanManageJob()` grants manage access via company account link; employer-profiles and jobs/my routes include company scope.
- **Rationale:** Aligns jobs API with company onboarding and dashboard without opening arbitrary company impersonation (company_id must match account link).
- **Alternatives considered:** Admin-only company jobs (rejected — contradicts spec); allow any company_id for authenticated users (rejected — security hole).
- **Status:** accepted

### 2026-07-08 — V2 validation audit: not production-ready

- **Context:** Phases 1–5 complete; user requested full validation before production.
- **Decision:** V2 RBAC **feature scope is complete** but platform is **not production-ready** until generic entity router vulnerabilities (unauthenticated brand writes, unscoped shop_member create, FK injection on generic CREATE/PATCH) are fixed.
- **Rationale:** Spec §7 tests cover representative paths; penetration audit found fail-open gaps outside that matrix.
- **Deliverable:** `ROLE_BASED_SYSTEM_V2_VALIDATION_REPORT.md`; spec §10 updated with limitations and production gate.
- **Status:** accepted

### 2026-07-08 — P1 company commerce DB + FE/BE capability parity

- **Decision:** Store company marketplace activation in `company_accounts.commerce_enabled` (with `commerce_enabled_at`); admin toggles via `PATCH /api/admin/company-commerce/:userId`; retain `COMPANY_COMMERCE_USER_IDS` env as ops override. Expand `capabilities.contract.test.ts` to full 20×10 grant matrix loading FE from `src/lib/capabilities.js`.
- **Rationale:** Removes env-only allowlist as sole source of truth; closes validation audit P1 gaps; integration tests seed DB flag via `seedCompanyWorkspace(..., { commerceEnabled })`.
- **Alternatives considered:** Admin UI only (deferred — API first); drop env override (kept for emergency ops).
- **Status:** accepted
