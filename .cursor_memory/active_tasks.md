# Active tasks

| ID | Task | Status | Priority | Depends on | Notes |
|----|------|--------|----------|------------|-------|
| rbac-v2-phase1 | V2 RBAC Phase 1 — security foundation | done | critical | spec approved | capabilities.ts, entity write gates, tests |
| rbac-v2-phase2 | V2 RBAC Phase 2 — dashboard redesign | done | high | phase1 | Real role dashboards + registry |
| rbac-v2-phase3 | V2 RBAC Phase 3 — onboarding redesign | done | high | phase2 | Role-specific embed forms |
| rbac-v2-phase4 | V2 RBAC Phase 4 — navigation cleanup | done | high | phase2 | Seller settings, capability-filtered nav |
| rbac-v2-phase5 | V2 RBAC Phase 5 — full test pass | done | high | phase4 | Spec §7 integration + dashboard tests |
| rbac-v2-p1-commerce | P1 DB-backed company commerce + capability parity | done | high | p0-security | migration, admin PATCH, contract tests |

**Status:** `pending` | `in_progress` | `done` | `cancelled`  
**Priority:** `low` | `medium` | `high`

---

## Done (recent)

- **2026-06-26** — **Operations & support:** keys walkthrough doc + `verify:secrets` + AdminKeysWalkthrough; public StatusPage + incident runbook; InAppSupportWidget → SupportChat inbox.
- **2026-06-26** — **Marketplace legal:** seller/buyer terms pages, VAT config (24% default), checkout acceptance, submit gate, MARKETPLACE_LEGAL.md.
- **2026-06-26** — **P2 remove dead auth paths:** Dropped `users.password_hash` (Prisma migration `20260627290000`); removed sanitize/stub in auth routes + requestUser; legacy `FST_JWT_*` handling in payments; updated SECURITY_AUDIT, DEBUG_AUTH, deployment docs.
- **2026-06-26** — **P1 lazy routes (TTI):** 19 core eager pages; ~80 lazy route chunks; RoutePageFallback + Suspense; vite vendor chunks.
- **2026-06-26** — **P0 doc alignment (Prisma/Neon SSOT):** AGENTS.md, PROJECT_TRACKER, PROJECT_SCHEMA, Cursor rules.
- **2026-06-26** — **P2 barber portfolio / story:** ShowcaseEmptyState, ShowcaseDiscoveryStrip, ShowcaseCompletenessCard; discovery-previews API.
- **2026-06-26** — **P2 review generation loop:** auto request on completion; 24h nudge cron; guest token reviews; Dashboard pending banner; migration `20260627280000_review_request_loop`.
- **2026-06-26** — **Onboarding wizard (top-tier):** bootstrap provider workspace; resume incomplete steps; client/profile + fixed-fee embeds; Stripe return; SetupGuide redirect; role banners; replay links; 51 Vitest.
- **2026-06-26** — **Docs SSOT:** README + `project_context.md` aligned to DEPLOYMENT.md + NEON_PRISMA.md; Prisma schema/migrations as DB truth.
- **2026-06-26** — **Feature sprawl:** `featureRegistry.js` + env gates; grouped sidebars; FeatureGuard; AdminFeatureToggles read-only; FEATURE_MODULES.md; 38 Vitest.
- **2026-06-26** — **Docs/deploy drift:** Canonical `docs/DEPLOYMENT.md` (Prisma + Neon); README/AGENTS/NEON_PRISMA synced; Upstash/geocoding in checklist; historical doc banners.
- **2026-06-26** — **Frontend/E2E tests:** Vitest mobile/nav suite; Playwright public + mobile specs; `test:e2e:public` / `test:e2e:mobile`.
- **2026-06-26** — **Mobile UX:** 5-tab bottom nav + More sheet; safe-area/pb-nav CSS; auth-only public nav; hide duplicate GlobalNavigation on mobile; booking sticky CTA; layout padding cleanup.
- **2026-06-26** — **Product analytics v3:** monthly LTV/fee/marketplace trends; analytics event summary; cohort retention curve + rebook charts in admin UI.
- **2026-06-26** — **Product analytics v2:** strict sequential funnel + daily trend + DB-blended terminal counts; admin CSV export; track rate limits; privacy export; Stripe/fixed-fee/marketplace server events; provider retention fix (`client_id`).
- **2026-06-26** — **Provider attestation (Licensed / Insured):** schema + API + Provider Settings toggles + profile/card badges; seed demo on gb1/gb6/s1; migration `20260627250000_provider_attestation`.
- **2026-06-26** — **Provider operational stats (full polish):** batch public stats, provider my-stats, optimized admin overview (barbers+shops), enriched disputes + resolve audit/refund, completed-services on cards/homepage/explore, Provider Dashboard operational row; tests + build green.
- **2026-06-26** — **SMS + email booking reminders:** Twilio SMS + Resend email ~24h before appointments; cron + GitHub workflow; STOP webhook; preferences/status/test-sms API; NotificationSettings UI; migrations `20260627120000`, `20260627140000`; tests + build green.
- **2026-06-26** — **Production DB stability + observability:** Applied 21 pending Neon migrations (promo_targeting, fixed_fee, offers_mobile_service, VIP/group); idempotent migration fixes; `verify-production-schema.mjs` + CI schema verify; Sentry backend/frontend integration; deep health endpoints; Render healthCheckPath; GitHub uptime workflow; docs updated.
- **2026-05-01** — **Promo / discount full stack:** schema `promo_codes.shop_id` + `bookings.discount_code`, Drizzle journal `0001`, SQLite `npm run db:add-promo-columns` (pre-test hook + skip if no DB), entity scope + ProviderSettings shop filter + BookingFlow `validate-promo-code` + public promotions endpoint; Explore/PromotionList/PromotionSetup migrated off fake `Promotion` entity; tracker + AGENTS docs.
- **2026-05-01** — Ten-pass UX/BE/DB audit: [`docs/AUDIT_FINDINGS_TEN_PASS_2026-05-01.md`](docs/AUDIT_FINDINGS_TEN_PASS_2026-05-01.md); `authenticateRequest` + `users.clerk_user_id` + AuthContext `sovereign.auth.me()`; additive SQLite column script; tracker + memory updates.
- **2026-05-01** — Productivity readiness: Tailwind/UI restore, Clerk + JWT_SECRET alignment, PROJECT_TRACKER update, Fastify GET order + POST filter ops, apiClient server queries, OBSERVABILITY_AND_DATA doc, Vitest + Clerk test wrap, lint + AGENTS.sqlite rebuild note.
