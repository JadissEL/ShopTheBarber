# ShopTheBarber — Access Rules by Role (Normative)

**Purpose**: Single source of truth for who can access what. All new features **MUST** comply with these rules. No frontend route, API endpoint, or user action may grant access that violates this document.

**Last updated**: 2026-02-07  
**Related**: [ACCESS_CONTROL_AUDIT.md](./ACCESS_CONTROL_AUDIT.md) (implementation details), [ARCHITECTURE_FULL_STACK_UNIFIED.md](./ARCHITECTURE_FULL_STACK_UNIFIED.md)

---

## 1. Roles (Canonical)

| Role | Value in JWT / DB | Description |
|------|-------------------|-------------|
| **Unauthenticated** | (no user) | Not logged in. |
| **Client** | `client` | Logged-in customer: book appointments, shop, apply to jobs, use loyalty, messages, account. |
| **Barber** | `barber` | Logged-in provider: own bookings, payouts, messages; can be employer (post jobs, review applicants). |
| **Shop owner** | `shop_owner` | Logged-in shop owner: provider features + shop management; employer. |
| **Admin** | `admin` | Platform admin: financials, moderation, backups; bypasses ownership scope on entity APIs. |

**Rule**: `role` is always `user?.role ?? 'client'`. There are no other role values for access control.

---

## 2. Frontend: Zones and Who May Access

### 2.1 Zone Definitions (from `navigationConfig.jsx`)

- **PUBLIC**: No auth required to **view**. Actions (book, add to cart, apply) may require auth and must use SignIn with `?return=`.
- **AUTH**: SignIn / SignUp. No guard; redirect after login per `return` / `next`.
- **CLIENT**: Auth required. Unauthenticated → redirect to SignIn with `return`.
- **PROVIDER**: Auth + role in `['provider','barber','shop_owner','admin']`. Else → Dashboard (or SignIn if no user).
- **ADMIN**: Auth + `role === 'admin'`. Else → Home (or SignIn if no user).
- **Employer-only (subset of routes)**: Auth + barber/shop_owner/admin. Clients → CareerHub.

### 2.2 Per-Role: Allowed Frontend Access

| Role | May access (zones/pages) | Forbidden |
|------|--------------------------|-----------|
| **Unauthenticated** | PUBLIC only: Home, Explore, Marketplace, CareerHub, About, HelpCenter, SelectProviderType, RegisterShop, ServicesPricing, Terms, Privacy, ProviderTermsOfService, **BarberProfile**, **ShopProfile**, **JobDetail**, **ProductDetail**, **BrandProfile** (view only). AUTH (SignIn, SignUp). | CLIENT zone (Dashboard, Account, Bookings, Cart, Checkout, Favorites, GroomingVault, Loyalty, Messages, etc.). PROVIDER zone. ADMIN zone. Employer pages (CreateJob, MyJobs, ApplicantReview, ScheduleInterview). |
| **Client** | PUBLIC + AUTH + **entire CLIENT zone** (Dashboard, AccountSettings, UserBookings, BookingFlow, ConfirmBooking, Chat, Favorites, GroomingVault, Loyalty, ShoppingBag, Checkout, MyOrders, OrderTracking, NotificationSettings, Review, ProfessionalPortfolio, PortfolioCredentials, ApplyToJob). | PROVIDER zone (ProviderDashboard, ProviderBookings, ProviderMessages, ProviderPayouts, ProviderSettings, ClientList, shop/*). ADMIN zone. Employer pages (CreateJob, MyJobs, ApplicantReview, ScheduleInterview). |
| **Barber** | PUBLIC + AUTH + CLIENT zone + **PROVIDER zone** (ProviderDashboard, ProviderBookings, ProviderMessages, ProviderPayouts, ProviderSettings, ClientList, shop/*). **Employer pages** (CreateJob, MyJobs, ApplicantReview, ScheduleInterview). Manager sub-pages only if user is shop manager/owner. | ADMIN zone (unless also admin). |
| **Shop owner** | Same as Barber + shop ownership semantics. | ADMIN zone (unless also admin). |
| **Admin** | All zones: PUBLIC, AUTH, CLIENT, PROVIDER, **ADMIN** (GlobalFinancials, AdminDisputes, AdminUserModeration, UserModerationDetail, AdminBackups, AdminOrders, etc.), Employer pages. | None. |

### 2.3 Special Frontend Rules

- **Dashboard path**: If path is `/Dashboard` and role is barber/shop_owner (not admin), RouteGuard redirects to ProviderDashboard.
- **Manager-only sub-pages** (e.g. `/staffroster`, `/staffschedule`, `/finances`, `/inventorymanagement`): Require auth + provider role + **shop member with role owner or manager**. Else redirect to ProviderDashboard.
- **Employer-only paths**: `/CreateJob`, `/MyJobs`, `/ApplicantReview`, `/ScheduleInterview`. If user is client only → redirect to CareerHub.

---

## 3. Backend: API and Entity Access

### 3.1 Auth Contract

- **JWT required** for: `/api/auth/me`, cart, orders, vault, jobs, applicants, payments, and all **auth-required entities** (see below). Missing/invalid JWT → **401 Unauthorized**.
- **Admin-only** (JWT + `role === 'admin'`): POST `/api/admin/moderation/notify`, POST `/api/admin/backup/verify`, POST `/api/functions/financial-analytics`. Else → **403 Forbidden**.
- **Auth + self only**: GET `/api/conversations/:userId` — JWT required; `userId` must equal current user id (403 else). POST `/api/reviews` — JWT required; reviewer is set to current user (403 if body.reviewer_id differs).
- **Auth + scope**: POST `/api/functions/provider-analytics` — JWT required; request may only use `shopId` for a shop the user owns or is a member of, or `barberId` for a barber whose `user_id` is the current user (403 else). POST `/api/functions/calculate-fees` — JWT required; `booking_id` (in context or body) must be a booking the user owns (client or barber/shop) (403 else).
- **Auth + self only (other)**: POST `/api/bookings` — JWT required; `client_id` is forced to current user (403 if body sends a different client_id). POST `/api/functions/checkStripeConnectStatus`, POST `/api/functions/initiateStripeConnect` — JWT required; `userId` must equal current user (403 else). POST `/api/functions/send-booking-email` — JWT required (prevents anonymous email abuse).

### 3.2 Entity Classification

| Classification | Entities | Who can list/get/create/update/delete |
|----------------|----------|----------------------------------------|
| **Public** (no JWT) | barber, shop, service, review, product, brand, brand_accolade, brand_collection, shift, time_block, shop_member, pricing_rule, staff_service_config, promo_code, etc. | Anyone (read). Create/update/delete may be restricted by custom routes (e.g. reviews). |
| **Auth-required + scoped** | booking, loyalty_profile, loyalty_transaction, message, notification, payout, favorite, dispute, audit_log, waiting_list_entry | **Authenticated only.** List/get/filter return only rows in **scope** (see below). Get-by-id/PATCH/DELETE return **404** if row not in scope. **Admin**: bypasses scope (sees all). |

### 3.3 Ownership Scope (Auth-Required Entities)

For non-admin users, only rows “owned” by the user are visible/modifiable:

| Entity | Scope rule (user sees only) |
|--------|-----------------------------|
| booking | `client_id = user.id` OR barber_id in user’s barbers OR shop_id in user’s owned shops |
| loyalty_profile, loyalty_transaction, notification, favorite | `user_id = user.id` |
| message | `sender_id = user.id` OR `receiver_id = user.id` |
| payout | `provider_id` in user’s barber profile(s) |
| dispute | Booking linked to dispute is owned by user (as client/barber/shop) |
| audit_log | `actor_id = user.id` |
| waiting_list_entry | `client_id = user.id` OR barber_id in user’s barbers |

**Implementation**: `server/src/entityScope.ts` (`getEntityScopeCondition`, `rowInScope`).

### 3.4 Per-Role: Backend Access Summary

| Role | API access |
|------|------------|
| **Unauthenticated** | Public endpoints only (e.g. list barbers, shops, services, products, brands, reviews). No cart, orders, vault, jobs, applicants, payments, or auth-required entities. |
| **Client** | Public + cart (own), orders (own), vault (own), jobs (read/applicants per route), applicants (own), payments (own). Auth-required entities: only own data per scope (bookings as client, loyalty_*, messages, notifications, favorites, own audit_log, waiting_list as client). |
| **Barber** | Same as client + bookings as barber, payouts (own), waiting_list as barber, disputes linked to own bookings. No admin-only endpoints. |
| **Shop owner** | Same as barber + bookings/payouts/disputes for owned shops. No admin-only endpoints. |
| **Admin** | All of the above + **admin-only endpoints** (moderation notify, backup verify, financial-analytics). **Bypasses entity scope**: list/get/filter for auth-required entities return all rows. |

---

## 4. Actions That Must Stay Protected

The following **must** require authentication (and where applicable, correct role or scope). New features must not expose them to unauthenticated or wrong-role users.

- **View own dashboard, account, bookings, cart, orders, loyalty, messages, notifications, favorites, grooming vault.**
- **Create/update/cancel booking** (and any booking-dependent flow).
- **Add to cart, checkout, place order.**
- **Send/receive messages.**
- **Create/edit loyalty, payouts, waiting list** (per scope).
- **Apply to job, save job, manage applications** (applicant vs employer per route).
- **Create/edit job, review applicants, schedule interviews** (employer only).
- **Access provider dashboard, provider bookings, payouts, settings, client list.**
- **Access admin financials, moderation, backups.**

---

## 5. Contract for New Features (Checklist)

Before shipping any new feature, confirm:

1. **New frontend route**
   - [ ] Classify zone: PUBLIC, AUTH, CLIENT, PROVIDER, ADMIN, or employer-only.
   - [ ] Add path to `getZoneFromPath()` in `navigationConfig.jsx` if it affects zone.
   - [ ] Ensure RouteGuard behavior matches this doc (CLIENT → auth; PROVIDER → auth + role; ADMIN → auth + admin; employer → barber/shop_owner/admin).
   - [ ] If PUBLIC: do not expose write/personal data without auth; use SignIn with `?return=` for protected actions.

2. **New API endpoint**
   - [ ] Decide: public, auth-required, or admin-only.
   - [ ] If auth-required: use `requireAuthPreHandler` (or equivalent JWT verify). If admin-only: use `requireAdminPreHandler`.
   - [ ] If endpoint returns or mutates user-specific data: enforce **ownership scope** (user sees only own data, or admin sees all). Do not rely on frontend-only checks.

3. **New entity (generic CRUD)**
   - [ ] If entity holds user-specific or sensitive data: add to `AUTH_REQUIRED_ENTITIES` in `server/src/index.ts` and implement scope in `server/src/entityScope.ts` (`getEntityScopeCondition`, `rowInScope`).
   - [ ] If entity is public (e.g. catalog): leave it out of `AUTH_REQUIRED_ENTITIES`.

4. **New action (e.g. “submit application”, “refund booking”)**
   - [ ] Backend: require JWT and, if applicable, role or scope (user can only act on own or allowed resources).
   - [ ] Frontend: gate behind auth (and role if employer/admin); redirect to SignIn with `return` when needed.

5. **Navigation / visibility**
   - [ ] Update `navigationVisibility.js` so PUBLIC_PATHS and role-based links match this doc. Do not show Dashboard/Provider/Admin links to users who cannot access them.

---

## 6. Implementation References

| What | Where |
|------|--------|
| Zone from path | `src/components/navigationConfig.jsx` — `getZoneFromPath()` |
| Route guards | `src/components/routing/RouteGuard.jsx` — CLIENT, PROVIDER, ADMIN, employer, manager |
| Nav visibility | `src/components/navigation/navigationVisibility.js` — PUBLIC_PATHS, getDashboardPath |
| Auth context | `src/lib/AuthContext.jsx` — role, user, login, logout, etc. |
| Auth-required entities | `server/src/index.ts` — `AUTH_REQUIRED_ENTITIES`, `requireAuthPreHandler`, `requireAdminPreHandler` |
| Entity scope | `server/src/entityScope.ts` — `getEntityScopeCondition()`, `rowInScope()` |

---

## 7. Violations to Avoid

- **Do not** allow unauthenticated access to CLIENT, PROVIDER, or ADMIN zones.
- **Do not** allow client role to access PROVIDER zone or employer-only pages (CreateJob, MyJobs, ApplicantReview, ScheduleInterview).
- **Do not** allow non-admin to access admin-only API endpoints or see other users’ sensitive entity data.
- **Do not** protect sensitive data with frontend-only checks; always enforce JWT + scope on the backend.
- **Do not** add new roles or overload `role` for access without updating this document and RouteGuard/nav/backend.

---

*This document is the normative reference for access control. When in doubt, restrict access and align with the rules above.*
