# Role-Based System V2 — Architecture Specification

> **Status:** Implemented (Phases 1–5 complete) · Validated 2026-07-08 · **P0 security fixes applied** — staging QA + analytics depth still recommended
> **Authority:** This document is the **single source of truth** for the account system: account types, dashboards, navigation, permissions, onboarding, and the RBAC architecture. Any route, API, page, or action that conflicts with this document is a bug.
> **Related:** `docs/AUTH_ACCOUNT_TYPE_ARCHITECTURE.md`, `docs/ACCESS_RULES_BY_ROLE.md`, `src/lib/accountType.js`, `server/src/auth/accountType.ts`, `server/src/auth/platformRbac.ts`.

---

## 0. Goals & non-goals

**Goal:** Transform ShopTheBarber from a partially role-based app (Client / Provider / Admin distinct; Seller / Company / Blogger sharing a generic shell) into a **scalable multi-role marketplace** where every account type has its own ecosystem: dashboard, onboarding, navigation, permissions, and workflows — enforced by the backend as the ultimate authority.

**Non-goals (V2):**
- No new account types are implemented now. `Academy` and `Supplier` are documented as **future** expansion points only (see §1.3).
- No redesign of the marketing site, booking engine internals, or payment rails beyond RBAC enforcement.

**Design principle:** *The backend is always the ultimate authority.* The frontend enforces UX (hiding controls, routing); the backend enforces truth (every mutation is validated against the permission model). A hidden button is not security.

---

## 1. Account model

### 1.1 Confirmed account types (V2)

Canonical, immutable per email. Chosen **before** Clerk auth on `/chooseaccounttype`.

| # | `account_type` | Display name | `users.role` (derived) | App zone |
|---|----------------|--------------|------------------------|----------|
| 1 | `client` | Client | `client` | CLIENT |
| 2 | `solo_barber` | Solo Barber | `barber` | PROVIDER |
| 3 | `shop` | Barber Shop | `shop_owner` | PROVIDER |
| 4 | `seller` | Seller | `seller` | SELLER |
| 5 | `company` | Company | `company` | COMPANY |
| 6 | `blogger` | Blogger | `blogger` | BLOGGER |

> Platform operators use `role = 'admin'` (ADMIN zone). Admin is not a signup account type; it is provisioned out of band.

Canonical definitions already exist and **must not diverge**:
- Frontend: `src/lib/accountType.js` → `ACCOUNT_TYPES`
- Backend: `server/src/auth/accountType.ts` → `ACCOUNT_TYPES`, `platformRoleForAccountType`

### 1.2 Immutability rule

One email = one `account_type`, locked at provision time (`account_type_locked_at`). Re-provisioning with a different type returns **`409 ACCOUNT_TYPE_CONFLICT`**.

### 1.3 Future expansion points (documented, NOT implemented)

| Future type | Likely evolution | Notes |
|-------------|------------------|-------|
| **Supplier** | `seller` stays **B2C** for now; future `supplier` type handles **B2B wholesale** — tracking sales to business buyers on the platform (companies, solo barbers, barber shops) | Keep `seller` capabilities isolated behind `canListMarketplaceProducts` so a future split only adds a new type + capability flags. Supplier dashboards would include B2B order tracking, buyer accounts, and wholesale catalog — distinct from consumer marketplace. |
| **Academy** | New `academy` type: training courses, certifications, student enrollment | Would introduce entities: `course`, `enrollment`, `certificate`, `instructor`. New zone `ACADEMY`. Reuse the same RBAC + dashboard-registry architecture below so it is additive. |

**Extensibility requirement:** The architecture in §4 must make adding a 7th type a matter of (a) adding the type to the enum, (b) adding a capability row, (c) registering a dashboard + nav + onboarding module — **no changes to guard logic**.

---

## 2. Role Capability Matrix

### 2.1 Identity

| Type | Who they are | Purpose on platform | Value received |
|------|--------------|---------------------|----------------|
| **Client** | End customer seeking grooming | Discover barbers, book, pay, review, shop | Convenience, loyalty rewards, trust |
| **Solo Barber** | Independent professional (one chair) | Run calendar, clients, payouts; sell products on marketplace | Bookings, income, CRM, product sales |
| **Barber Shop** | Multi-chair business / owner | Manage staff, schedules, shop ops, analytics; sell products | Team ops, shop-level revenue, retail |
| **Seller** | Product merchant (no chair) | Sell grooming products on marketplace (B2C) | Sales channel, orders, payouts |
| **Company** | Industry employer / brand | Recruit talent, employer branding, sell products, manage orders, company analytics | Hiring pipeline, brand reach, commerce (on request) |
| **Blogger** | Content creator | Publish articles, grow audience, sell products; full client booking | Audience, influence, monetization |

### 2.2 Dashboard identity (summary — full design in §5)

| Type | Dashboard name | Primary KPIs | Key widgets | Primary actions | Empty state |
|------|----------------|--------------|-------------|-----------------|-------------|
| Client | "Your hub" | Next appt, loyalty points, monthly spend | Next appointment, loyalty goal, barber picks, reputation | Book, rebook, explore | "No bookings yet → Find a barber" |
| Provider (solo + shop) | "Provider command" *(adaptive)* | Today's bookings, revenue, rating, payout status; shop adds utilization & staff | Schedule, payout progress, trust score, reviews; shop adds staff roster & expenses | Add service, set availability, manage products, open payouts | Solo: "No services yet → Add first service" · Shop: "No staff yet → Invite team" |
| Seller | "Sales overview" | Revenue, orders pending, units sold, low-stock | Sales chart, pending orders, inventory alerts, top products | Add product, fulfill order, restock | "No products → List first product" |
| Company | "Company hub" | Open roles, applicants, product revenue, order volume, brand views | Job pipeline, applicant funnel, product sales, orders queue, company analytics | Post job, review applicants, list product, view analytics | "No jobs yet → Post first role" |
| Blogger | "Creator studio" | Views, engagement, product sales, drafts, published | Article performance, product performance, drafts, audience, next appointment | New draft, publish, add product, view stats | "No articles yet → Write your first post" |

### 2.3 Navigation matrix (target)

Legend: ✅ owned page · 🔁 shared common page (intentional) · ➖ not shown.

| Nav item | Client | Solo Barber | Shop | Seller | Company | Blogger |
|----------|:------:|:-----------:|:----:|:------:|:-------:|:-------:|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Find barbers / Explore | ✅ | ➖ | ➖ | ➖ | ➖ | ✅ |
| Appointments / Bookings | ✅ | ✅ (Calendar) | ✅ (Calendar) | ➖ | ➖ | ✅ (as client) |
| Favorites | ✅ | ➖ | ➖ | ➖ | ➖ | 🔁 |
| Loyalty | ✅ | ➖ | ➖ | ➖ | ➖ | 🔁 |
| Services | ➖ | ✅ | ✅ | ➖ | ➖ | ➖ |
| Clients (CRM) | ➖ | ✅ | ✅ | ➖ | ➖ | ➖ |
| Staff | ➖ | ➖ | ✅ | ➖ | ➖ | ➖ |
| Schedule / Roster | ➖ | ✅ | ✅ | ➖ | ➖ | ➖ |
| Reviews | ➖ | ✅ | ✅ | ➖ | ➖ | ➖ |
| Products | ➖ | ✅ | ✅ | ✅ | ✅ *(on request)* | ✅ |
| Orders | ➖ | ✅ | ✅ | ✅ | ✅ *(on request)* | ✅ |
| Inventory | ➖ | ➖ | ✅ | ✅ | ➖ | ➖ |
| Jobs | ➖ | 🔁 | 🔁 | 🔁 | ✅ | ➖ |
| Applicants | ➖ | 🔁 | 🔁 | 🔁 | ✅ | ➖ |
| Articles / Content | ➖ | 🔁 (opt) | 🔁 (opt) | 🔁 (opt) | ➖ | ✅ |
| Analytics | ➖ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Messages | 🔁 | ✅ (Provider) | ✅ (Provider) | 🔁 | 🔁 | 🔁 |
| Payouts / Wallet | ➖ | ✅ | ✅ | ✅ | ➖ | ➖ |
| Settings | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

> **Rule:** No two zones may render an identical nav array. Shared pages are allowed only where the responsibility is genuinely common (Messages, Settings, Jobs board).

---

## 3. Permissions Matrix

### 3.1 Canonical capability set

Permissions are expressed as **capabilities** (verbs on entities), derived from `account_type`. Capabilities are the contract shared by frontend and backend (§4).

CRUD legend: **C**reate · **R**ead (own/scope) · **U**pdate (own) · **D**elete (own) · ➖ none · **R\*** = public read.

| Entity | Client | Solo Barber | Shop | Seller | Company | Blogger | Admin |
|--------|:------:|:-----------:|:----:|:------:|:-------:|:-------:|:-----:|
| **Barber** (own profile) | ➖ | C R U | C R U | ➖ | ➖ | ➖ | CRUD |
| **Shop** | ➖ | R (member) | C R U | ➖ | ➖ | ➖ | CRUD |
| **Service** | R\* | C R U D | C R U D | ➖ | ➖ | ➖ | CRUD |
| **Appointment/Booking** | C R U(cancel) | R U (manage) | R U (manage) | ➖ | ➖ | C R U(cancel) | CRUD |
| **Client profile** (own) | R U | R U | R U | R U | R U | R U | CRUD |
| **Products** | R\* | C R U D | C R U D | C R U D | C R U D *(on request)* | C R U D | CRUD |
| **Articles** | R\* | C R U D (opt) | C R U D (opt) | C R U D (opt) | ➖ | C R U D | CRUD |
| **Jobs** | R\* + apply | C R U D | C R U D | C R U D | C R U D | ➖ | CRUD |
| **Reviews** | C (as client) | R (received) | R (received) | ➖ | ➖ | C (as client) | CRUD |
| **Expenses** | ➖ | ➖ | C R U D | ➖ | ➖ | ➖ | R |
| **Inventory** | ➖ | ➖ | C R U D | C R U D | ➖ | ➖ | R |
| **Staff** (shop_member) | ➖ | ➖ | C R U D | ➖ | ➖ | ➖ | CRUD |
| **Analytics** | ➖ | R (own) | R (shop) | R (own) | R (company suite) *(on request)* | R (own) | R (all) |
| **Events** | R + register | R + register | R + register | ➖ | ➖ | R + register | CRUD |
| **Promotions** | R\* (redeem) | C R U D (own) | C R U D (shop) | ➖ | ➖ | ➖ | CRUD |

Notes:
- **Booking-provider tools** (calendar, services, availability, provider settings) are `solo_barber` + `shop` only → `canAccessBookingProviderTools`.
- **Marketplace listing** → `canListMarketplaceProducts` (**seller, solo_barber, shop, blogger** always; **company** via on-request activation — see §8).
- **Job posting** → `canPostJobs` (company, seller, solo_barber, shop).
- **Article authoring** → `canAuthorArticles` (blogger, solo_barber, shop).
- **Company commerce & analytics** (products, orders, company-specific analytics) are **on-request features**: capability-gated, company-owned pages — not reused Seller/Provider dashboards and not enabled for other account types.

### 3.2 Single permission model (shared FE/BE)

One declarative source defines the matrix; both runtimes consume it:

- **Backend (authority):** `server/src/auth/capabilities.ts` (new) exports `can(accountType, capability, ctx?) → boolean` and `CAPABILITIES` map.
- **Frontend (UX mirror):** `src/lib/capabilities.js` (new) — generated from / kept in lockstep with the backend map (identical keys), used to hide nav/actions.
- A **contract test** asserts the FE and BE capability keys are identical so they cannot drift.

Capability keys (initial): `booking.provider.tools`, `service.write`, `barber.write`, `shop.write`, `staff.manage`, `inventory.manage`, `expenses.manage`, `product.write`, `order.manage`, `article.write`, `job.write`, `promotion.write`, `booking.create`, `review.create`, `analytics.view.own`, `analytics.view.shop`, `analytics.view.company`, `payment.provider_wallet`, `payment.stripe_connect`, `company.commerce` *(on request)*.

---

## 4. Architecture

### 4.1 Where roles are stored

- `users.account_type` (immutable) + `users.role` (derived) in Postgres (Neon/Prisma).
- Clerk holds identity only; `account_type` is authoritative in our DB.
- Request context: `authenticateRequest` attaches `{ id, email, role, account_type }` to `request.user`.

### 4.2 How permissions are checked (backend — the authority)

```
Request → authenticateRequest (identity)
        → resolve { role, account_type }
        → capability check: can(account_type, 'service.write')
        → ownership/scope check: getEntityScopeCondition / rowInScope
        → mutation
```

- **All mutations** pass a capability pre-handler + an ownership check.
- Capability pre-handlers: `requireCapability('service.write')` (new, built on the shared map), plus existing `requireAccountTypes(...)`, `requireBookingProviderPreHandler`, `requireAdminPreHandler`.

### 4.3 How frontend routes are protected

- `resolveZoneFromPath(path, { isAuthenticated, role, accountType })` → zone (already implemented).
- `RouteGuard` redirects: unauthenticated → SignIn; wrong-zone → role's home dashboard; capability-gated routes → home dashboard.
- Frontend guards are **UX only**; identical rules are enforced server-side.

### 4.4 How backend APIs are protected

- **Dedicated routers** (marketplace, jobs, articles, provider wallet, etc.) already call capability helpers — extend to all.
- **Generic entity router** (`server/src/index.ts`) is the current gap: `AUTH_WRITE_ENTITIES` allows any authenticated user to `POST/PATCH/DELETE` provider entities. V2 adds a **per-entity capability map** so generic writes are gated by `account_type`, not just auth (see §7 Phase 1).

### 4.5 How entity creation is validated (closing the critical gap)

New `ENTITY_WRITE_CAPABILITY` map in the generic router:

```
service      → 'service.write'      (solo_barber, shop, admin)
barber       → 'barber.write'       (solo_barber, shop, admin)
shop         → 'shop.write'         (shop, admin)
shift/time_block → 'booking.provider.tools'
shop_member  → 'staff.manage'       (shop, admin)
shop_inventory_item → 'inventory.manage'
shop_expense → 'expenses.manage'
barber_video → 'booking.provider.tools'
inspiration_post → 'article.write' or provider tools
```

Every generic `POST`/`PATCH`/`DELETE` runs: `requireCapability(map[entity])` → then existing ownership scope. Result: **`client` POST `/api/services` → 403**; **`seller`/`company`/`blogger` POST `/api/services` → 403**; **`solo_barber`/`shop`/`blogger`/`seller` POST `/api/products` → 200** (company when `company.commerce` is active).

### 4.6 Payment architecture (dual rails for booking providers)

Booking providers (`solo_barber`, `shop`) support **both** payment options — not either/or:

| Rail | Purpose | When used |
|------|---------|-----------|
| **Provider wallet** | In-shop / cash payments at the chair | Client pays at the shop; provider confirms cash booking via wallet flow |
| **Stripe Connect** | Card payments at booking time | Client pays by card when booking online |

- Provider wallet and Stripe Connect are **complementary**: wallet handles on-site cash; Connect handles card capture during booking.
- **Sellers** (and marketplace sellers among providers/bloggers) use **Stripe Connect** for marketplace payouts — separate from the provider cash wallet, which is booking-specific.
- Capability gates: `payment.provider_wallet` (booking providers), `payment.stripe_connect` (booking providers + marketplace sellers).

### 4.7 How dashboards are dynamically loaded

- A **dashboard registry** maps `account_type → DashboardComponent`:

```
src/lib/dashboardRegistry.js
  client      → ClientDashboard
  solo_barber → ProviderDashboard   (adaptive — same component)
  shop        → ProviderDashboard   (adaptive — same component)
  seller      → SellerDashboard     (real, not generic)
  company     → CompanyDashboard    (real, not generic)
  blogger     → BloggerDashboard    (real, not generic)
```

- **`ProviderDashboard`** is one adaptive dashboard: solo barber surfaces chair/schedule widgets; shop surfaces staff/roster/expense widgets. Same route zone (`PROVIDER`), different sections rendered by `account_type`.
- `AccountTypeDashboard` (generic button grid) is **deleted**.
- Each dashboard is a first-class page with its own data hooks, widgets, empty states.

### 4.8 Layered enforcement summary

| Layer | Mechanism | Authority |
|-------|-----------|-----------|
| Navigation | capability-filtered nav arrays | UX |
| Route | `RouteGuard` + zone | UX |
| API pre-handler | `requireCapability` / `requireAccountTypes` | **Enforced** |
| Ownership | `getEntityScopeCondition` / `rowInScope` | **Enforced** |
| DB | Prisma constraints | **Enforced** |

---

## 5. Dashboard experiences (unique per role)

> Each is a distinct product surface. None reuse the generic grid.

### 5.1 Client — "Your hub"
- **Header:** greeting, search, notifications, next-appointment banner.
- **Sections:** Next appointment card · Loyalty goal · Monthly spending · Personalized barber picks · Reputation · Recent messages.
- **Quick actions:** Book, Rebook last, Explore, Redeem loyalty.
- **Journey:** login → see next appointment → rebook or discover → loyalty progress.
- **Empty:** "No bookings yet → Find a barber."

### 5.2 Provider — "Provider command" *(adaptive: solo barber + barber shop)*

One dashboard component; sections shown/hidden by `account_type`.

**Shared (solo + shop):**
- **Header:** today's date, payout status (Stripe Connect + wallet), setup progress if incomplete.
- **Sections:** Today's schedule · Revenue chart (7/30d) · Trust score · Latest reviews · Product sales snapshot · Payout-ready progress.
- **Quick actions:** Add service, Set availability, Manage products, Open payouts/wallet, Message client.

**Solo barber adds:** Service quick-manage · Chair utilization.
- **Journey:** login → today's bookings → fill gaps / add service → product sales → check payouts → respond to reviews.
- **Empty:** "No services yet → Add your first service."

**Barber shop adds:** Shop switcher · Staff roster snapshot · Team schedule · Inventory alerts · Expenses summary.
- **Quick actions (shop):** Invite staff, Manage schedule, Add inventory, View shop analytics.
- **Journey:** login → shop KPIs → staffing/schedule → inventory → product sales → analytics.
- **Empty:** "No staff yet → Invite your team."

### 5.3 Seller — "Sales overview"
- **Header:** store status, add-product CTA.
- **Sections:** Sales chart · Pending orders queue · Inventory/low-stock alerts · Top products · Marketplace recommendations · Payout status.
- **Quick actions:** Add product, Fulfill order, Restock, Edit store.
- **Journey:** login → sales overview → product performance → pending orders → inventory alerts → recommendations.
- **Empty:** "No products yet → List your first product."

### 5.4 Company — "Company hub"
- **Header:** company brand, post-job CTA, commerce status (if activated).
- **Sections:** Open roles · Applicant funnel · Upcoming interviews · Job performance · Brand profile views · Product sales & orders *(on request)* · Company analytics *(on request)*.
- **Quick actions:** Post job, Review applicants, Schedule interview, Edit brand, List product *(when commerce active)*, View company analytics.
- **Journey:** login → recruitment pipeline → (when enabled) product performance → orders → company analytics.
- **Empty:** "No jobs yet → Post your first role."
- **Note:** Commerce and company analytics modules are **company-owned** — not Seller dashboard reuse. Enabled via on-request activation (`company.commerce`).

### 5.5 Blogger — "Creator studio"
- **Header:** author identity, new-draft CTA.
- **Sections:** Article performance (views/engagement) · Product performance · Draft queue · Audience growth · Content suggestions · Publishing workflow · Next appointment (client ability).
- **Quick actions:** New draft, Publish, Add product, View stats, Book service.
- **Journey:** login → article performance → drafts → engagement → suggestions → publish.
- **Empty:** "No articles yet → Write your first post."

---

## 6. Onboarding experiences (per role)

Each role gets a dedicated 4-stage flow (Purpose → Data collected → Configuration → Activation), rendered by role-specific embed forms (not link checklists). Fix current defects: (a) no data collection for seller/company/blogger, (b) `roleLabel` shows "Client" for all non-provider/admin.

### 6.1 Client
1. **Purpose:** personalize discovery & booking.
2. **Data:** full name, phone, city, grooming preferences.
3. **Config:** notification prefs, favorite categories.
4. **Activation:** prompt first booking / explore.

### 6.2 Solo Barber
1. **Purpose:** get chair booking-ready.
2. **Data:** professional profile, location, specialties.
3. **Config:** services + pricing, availability, Stripe Connect (card at booking), provider wallet (in-shop cash).
4. **Activation:** payout-ready → publish profile; optional first marketplace product.

### 6.3 Barber Shop
1. **Purpose:** stand up shop operations.
2. **Data:** shop profile, address, hours.
3. **Config:** staff invites, services, schedule, Stripe Connect + provider wallet, optional product catalog.
4. **Activation:** shop live + first staff added.

### 6.4 Seller
1. **Purpose:** open a marketplace store.
2. **Data:** business info, store profile, product categories.
3. **Config:** shipping profile, payout/Stripe.
4. **Activation:** list first products → submit for review.

### 6.5 Company
1. **Purpose:** start recruiting / branding; commerce & analytics available on request.
2. **Data:** company name, logo, description, industry.
3. **Config:** employer brand; request commerce activation (products, orders, company analytics) when needed.
4. **Activation:** post first job; commerce modules unlock after on-request approval.

### 6.6 Blogger
1. **Purpose:** launch as a creator and optional product seller.
2. **Data:** author profile, bio, content niche.
3. **Config:** social links, categories, Stripe Connect for product payouts.
4. **Activation:** write & submit first article; optional first product listing (client booking enabled by default).

---

## 7. Implementation roadmap

> Phased. Each phase ends with tests + a GitHub push. **Decisions locked in §8 — implementation may begin with Phase 1.**

### PHASE 1 — Security foundation *(Critical)*
- Create shared capability model: `server/src/auth/capabilities.ts` + `src/lib/capabilities.js` + contract test (keys match).
- Add `requireCapability(cap)` pre-handler.
- Add `ENTITY_WRITE_CAPABILITY` map to the generic entity router; gate all `POST`/`PATCH`/`DELETE`.
- Audit dedicated routers to use capability helpers uniformly.
- **Exit:** client/seller/company/blogger cannot create provider entities via any endpoint.

### PHASE 2 — Dashboard redesign *(High)*
- Delete `AccountTypeDashboard`; add `dashboardRegistry`.
- Build real `SellerDashboard`, `CompanyDashboard`, `BloggerDashboard`, and one adaptive `ProviderDashboard` (solo barber + shop).
- Wire data hooks + empty states per §5.

### PHASE 3 — Onboarding redesign *(High)*
- Role-specific embed forms (seller/company/blogger) collecting §6 data.
- Fix `roleLabel`; use `getSetupGuideSubtitle` everywhere.

### PHASE 4 — Navigation cleanup *(High/Medium)*
- Fix Seller "Settings" → owned settings (not `ProviderSettings`).
- Introduce role-owned pages; retire incorrect shared provider pages.
- Capability-filter every nav array.

### PHASE 5 — Testing *(Required each phase)*
Representative scenarios (must all pass):

| Actor | Action | Expected |
|-------|--------|----------|
| Client | `POST /api/services` | **403** |
| Client | `POST /api/barbers` | **403** |
| Seller | open `/ProviderSettings` | redirect to Seller home |
| Seller | `GET /api/provider-wallet/me` | **403** (unless seller wallet defined) |
| Seller | `POST /api/products` | **200** |
| Solo Barber | `POST /api/services` | **200** |
| Solo Barber | `POST /api/products` | **200** |
| Solo Barber | `POST /api/jobs` | **200** |
| Shop | `POST /api/products` | **200** |
| Company | `POST /api/jobs` | **200** |
| Company | `POST /api/products` (commerce active) | **200** |
| Company | `POST /api/products` (commerce inactive) | **403** |
| Company | `POST /api/services` | **403** |
| Blogger | `POST /api/articles` | **200** |
| Blogger | `POST /api/products` | **200** |
| Blogger | `POST /api/services` | **403** |
| Solo Barber | pay booking by card (Stripe Connect) | **200** |
| Solo Barber | confirm cash booking (provider wallet) | **200** |
| Any non-admin | `POST /api/admin/*` | **403** |

Plus: FE/BE capability contract test; per-role dashboard render tests; per-role onboarding completion tests.

---

## 8. Resolved decisions (locked 2026-07-08)

| ID | Question | Decision |
|----|----------|----------|
| **OQ-1** | Provider dashboards: split vs adaptive? | **One adaptive `ProviderDashboard`** for both `solo_barber` and `shop`. Same component; sections adapt by `account_type`. |
| **OQ-2** | Can Blogger and Solo Barber/Shop sell products? | **Yes.** Grant `product.write` + nav for solo barber, shop, and blogger. UI must expose marketplace product management (currently hidden). |
| **OQ-3** | Company scope? | **Full company suite:** recruitment + product selling + orders + company-specific analytics. These are **on-request activations** (`company.commerce`), company-owned pages — **not** reused Seller/Provider implementations and **not** enabled for other account types. |
| **OQ-4** | Payment / payout model? | **Dual rails for booking providers:** (1) **Provider wallet** — in-shop/cash payments at the chair; (2) **Stripe Connect** — card payments at booking time. Both coexist. Marketplace sellers (seller, and providers/bloggers selling products) use **Stripe Connect** for product payouts — separate from the cash provider wallet. |
| **OQ-5** | Seller vs Supplier? | **Confirmed:** `seller` remains **B2C** now. Future `supplier` type handles **B2B wholesale**, tracking sales to business buyers (companies, solo barbers, barber shops). Not implemented in V2. |

---

## 9. Change control

- This document is authoritative. Any implementation PR must reference the section it satisfies.
- Capability changes require an update here **before** code.
- When `Academy`/`Supplier` are approved, add them to §1, §2, §3 and follow the additive path in §4 (no guard rewrites).

---

## 10. Post-implementation record (2026-07-08)

> **Validation:** See `ROLE_BASED_SYSTEM_V2_VALIDATION_REPORT.md` for the full quality audit, security findings, and production gate checklist. **V2 phases are complete; production launch requires remediation of critical generic-router issues documented there.**

### 10.1 Final architecture (as built)

```
Signup (/chooseaccounttype)
    → signup_intents (token) → Clerk auth → provisionUser
        → users.account_type (locked) + users.role (derived)
        → Typed profiles: seller_profiles | company_accounts+companies | author_profiles | barber/shop workspace

Request path:
    Clerk/JWT → authenticateRequest → request.user { id, role, account_type }
        → requireCapability(cap) on dedicated routes
        → denyGenericEntityWriteUnlessCapable on AUTH_WRITE_ENTITIES (generic router)
        → rowInScope on read/update/delete (entityScope.ts)

Frontend path:
    useEffectiveRole / useCapabilityContext → capabilities.js (UX only)
        → dashboardRegistry → role dashboard
        → accountTypeNav + navCapabilities → filtered nav
        → RouteGuard → zone redirects (non-authoritative)
```

**Key files**

| Concern | Backend | Frontend |
|---------|---------|----------|
| Account types | `server/src/auth/accountType.ts` | `src/lib/accountType.js` |
| Capabilities | `server/src/auth/capabilities.ts` | `src/lib/capabilities.js` |
| Entity writes | `server/src/auth/entityWriteCapabilities.ts` | — |
| Pre-handlers | `server/src/auth/authPreHandlers.ts` | — |
| Dashboards | — | `src/lib/dashboardRegistry.js`, `src/pages/*Dashboard.jsx` |
| Navigation | — | `src/lib/accountTypeNav.js`, `src/lib/navCapabilities.js` |
| Onboarding | `server/src/onboarding/*` | `src/lib/onboardingWizard.js`, embed components |
| Route guard | — | `src/components/routing/RouteGuard.jsx` |

### 10.2 Implementation status

| Phase | Status | Commit (approx) |
|-------|--------|-----------------|
| 1 Security/RBAC | ✅ Shipped | `bc42b4c` |
| 2 Dashboards | ✅ Shipped | `418c848` |
| 3 Onboarding | ✅ Shipped | `835dacd` |
| 4 Navigation | ✅ Shipped | `2b0f2f8` |
| 5 Testing | ✅ Shipped | `01435de` |
| Playwright role journeys | ✅ Shipped | `85d441c` |

### 10.3 Known limitations (accepted or pending)

1. **Generic entity router is fail-open** — entities in `ENTITY_TABLE` but absent from guard sets may allow unauthenticated or unscoped writes (see validation report V1–V4). **Must fix before production.**
2. **FE/BE capability grants are hand-duplicated** — contract test verifies key names only, not grant logic.
3. **Legacy dual identity** — `users.role` and `users.account_type` both active; `provider` role is orphaned.
4. **Company commerce** — gated by `COMPANY_COMMERCE_USER_IDS` env allowlist; DB/admin activation UI not built.
5. **Seller/Company/Blogger dashboards** — snapshot KPIs only; spec §2 charts/analytics partially deferred.
6. **Company/Blogger settings** — use generic `AccountSettings`, not role-owned settings pages.
7. **Adding a 7th account type** — still requires coordinated edits in 9+ files (§1.3 aspirational goal not fully met).

### 10.4 Future expansion points

| Type | When | Approach |
|------|------|----------|
| **Supplier** (B2B) | Post-V3 | New `account_type`, wholesale order entities, separate dashboard; extend `CAPABILITY_GRANTS` |
| **Academy** | When approved | New zone, `course`/`enrollment` entities, dedicated routes with capabilities |

**Do not** bolt new types onto seller/provider dashboards. Follow: enum → capabilities → provision profile → dashboardRegistry → nav → onboarding module.

### 10.5 How to add a new role correctly

1. **Spec first** — add row to §1.1, capability matrix §2, nav §2.3, onboarding §6.
2. **Backend enum** — `ACCOUNT_TYPES`, `platformRoleForAccountType`, `inferAccountTypeFromLegacyRole` in `accountType.ts`.
3. **Capabilities** — add grants in `capabilities.ts` **and** mirror in `capabilities.js`; extend table-driven contract test (recommended).
4. **Provision** — `createTypedProfiles` in `provisionUser.ts` + Prisma profile table if needed.
5. **Dashboard** — page + data hook + entry in `dashboardRegistry.js`.
6. **Navigation** — `accountTypeNav.js` array + `navCapabilities.js` if capability-gated.
7. **Onboarding** — steps in `onboardingWizard.js` + embed component + API routes if profile fields needed.
8. **Route guard** — APP zone in `navigationConfig` + redirects in `RouteGuard.jsx`.
9. **Entity writes** — map any new entities in `ENTITY_WRITE_CAPABILITY`; **never** add writable entities to `ENTITY_TABLE` without auth + capability mapping.
10. **Tests** — spec §7-style integration tests + Playwright journey + grant parity test.

### 10.6 Production gate (from validation audit)

Before claiming production-ready RBAC:

- [x] Remediate generic-router vulnerabilities V1–V4 (validation report §12, 2026-07-08)
- [x] Default-deny write policy for unmapped generic CREATE (`isGenericCreateAllowed`)
- [x] Fix client dashboard Featured Studios crash (`MapPin` import)
- [ ] Full FE/BE capability grant parity tests (baseline matrix added; auto-sync TBD)
- [ ] DB-backed company commerce activation
- [ ] Run `npm run qa:provision` + `npm run test:e2e:journeys` on staging

