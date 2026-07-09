# E2E authentication architecture

How ShopTheBarber Playwright tests authenticate **without session cross-contamination**.

---

## Problem (R1)

Prior journey specs called `signInClerkUser()` in `beforeEach`, which:

1. Navigated to `/` and called `Clerk.signOut()`
2. Re-filled the Clerk sign-in form on every test
3. Caused **session loss** when serial suites mixed personas or timed out on sign-in

---

## Solution (RS1): one persona → one `storageState`

```
npm run qa:provision          # Clerk + DB + clerk_user_id sync
         ↓
e2e/setup/auth-personas.setup.ts   # project: setup-auth
         ↓
playwright/.auth/{persona}.json    # isolated cookies per role
         ↓
e2e/journeys/*.journey.browser.spec.ts
  test.use({ storageState: authStoragePath('client') })
```

### Persona files

| Persona ID | QA profile | Storage file |
|------------|------------|--------------|
| `client` | `qa-c1` | `playwright/.auth/client.json` |
| `solo-barber` | `qa-b1` | `playwright/.auth/solo-barber.json` |
| `shop-owner` | `qa-o1` | `playwright/.auth/shop-owner.json` |
| `seller` | `qa-seller` | `playwright/.auth/seller.json` |
| `company` | `qa-company` | `playwright/.auth/company.json` |
| `blogger` | `qa-blogger` | `playwright/.auth/blogger.json` |
| `admin` | `qa-admin` | `playwright/.auth/admin.json` |

**Never** share `storageState` between roles in one test file. RBAC specs use nested `test.describe` blocks with per-block `test.use({ storageState })`.

---

## Clerk testing token

`e2e/global-setup.ts` runs `clerkSetup()` once and persists `CLERK_FAPI` + `CLERK_TESTING_TOKEN` to `playwright/.auth/clerk-env.json` for workers.

Persona setup uses `@clerk/testing/playwright` `clerk.signIn({ strategy: 'password' })` — faster and more reliable than UI form automation.

---

## Auth sync gate

`waitForAuthSync()` (in `journey-helpers.ts`) polls until:

1. `Clerk.session` exists
2. `session.getToken()` returns a JWT
3. `GET /api/auth/me` returns `{ id, needsProvision: false }`

Persona setup **fails fast** if `needsProvision: true` — run `npm run qa:provision` and `npm run qa:verify`.

---

## Provision chain (DB)

```
Clerk user (email/password)
    → users.clerk_user_id  (provision script sync)
    → users.account_type   (qaProfiles seed: barber→solo_barber, shop_owner→shop)
    → role-specific profile (seller_profiles, company_accounts, barbers, …)
    → /api/auth/me returns full user
    → RouteGuard + dashboards
```

Validate with: `npm run qa:verify`

---

## Running journeys locally

```bash
# Terminal 1 — API
cd server && npm run dev

# Terminal 2 — frontend (MUST use local API — not production VITE_API_URL from .env.local)
npm run dev:e2e

# Terminal 3 — journeys
npm run qa:provision
npm run qa:verify
npm run test:e2e:journeys
```

**Critical:** `.env.local` may set `VITE_API_URL` to production (Render). Authenticated journeys require the **local** stack. Use `npm run dev:e2e` (forces Vite `/api` proxy → port 3001) or `E2E_FORCE_LOCAL_API=1`.

`npm run test:e2e:journeys` sets `QA_AUTH_JOURNEYS=1` and `E2E_FORCE_LOCAL_API=1` automatically.

`QA_AUTH_JOURNEYS=1` enables:

- `setup-auth` project (creates storage files)
- `clerk-browser` dependency on `setup-auth`
- `skipAuthenticatedJourneys()` returns false

---

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `CLERK_SECRET_KEY` | Yes | `server/.env` |
| `E2E_FRONTEND_URL` | Yes | `http://localhost:3000` |
| `QA_AUTH_JOURNEYS` | For auth journeys | Set to `1` |
| `E2E_CLERK_*_EMAIL` | Optional | Falls back to `scripts/qa-profiles.json` |

---

## Files

| File | Role |
|------|------|
| `e2e/fixtures/personas.ts` | Persona registry + storage paths |
| `e2e/setup/auth-personas.setup.ts` | Creates storageState files |
| `e2e/global-setup.ts` | Clerk testing token |
| `e2e/fixtures/clerk-env.ts` | Persist token for workers |
| `scripts/provision-qa-profiles.mjs` | Clerk + DB + clerk_user_id |
| `server/src/db/verifyQaProfiles.ts` | `npm run qa:verify` |

---

*Release Stabilization RS1 — 2026-07-09*
