# ShopTheBarber — Access Control & Visibility Audit

**Date**: 2026-02-07  
**Scope**: System-wide access rules, route protection, navigation visibility, and UX for unauthenticated/incomplete users.

**Normative reference**: **[ACCESS_RULES_BY_ROLE.md](./ACCESS_RULES_BY_ROLE.md)** — Canonical access rules per role; all new features must comply. Use it as the contract so future features cannot violate access rules.

---

## 1. User States (Reference)

| State | Description | Access intent |
|-------|-------------|----------------|
| **Unauthenticated** | No session / not logged in | Can view public content; must sign in for dashboards, bookings, cart, account, provider/admin. |
| **Authenticated client** | Logged in, role `client` | Full client zone (dashboard, bookings, marketplace, career explore, apply, favorites, chat, account). |
| **Authenticated barber/shop_owner** | Logged in, role `barber` or `shop_owner` | Provider zone + employer features (CreateJob, MyJobs, ApplicantReview, ScheduleInterview). |
| **Authenticated admin** | Logged in, role `admin` | Admin zone (GlobalFinancials, admin disputes/moderation/backups). |
| **Incomplete profile** | Logged in but missing required data | Handled per feature (e.g. “Complete profile” prompts); no blanket block without explanation. |

---

## 2. Zone Classification

### PUBLIC (no auth required to view)

- **Landing & discovery**: `/`, `/Home`, `/Explore`, `/Marketplace`, `/CareerHub`, `/About`, `/HelpCenter`, `/SelectProviderType`, `/RegisterShop`, `/ServicesPricing`, `/TermsOfService`, `/Privacy`, `/ProviderTermsOfService`.
- **View-only profiles/listings**: `/BarberProfile`, `/ShopProfile`, `/JobDetail`, `/ProductDetail`, `/BrandProfile`.

**Rules**: Anyone can view. Actions that require auth (e.g. Book, Add to cart, Apply, Save job) must show clear “Sign in” / “Sign in to continue” and redirect to SignIn with `?return=<current-url>` after login.

### AUTH

- **SignIn**, **Auth**, **SignUp** (if present). No guard; redirect after successful login per `return` / `next` query.

### CLIENT (auth required)

- **Dashboard**, **AccountSettings**, **UserBookings**, **BookingFlow**, **ConfirmBooking**, **Chat**, **Favorites**, **GroomingVault**, **Loyalty**, **ShoppingBag**, **Checkout**, **MyOrders**, **OrderTracking**, **NotificationSettings**, **Review**.
- **ProfessionalPortfolio**, **PortfolioCredentials**.
- **ApplyToJob** (submit application requires auth; JobDetail view is public).

**Rules**: RouteGuard redirects unauthenticated users to SignIn with `?return=<current-path>`. Pages may still defensively show “Session expired” or “Sign in” when `!user` (e.g. AccountSettings).

### PROVIDER (auth + barber/shop_owner/admin)

- **ProviderDashboard**, **ProviderBookings**, **ProviderMessages**, **ProviderPayouts**, **ProviderSettings**, **ClientList**, and provider-specific shop routes.

**Rules**: RouteGuard requires user; then requires role in `['provider','barber','shop_owner','admin']`. Otherwise redirect to Dashboard. Manager-only sub-pages (e.g. staff roster, finances) further restrict by ShopMember role.

### ADMIN (auth + admin)

- **GlobalFinancials**, **AdminDisputes**, **AdminUserModeration**, **UserModerationDetail**, **AdminBackups**, **AdminOrders**, etc.

**Rules**: RouteGuard requires user; then requires `role === 'admin'`. Otherwise redirect to Home.

### EMPLOYER-ONLY (auth + barber/shop_owner/admin)

- **CreateJob**, **MyJobs**, **ApplicantReview**, **ScheduleInterview**.

**Rules**: If user is authenticated but not provider/barber/shop_owner/admin, RouteGuard redirects to CareerHub (so clients don’t land on job-poster tools).

---

## 3. Implemented Protections

### 3.1 RouteGuard (`src/components/routing/RouteGuard.jsx`)

- **CLIENT zone**: If `!user` → `navigate(SignIn?return=<current>)`, replace.
- **PROVIDER zone**: If `!user` → SignIn with return; if user but not provider role → Dashboard.
- **ADMIN zone**: If `!user` → SignIn with return; if user but not admin → Home.
- **Employer routes** (CreateJob, MyJobs, ApplicantReview, ScheduleInterview): If user is not barber/shop_owner/admin → CareerHub.
- **Dashboard**: If path is `/Dashboard` and user is provider/barber/shop_owner (not admin) → ProviderDashboard.
- **Manager sub-pages**: Provider zone only; manager-only pages redirect to ProviderDashboard if not manager.

### 3.2 Public paths (`src/components/navigationConfig.jsx`)

- `getZoneFromPath()` treats the following as PUBLIC so they are not CLIENT-protected: BarberProfile, ShopProfile, JobDetail, ProductDetail, BrandProfile (in addition to existing landing, explore, marketplace, careerhub, about, help, legal, etc.).

### 3.3 SignIn return URL

- SignIn reads `?return=` (and legacy `?next=`). After successful login, redirects to `return` if it starts with `/`, else to Dashboard (or `next` page). RouteGuard uses `?return=<encoded-current-path>` so users return to the page they tried to open.

### 3.4 Navigation visibility (`src/components/navigation/navigationVisibility.js`)

- Unauthenticated: only public nav (e.g. Home, Find a Barber); Sign in / Sign up shown where appropriate; no Dashboard, Notifications, Profile, Bookings.
- Authenticated: role-based dashboard link (client → Dashboard, barber/shop_owner → ProviderDashboard, admin → GlobalFinancials); Notifications and Profile shown; Explore/Bookings per role.

---

## 4. UX Rules for Unauthenticated Users

- **No irreversible actions** on protected flows (no checkout, no booking confirm, no job apply submit) without auth.
- **Clear CTAs**: Buttons that need login go to SignIn with `return` (e.g. “Sign in to continue”, “Sign in to add to cart”).
- **No dead ends**: Redirect to SignIn with return URL; after login, redirect back.
- **Discovery allowed**: Browse barbers, shops, jobs, products; only actions that write or use personal data require sign-in.

---

## 5. Authenticated but Incomplete Users

- **AccountSettings**: If `!user` (e.g. session expired), shows “Session Expired” and “Return to Login” (no silent block).
- **CareerHub**: Saved/Applied tabs require auth; empty state explains “Sign in to see saved jobs” / “Sign in to see applications”.
- **Provider onboarding**: Handled by provider flows and optional launch checklist; no blanket block without explanation.

---

## 5.1. Auth Context (Unified)

- **Single source of truth**: `src/lib/AuthContext.jsx` provides the only AuthProvider. It exposes: `user`, `isAuthenticated`, `isLoadingAuth`, `isLoading`, `role`, `authError`, `appPublicSettings`, `logout`, `navigateToLogin`, `checkAppState`, `checkSession`, `login`, `register`. `role` is `user?.role ?? 'client'`.
- **Layout** no longer wraps with a second AuthProvider; the app uses the single provider from `App.jsx`.
- **Consumers** import from `@/lib/AuthContext`. `@/components/context/AuthContext.jsx` re-exports from lib for backward compatibility.

## 6. Backend Alignment

- **Auth**: `/api/auth/me` requires JWT; 401 when missing/invalid.
- **Cart, orders, vault, jobs, applicants**: Relevant routes use `jwtVerify` and user-scoped data where implemented.
- **Generic entity routes** (`server/src/index.ts`): **Sensitive entities** require JWT and **ownership scope**. List/get/filter return only rows the user owns or is allowed to see; get-by-id/patch/delete return 404 if the row is not in scope. Scope rules: **booking** — client_id = user or barber_id/shop_id linked to user; **loyalty_profile**, **loyalty_transaction**, **notification**, **favorite** — user_id = user; **message** — sender_id or receiver_id = user; **payout** — provider_id in user’s barber profile(s); **dispute** — linked booking belongs to user (client/barber/shop); **audit_log** — actor_id = user; **waiting_list_entry** — client_id = user or barber_id linked to user. **Admin** role bypasses scope (sees all). Implementation: `server/src/entityScope.ts` (`getEntityScopeCondition`, `rowInScope`).
- **Admin-only routes**: `requireAdminPreHandler` (JWT verify + role === 'admin') is applied to: POST `/api/admin/moderation/notify`, POST `/api/admin/backup/verify`, POST `/api/functions/financial-analytics`. Non-admin receive 403.
- **Other protected routes**: GET `/api/conversations/:userId` — auth; userId must equal current user. POST `/api/reviews` — auth; reviewer_id forced to current user. POST `/api/functions/provider-analytics` — auth; shopId/barberId scope. POST `/api/bookings` — auth; client_id forced to current user. POST `/api/functions/calculate-fees` — auth; booking scope (client or barber/shop). POST `/api/functions/checkStripeConnectStatus`, `/api/functions/initiateStripeConnect` — auth; userId must be self. POST `/api/functions/send-booking-email` — auth required.

---

## 7. Self-Check (Audit Criteria)

- **Unauthenticated user** cannot reach client dashboard, account, bookings, cart checkout, provider dashboard, or admin pages; they are redirected to SignIn with return URL.
- **Logged-in user** does not see irrelevant or forbidden areas as primary flows (e.g. client not given provider nav as default; employer-only pages redirect non-employers to CareerHub).
- **Access logic** is consistent: PUBLIC vs CLIENT vs PROVIDER vs ADMIN vs employer-only is defined in one place (navigationConfig + RouteGuard) and used for both routing and nav visibility.
- **Professional review**: Route-level protection is in place; UX explains sign-in when needed; return URL preserves intent; backend auth exists for critical paths (auth, cart, orders, jobs, applicants); remaining gaps (generic entities, some admin endpoints) are documented for hardening.

---

## 8. Files Touched (Audit Implementation)

- `src/components/navigationConfig.jsx` — Public paths extended (BarberProfile, ShopProfile, JobDetail, ProductDetail, BrandProfile).
- `src/components/routing/RouteGuard.jsx` — CLIENT zone auth redirect; ADMIN unauthenticated redirect; employer-only redirect; SignIn return URL helper; comments cleaned.
- `src/components/navigation/navigationVisibility.js` — PUBLIC_PATHS aligned with navigationConfig (marketplace, careerhub, helpcenter, view-only profiles, etc.).
- `server/src/index.ts` — `AUTH_REQUIRED_ENTITIES` and `requireAuthPreHandler` added; all routes for booking, loyalty_*, message, notification, payout, favorite, dispute, audit_log, waiting_list_entry now require JWT (401 when missing).
