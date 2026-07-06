# Auth & Account Type Architecture

**Purpose**: How signup, provisioning, and role-based dashboards work after the Phase 2 account-type refactor.

**Last updated**: 2026-07-06  
**Related**: [ACCESS_RULES_BY_ROLE.md](./ACCESS_RULES_BY_ROLE.md), [CLERK_SETUP.md](./CLERK_SETUP.md)

---

## 1. Principles

1. **Account type is chosen before Clerk auth** on `/chooseaccounttype`.
2. **One email = one immutable `users.account_type`** — re-provisioning with a different type returns `409 ACCOUNT_TYPE_CONFLICT`.
3. **Clerk identity alone does not create a DB user** — `POST /api/auth/provision` runs after signup.
4. **`users.role` is derived from `account_type`** at provision time (see mapping below).

---

## 2. Signup flow

```
/chooseaccounttype
  → POST /api/auth/signup-intent (30-min token, sessionStorage)
  → /register (blocked without pending type)
  → Clerk signup
  → GET /api/auth/me → { needsProvision: true }
  → AccountProvisioner → POST /api/auth/provision
  → /SetupGuide (first-time onboarding)
  → role dashboard
```

**Session keys** (frontend `signupIntent.js`): pending account type + signup-intent token. Cleared after successful provision or conflict.

---

## 3. Account types

| `account_type` | `users.role` | Dashboard | App shell zone |
|----------------|--------------|-----------|----------------|
| `client` | `client` | `/Dashboard` | CLIENT |
| `solo_barber` | `barber` | `/ProviderDashboard` | PROVIDER |
| `shop` | `shop_owner` | `/ProviderDashboard` | PROVIDER |
| `seller` | `seller` | `/SellerDashboard` | SELLER |
| `company` | `company` | `/CompanyDashboard` | COMPANY |
| `blogger` | `blogger` | `/BloggerDashboard` | BLOGGER |
| (platform) | `admin` | `/GlobalFinancials` | ADMIN |

Canonical definitions: `server/src/auth/accountType.ts`, `src/lib/accountType.js`.

---

## 4. Key API routes

| Route | Auth | Behavior |
|-------|------|----------|
| `POST /api/auth/signup-intent` | Public | Validates account type; returns short-lived intent token |
| `POST /api/auth/provision` | Clerk JWT | Creates user + role-specific rows; requires intent token on first provision |
| `GET /api/auth/me` | Clerk JWT | Returns user or `{ needsProvision: true }` — does **not** auto-create users |

---

## 5. RBAC helpers (server)

- `platformRbac.ts` — `canAccessBookingProviderTools`, `canListMarketplaceProducts`, etc.
- `authPreHandlers.ts` — `requireBookingProviderPreHandler`, `requireAccountTypes(...)`
- Booking provider tools: `solo_barber`, `shop` only (`isBookingProviderAccountType`).
- Marketplace listing: seller, solo_barber, shop, company, blogger (`isMarketplaceSellerAccountType`).

---

## 6. Frontend routing

- `RouteGuard.jsx` — zone checks via `appZone.js` + `account_type`.
- `OnboardingRedirect.jsx` — one-time redirect from dashboard entry paths to `/SetupGuide` when onboarding incomplete.
- `AccountProvisioner.jsx` — runs globally; provisions then sends new users to SetupGuide.

---

## 7. Onboarding

Role-specific steps live in `src/lib/onboardingWizard.js` (`getOnboardingSteps`, `computeStepCompletion`). Seller, company, and blogger flows use profile completion plus visited-step tracking for guide-only steps.

---

## 8. Migration

`server/prisma/migrations/20260706120000_account_type_architecture/` adds `users.account_type` and backfills from legacy `role`.

Production: Render build runs `prisma migrate deploy` via `server/scripts/build-database.mjs`.

---

## 9. Conflict handling

If a Clerk user already exists with a locked `account_type` and provision is attempted with another type:

- API: `409` + `ACCOUNT_TYPE_CONFLICT`
- UI: redirect to `/login?error=account_type_conflict` with toast

---

## 10. Out of scope (separate features)

- Shop staff invites (existing members ≠ signup account types)
- Exhaustive `requireAccountTypes` on every legacy provider-only route (ongoing hardening)
