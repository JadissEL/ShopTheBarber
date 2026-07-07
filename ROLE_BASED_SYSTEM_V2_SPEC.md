# Role-Based System V2 — Architecture Specification

> **Status:** Draft for review · **Owner:** Platform · **Last updated:** 2026-07-08
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
| **Supplier** | `seller` evolves / splits into `supplier` (B2B wholesale to shops) vs `seller` (B2C marketplace) | Keep `seller` capabilities isolated behind `canListMarketplaceProducts` so a future split only adds a new type + capability flags. |
| **Academy** | New `academy` type: training courses, certifications, student enrollment | Would introduce entities: `course`, `enrollment`, `certificate`, `instructor`. New zone `ACADEMY`. Reuse the same RBAC + dashboard-registry architecture below so it is additive. |

**Extensibility requirement:** The architecture in §4 must make adding a 7th type a matter of (a) adding the type to the enum, (b) adding a capability row, (c) registering a dashboard + nav + onboarding module — **no changes to guard logic**.

---

## 2. Role Capability Matrix

### 2.1 Identity

| Type | Who they are | Purpose on platform | Value received |
|------|--------------|---------------------|----------------|
| **Client** | End customer seeking grooming | Discover barbers, book, pay, review, shop | Convenience, loyalty rewards, trust |
| **Solo Barber** | Independent professional (one chair) | Run calendar, clients, payouts; optional selling/content | Bookings, income, CRM, growth tools |
| **Barber Shop** | Multi-chair business / owner | Manage staff, schedules, shop ops, analytics | Team ops, shop-level revenue & insight |
| **Seller** | Product merchant (no chair) | Sell grooming products on marketplace | Sales channel, orders, payouts |
| **Company** | Industry employer / brand | Recruit talent, employer branding, optional product sales | Hiring pipeline, brand reach |
| **Blogger** | Content creator | Publish articles, grow audience; full client booking | Audience, influence, monetization |

### 2.2 Dashboard identity (summary — full design in §5)

| Type | Dashboard name | Primary KPIs | Key widgets | Primary actions | Empty state |
|------|----------------|--------------|-------------|-----------------|-------------|
| Client | "Your hub" | Next appt, loyalty points, monthly spend | Next appointment, loyalty goal, barber picks, reputation | Book, rebook, explore | "No bookings yet → Find a barber" |
| Solo Barber | "Chair overview" | Today's bookings, revenue, rating, payout status | Schedule, payout progress, trust score, reviews | Add service, set availability, open payouts | "No services yet → Add first service" |
| Barber Shop | "Shop command" | Shop revenue, chair utilization, staff count, bookings | Staff roster, shop analytics, schedule, inventory | Add staff, manage schedule, view analytics | "No staff yet → Invite team" |
| Seller | "Sales overview" | Revenue, orders pending, units sold, low-stock | Sales chart, pending orders, inventory alerts, top products | Add product, fulfill order, restock | "No products → List first product" |
| Company | "Recruitment hub" | Open roles, applicants, interviews, brand views | Job pipeline, applicant funnel, upcoming interviews | Post job, review applicants, edit brand | "No jobs → Post first role" |
| Blogger | "Creator studio" | Views, engagement, drafts, published | Article performance, drafts, audience, next appointment | New draft, publish, view stats | "No articles → Write first post" |

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
| Products | ➖ | 🔁 (opt) | 🔁 (opt) | ✅ | ✅ | ➖ |
| Orders | ➖ | ➖ | ➖ | ✅ | ✅ (opt) | ➖ |
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
| **Products** | R\* | C R U D (opt) | C R U D (opt) | C R U D | C R U D | ➖ | CRUD |
| **Articles** | R\* | C R U D (opt) | C R U D (opt) | C R U D (opt) | ➖ | C R U D | CRUD |
| **Jobs** | R\* + apply | C R U D | C R U D | C R U D | C R U D | ➖ | CRUD |
| **Reviews** | C (as client) | R (received) | R (received) | ➖ | ➖ | C (as client) | CRUD |
| **Expenses** | ➖ | ➖ | C R U D | ➖ | ➖ | ➖ | R |
| **Inventory** | ➖ | ➖ | C R U D | C R U D | ➖ | ➖ | R |
| **Staff** (shop_member) | ➖ | ➖ | C R U D | ➖ | ➖ | ➖ | CRUD |
| **Analytics** | ➖ | R (own) | R (shop) | R (own) | R (own) | R (own) | R (all) |
| **Events** | R + register | R + register | R + register | ➖ | ➖ | R + register | CRUD |
| **Promotions** | R\* (redeem) | C R U D (own) | C R U D (shop) | ➖ | ➖ | ➖ | CRUD |

Notes:
- "(opt)" = capability granted by business model but currently secondary; nav exposure decided per §2.3.
- **Booking-provider tools** (calendar, services, availability, payouts, provider settings) are `solo_barber` + `shop` only → `canAccessBookingProviderTools`.
- **Marketplace listing** → `canListMarketplaceProducts` (seller, solo_barber, shop, company, blogger per current model — see open question OQ-2).
- **Job posting** → `canPostJobs` (company, seller, solo_barber, shop).
- **Article authoring** → `canAuthorArticles` (blogger, solo_barber, shop).

### 3.2 Single permission model (shared FE/BE)

One declarative source defines the matrix; both runtimes consume it:

- **Backend (authority):** `server/src/auth/capabilities.ts` (new) exports `can(accountType, capability, ctx?) → boolean` and `CAPABILITIES` map.
- **Frontend (UX mirror):** `src/lib/capabilities.js` (new) — generated from / kept in lockstep with the backend map (identical keys), used to hide nav/actions.
- A **contract test** asserts the FE and BE capability keys are identical so they cannot drift.

Capability keys (initial): `booking.provider.tools`, `service.write`, `barber.write`, `shop.write`, `staff.manage`, `inventory.manage`, `expenses.manage`, `product.write`, `article.write`, `job.write`, `promotion.write`, `booking.create`, `review.create`, `analytics.view.own`, `analytics.view.shop`.

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

Every generic `POST`/`PATCH`/`DELETE` runs: `requireCapability(map[entity])` → then existing ownership scope. Result: **`client`/`seller`/`company`/`blogger` POST `/api/services` → 403.**

### 4.6 How dashboards are dynamically loaded

- A **dashboard registry** maps `account_type → DashboardComponent`:

```
src/lib/dashboardRegistry.js
  client      → ClientDashboard
  solo_barber → SoloBarberDashboard
  shop        → ShopDashboard
  seller      → SellerDashboard   (real, not generic)
  company     → CompanyDashboard  (real)
  blogger     → BloggerDashboard  (real)
```

- `AccountTypeDashboard` (generic button grid) is **deleted**.
- Each dashboard is a first-class page with its own data hooks, widgets, empty states.

### 4.7 Layered enforcement summary

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

### 5.2 Solo Barber — "Chair overview"
- **Header:** today's date, payout status chip, setup progress (if incomplete).
- **Sections:** Today's schedule · Payout-ready progress · Trust score · Revenue chart (7/30d) · Latest reviews · Service quick-manage.
- **Quick actions:** Add service, Set availability, Open payouts, Message client.
- **Journey:** login → today's bookings → fill gaps / add service → check payouts → respond to reviews.
- **Empty:** "No services yet → Add your first service."

### 5.3 Barber Shop — "Shop command"
- **Header:** shop switcher (if multiple), staff online count.
- **Sections:** Shop revenue & utilization · Staff roster snapshot · Team schedule · Inventory alerts · Shop reviews · Expenses summary.
- **Quick actions:** Invite staff, Manage schedule, Add inventory, View analytics.
- **Journey:** login → shop KPIs → staffing/schedule → inventory → analytics.
- **Empty:** "No staff yet → Invite your team."

### 5.4 Seller — "Sales overview"
- **Header:** store status, add-product CTA.
- **Sections:** Sales chart · Pending orders queue · Inventory/low-stock alerts · Top products · Marketplace recommendations · Payout status.
- **Quick actions:** Add product, Fulfill order, Restock, Edit store.
- **Journey:** login → sales overview → product performance → pending orders → inventory alerts → recommendations.
- **Empty:** "No products yet → List your first product."

### 5.5 Company — "Recruitment hub"
- **Header:** company brand, post-job CTA.
- **Sections:** Open roles · Applicant funnel · Upcoming interviews · Job performance · Brand profile views · (optional) product sales.
- **Quick actions:** Post job, Review applicants, Schedule interview, Edit brand.
- **Journey:** login → open roles → applicant pipeline → interviews → brand.
- **Empty:** "No jobs yet → Post your first role."

### 5.6 Blogger — "Creator studio"
- **Header:** author identity, new-draft CTA.
- **Sections:** Article performance (views/engagement) · Draft queue · Audience growth · Content suggestions · Publishing workflow · Next appointment (client ability).
- **Quick actions:** New draft, Publish, View stats, Book service.
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
3. **Config:** services + pricing, availability, Stripe Connect.
4. **Activation:** payout-ready → publish profile.

### 6.3 Barber Shop
1. **Purpose:** stand up shop operations.
2. **Data:** shop profile, address, hours.
3. **Config:** staff invites, services, schedule, Stripe.
4. **Activation:** shop live + first staff added.

### 6.4 Seller
1. **Purpose:** open a marketplace store.
2. **Data:** business info, store profile, product categories.
3. **Config:** shipping profile, payout/Stripe.
4. **Activation:** list first products → submit for review.

### 6.5 Company
1. **Purpose:** start recruiting / branding.
2. **Data:** company name, logo, description.
3. **Config:** employer brand, (optional) product sales.
4. **Activation:** post first job.

### 6.6 Blogger
1. **Purpose:** launch as a creator.
2. **Data:** author profile, bio, content niche.
3. **Config:** social links, categories.
4. **Activation:** write & submit first article (client booking enabled by default).

---

## 7. Implementation roadmap

> Phased. Each phase ends with tests + a GitHub push. Do not start until this spec is approved.

### PHASE 1 — Security foundation *(Critical)*
- Create shared capability model: `server/src/auth/capabilities.ts` + `src/lib/capabilities.js` + contract test (keys match).
- Add `requireCapability(cap)` pre-handler.
- Add `ENTITY_WRITE_CAPABILITY` map to the generic entity router; gate all `POST`/`PATCH`/`DELETE`.
- Audit dedicated routers to use capability helpers uniformly.
- **Exit:** client/seller/company/blogger cannot create provider entities via any endpoint.

### PHASE 2 — Dashboard redesign *(High)*
- Delete `AccountTypeDashboard`; add `dashboardRegistry`.
- Build real `SellerDashboard`, `CompanyDashboard`, `BloggerDashboard` (and split provider into `SoloBarberDashboard` / `ShopDashboard` if warranted).
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
| Solo Barber | `POST /api/jobs` | **200** |
| Company | `POST /api/jobs` | **200** |
| Company | `POST /api/services` | **403** |
| Blogger | `POST /api/articles` | **200** |
| Blogger | `POST /api/services` | **403** |
| Any non-admin | `POST /api/admin/*` | **403** |

Plus: FE/BE capability contract test; per-role dashboard render tests; per-role onboarding completion tests.

---

## 8. Open questions (resolve before/along Phase 1)

- **OQ-1:** Split `PROVIDER` zone into distinct Solo Barber vs Shop dashboards, or one provider dashboard that adapts? (Spec assumes two dashboards; low cost to keep one adaptive.)
- **OQ-2:** Should **Blogger** and **Solo Barber/Shop** actually sell products? Current backend allows it (`isMarketplaceSellerAccountType`) but UI hides it. Decide: grant nav or revoke capability.
- **OQ-3:** Does **Company** get product selling + orders, or recruitment only? (Matrix marks products as optional.)
- **OQ-4:** Seller payouts — reuse provider wallet or a dedicated seller payout model?
- **OQ-5:** Confirm `seller` stays B2C now; `supplier` (B2B) deferred (§1.3).

---

## 9. Change control

- This document is authoritative. Any implementation PR must reference the section it satisfies.
- Capability changes require an update here **before** code.
- When `Academy`/`Supplier` are approved, add them to §1, §2, §3 and follow the additive path in §4 (no guard rewrites).
