# Release Stabilization Plan (RS)

**Objective:** Move from **READY FOR STAGING** → **READY FOR PRODUCTION**  
**Scope:** Production blockers only — no V3 features, no UI redesign  
**Baseline:** `PRODUCTION_READINESS_REPORT.md` (2026-07-09)  
**Status:** RS1–RS5 complete; RS6 partial (46/53 journeys). Staging re-run required before production sign-off.

---

## Phases

| Phase | Priority | Focus | Exit criteria |
|-------|----------|-------|---------------|
| **RS1** | CRITICAL | Auth & session reliability | 1 persona = 1 `storageState`; journeys do not re-sign-in per test |
| **RS2** | CRITICAL | QA provisioning chain | `npm run qa:verify` green for all journey personas |
| **RS3** | HIGH | Complete role journeys | 7 roles covered in Playwright (incl. shop owner) |
| **RS4** | MEDIUM | Test / UI copy drift | Headings match E2E; `docs/UI_COPY_CONSISTENCY.md` |
| **RS5** | MEDIUM | Guest booking seed | `Signature Cut` + `gb1`/`s1` deterministic in QA seed |
| **RS6** | GATE | Production gate re-run | Updated `PRODUCTION_READINESS_REPORT.md` with evidence |

---

## RS1 — Authentication & session reliability

**Problem:** Serial Playwright suites called `signOutIfNeeded` + UI sign-in in `beforeEach`, causing session loss and Sign In redirects mid-journey.

**Solution:**

1. `e2e/setup/auth-personas.setup.ts` — sign in each journey persona once via `@clerk/testing` `clerk.signIn`
2. Persist cookies to `playwright/.auth/{persona}.json`
3. Each journey file uses `test.use({ storageState })` — **no shared session**
4. Playwright `setup-auth` project runs before `clerk-browser` when `QA_AUTH_JOURNEYS=1`

**Docs:** `docs/E2E_AUTH_ARCHITECTURE.md`

---

## RS2 — QA provisioning

**Problem:** Clerk users created without `clerk_user_id` written to Neon; barbers/shop owners missing `account_type`.

**Solution:**

1. `provision-qa-profiles.mjs` syncs `clerk_user_id` after Clerk API provision
2. `qaProfiles.ts` derives `account_type`: `barber` → `solo_barber`, `shop_owner` → `shop`
3. `npm run qa:verify` validates Clerk + DB + role + profile + dashboard path

---

## RS3 — Role journeys

| Role | QA profile | Spec file |
|------|------------|-----------|
| Client | `qa-c1` | `client.journey.browser.spec.ts` |
| Solo barber | `qa-b1` | `provider.journey.browser.spec.ts` |
| Shop owner | `qa-o1` | `shop-owner.journey.browser.spec.ts` *(new)* |
| Seller | `qa-seller` | `seller.journey.browser.spec.ts` |
| Company | `qa-company` | `company.journey.browser.spec.ts` |
| Blogger | `qa-blogger` | `blogger.journey.browser.spec.ts` |
| Admin | `qa-admin` | `admin.journey.browser.spec.ts` |

Each journey: login (via storage), dashboard, navigation, forbidden route checks.

---

## RS4 — Copy consistency

Normalize page headings to match MetaTags / E2E assertions. Checklist in `docs/UI_COPY_CONSISTENCY.md`.

---

## RS5 — Guest booking

`seedE2eGuestBookingFixture()` in QA seed ensures `s1`, `gb1`, `ser1` (`Signature Cut`) exist for `e2e/fixtures/seed-data.ts`.

---

## RS6 — Production gate

```bash
npm run qa:provision
npm run qa:verify
# local servers running
QA_AUTH_JOURNEYS=1 E2E_FRONTEND_URL=http://localhost:3000 npm run test:e2e:journeys
npm run test:e2e:ux
cd server && npm test -- src/__tests__/api.*Rbac* src/auth/capabilities.contract.test.ts
```

Update `PRODUCTION_READINESS_REPORT.md` with pass/fail evidence.

---

## Rules (this phase)

- ❌ No new features or V3 analytics
- ❌ No dashboard redesign
- ✅ Stabilize auth, provisioning, E2E, copy drift, guest booking seed only
