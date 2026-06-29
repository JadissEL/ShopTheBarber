# Knowledge base

Reusable patterns, commands, and “how we do things here.” Add titled sections or append with dates.

---

## Patterns

### Sovereign entity reads (2026-05-01)

- **`sovereign.entities.*.list(order, limit, offset)`** → `GET /api/<plural>?limit=&offset=&order=` (server sorts/paginates).
- **`sovereign.entities.*.filter(criteria, order, limit, offset)`** → `POST /api/<plural>/filter` with JSON `{ query, order, limit, offset }`; server applies scope + operators (`$in`, `$nin`, `$gt`, `$lt`, `$gte`, `$lte`, `$ne`).

### Public promo API via sovereign client (2026-05-01)

- **`sovereign.public.getActivePromotions(barberId?)`** → `GET ${BASE_URL}/public/active-promotions` with optional `?barber_id=`; **`BASE_URL`** honours **`VITE_API_URL`** in production (do **not** use bare `fetch('/api/...')` on Explore / Barber promos).

## API keys & secrets (finalization)

Full checklist for a guided “set all keys at once” session: **`.cursor_memory/api_keys_checklist.md`** — local `.env`, Render, Vercel, GitHub Actions, Neon, Clerk, Stripe, Sentry, Resend, setup order.

## Snippets / commands

- **Launch policy Q&A (wallet, credits, disputes, dashboards):** [`docs/LAUNCH_POLICY_QUESTIONNAIRE.md`](../docs/LAUNCH_POLICY_QUESTIONNAIRE.md) — fill **Your answer** before implementing financial/booking rules.
- **Verify production schema (Neon):** `cd server && npm run verify:schema` (requires `DATABASE_URL`).
- **Render build DB bootstrap:** `node scripts/build-database.mjs` — generate, migrate deploy, verify.
- **Health endpoints (API host):** `GET /api/health/live` (alive), `GET /api/health/ready` (DB + migrations + promo_targeting/fixed_fee/offers_mobile_service).
- **Uptime:** GitHub Actions workflow `.github/workflows/uptime-monitor.yml` — set repo secret `PRODUCTION_API_URL`.

## Mobile layout (2026-06-26)

- **`src/lib/mobileLayout.js`:** `shouldShowClientBottomNav`, `shouldHideBottomNav`, `shouldHideGlobalNavOnMobile`.
- **CSS (`index.css`):** `pb-nav`, `safe-area-pb/pt`, `touch-target`; `viewport-fit=cover` in `index.html`.
- **Client bottom nav:** 5 items — Home, Bookings, Book (FAB), Bag, More (sheet). Auth-only; hidden on booking/checkout.

## Route code-splitting (2026-06-26)

- **Core eager list:** `src/lib/coreRoutes.js` (`CORE_EAGER_PAGE_NAMES`) — Home, Explore, booking funnel, auth, profiles (~19 pages).
- **Lazy pages:** `pages.config.js` uses `import.meta.glob('./pages/*.jsx')` + `React.lazy` for all other pages.
- **Suspense:** `App.jsx` wraps routes with `RoutePageFallback`.
- **Custom routes:** CityLanding, CitiesDirectory, InviteLanding lazy in App.jsx only (not in PAGES auto-routes).
- **Build:** `vite.config.js` `manualChunks` splits clerk, react, query, charts/motion vendors.

## Deployment docs (2026-06-26)

- **Canonical:** [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — Vercel + Render + Neon, env vars, CI/E2E smoke.
- **Database:** [docs/NEON_PRISMA.md](docs/NEON_PRISMA.md) — Prisma migrate deploy; **no SQLite/Drizzle in production**.
- **Env checklist:** `.cursor_memory/api_keys_checklist.md` — Upstash + geocoding required on Render prod.
- **Obsolete:** README/older guides mentioning `JWT_SECRET`, `drizzle-kit push`, `DRIZZLE_BOOTSTRAP`, local SQLite.

## Documentation hierarchy (2026-06-26)

- **Deploy:** [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) — canonical for Vercel + Render + Neon.
- **Database:** [docs/NEON_PRISMA.md](../docs/NEON_PRISMA.md) + `server/prisma/schema.prisma` — canonical for Prisma/Postgres; ignore SQLite/Drizzle in older docs.
- **Agents / CI:** [AGENTS.md](../AGENTS.md) — commands, E2E, gotchas.
- **Tracker:** [PROJECT_TRACKER.md](../PROJECT_TRACKER.md) — current architecture at top; pre-2026-06 archive below fold.
- **Layout:** [PROJECT_SCHEMA.md](../PROJECT_SCHEMA.md) — where to put new code.
- **Cursor rules:** `.cursor/rules/antigravity-system.mdc`, `full-stack-unified-development.mdc`, `project-schema.mdc` — Prisma/Neon aligned.
- **Onboarding:** [README.md](../README.md) and `.cursor_memory/project_context.md` point to the above; do not duplicate env tables in README.

- **Registry:** `src/lib/featureRegistry.js` — modules, `isFeatureEnabled()`, nav builders, page→feature map.
- **Route gate:** `src/components/routing/FeatureGuard.jsx` in `Layout.jsx`.
- **Env:** `VITE_FEATURE_MARKETPLACE=false` (etc.) disables nav + redirects deep links; default enabled.
- **Docs:** [docs/FEATURE_MODULES.md](docs/FEATURE_MODULES.md).
- **Admin:** `AdminFeatureToggles` — runtime DB toggles via `/api/admin/feature-flags` (env `VITE_FEATURE_*=false` still wins).

## Pay-at-shop vs online (2026-06-26)

**Product meaning (not “barber prefers cash”):**

| Client choice | What happens |
|---------------|--------------|
| **Pay online** | Card through ShopTheBarber (Stripe). Platform commission handled in the payment flow. |
| **Pay at shop** (`payment_method: cash_at_store`) | Client pays the barber **in the shop** — **cash or card on the shop’s own POS**. ShopTheBarber does **not** process that payment. |

**Barber/shop commission credit (`provider_fee_wallets`):**

- Barbers/shops **top up prepaid credit** (Stripe checkout → `provider_wallet_topup` webhook).
- When they **enable pay-at-shop** and **confirm** a booking, platform commission is **deducted from that balance** (`deductPlatformFeeForCashBooking`).
- Fixed-fee subscribers can have commission **waived** on these bookings.
- UI: `ProviderFeeWalletPanel` on Provider Settings / Payouts; client sees “Pay at shop” in `BookingConfirmationStep`.

## One-click rebook (2026-06-26)

- **API:** `GET /api/bookings/:id/rebook` — auth + client scope; returns service IDs, shop/independent/mobile/group context, address, party size.
- **Lib:** `src/lib/rebook.js` — `resolveRebookContext`, `buildRebookSearchParams`, session prefill (`REBOOK_PREFILL_KEY`).
- **Hook:** `useRebook` — fetches payload when `booking.id` exists, saves prefill, navigates to `BookingFlow?rebook=1&...`.
- **UI:** `RebookButton` on UserBookings history, Dashboard last-completed banner, favorite-card.
- **Provider types:** shop (`shopId`), independent (`context=independent`), mobile (`location=mobile` + address prefill), group (`group=1` + party size).

## Payment protection — deposits, card-on-file, cancellation (2026-06-26)

**Booksy/Squire-style** via `server/src/paymentProtection/`:

| Feature | Stripe mode | Client flow |
|---------|-------------|-------------|
| **Card on file** | Checkout `setup` | Required before/at booking when policy enabled |
| **Deposit** | Checkout `payment` + `setup_future_usage` | Partial pay at booking; balance at visit |
| **Auth hold** | `capture_method: manual` | Full amount authorized; captured on completion |
| **No-show fee** | Off-session `PaymentIntent` | Provider marks no-show → charge saved card |
| **Late cancel fee** | Refund partial / forfeit deposit / off-session charge | Cancel preview → tiered refund |

**Cancellation tiers (default):** 24h+ full refund · 2–24h 50% fee · &lt;2h non-refundable.

**API:** `/api/payment-protection/*`, `/api/payment-methods/*`  
**UI:** `ProviderPaymentProtectionPanel`, `ClientPaymentMethodsPanel`, `CancelBookingDialog`, `BookingPaymentActions`  
**Live Stripe:** set `STRIPE_API_KEY` + `STRIPE_WEBHOOK_SECRET`; webhook handles deposit, auth, save_card, no_show_fee, cancellation_fee.

