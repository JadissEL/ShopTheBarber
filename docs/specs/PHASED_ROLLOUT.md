# Phased Rollout

## Phase 1 — Launch core ✅ Implemented

- Booking + wallet commission + subscription model
- Tiered deposits + price lock + **dynamic deposit hook** (client trust passed at checkout)
- Wallet Health (provider) + promo expiry + reconciliation cron
- Ledger transaction types + `ledger_entries` (+ referral bonus writes)
- Chair/capacity + booking buffer
- QR check-in
- Waiting list (15-min cascade)
- Marketplace reservation holds
- Public barber stats (basic) + championship badges from Hall of Fame
- Reviews (existing)
- Auto-confirm pending (2h)

**Code:** `server/src/domain/` Phase 1 modules, migrations `20260628100000`, `20260628120000`

---

## Phase 2 — Growth engine ✅ Implemented

- Client reputation + levels (`domain/reputation/`, `users.reputation_*`)
- Barber Trust Score + Availability Score (`barberTrust.ts`, `availabilityScore.ts`)
- Reliability Index (on `users.reliability_index`)
- Championship seasons + Hall of Fame (`domain/championship/`, cron refresh)
- Referrals enhancement (+ ledger `referral_bonus`, reputation points on reward)
- Dynamic deposits (`domain/deposits/dynamic.ts`)
- Admin live financial dashboard (`/api/admin/financial-trust/live`)
- Barber financial dashboard (`/api/provider/financial-dashboard`)
- Client dashboard Phase 2 (`ClientReputationCard`, `/api/me/dashboard/trust`)
- Wallet reconciliation cron (`/api/cron/wallets/reconcile`)
- Auto-recharge nudge cron (`/api/cron/wallets/auto-recharge-nudge`)
- Dispute appeals (`dispute_appeals`, POST appeal)
- Fraud rules engine (`fraud/rules.ts`, admin alerts)

**Migration:** `20260628140000_financial_trust_phase2_phase3`

---

## Phase 3 — Platform scale ✅ Implemented (v1)

- Multi-shop owner dashboard (`NetworkOwnerDashboard`, `/api/network/rollup`)
- Staff RBAC (`auth/shopRbac.ts`, roles: receptionist, assistant; `/api/shops/:id/my-permissions`)
- Tax export CSV (`exports/taxReport.ts`, `/api/provider/tax-report`)
- Gift cards backend (`giftCards/logic.ts`, wired UI)
- Ad credits wallet (`adCredits/logic.ts`, admin grant)
- Financing applications stub (`financing_applications`, POST apply)
- Fraud alerts (rules-first)
- Partner API v1 (`/api/v1/partner/bookings`, admin key creation)

**Deferred / Phase 3+:** Stripe auto-recharge charge, AI recommendations, full insurance workflow, Excel/PDF tax packs, partner OAuth.

---

## Crons (GitHub + Render)

| Route | Schedule |
|-------|----------|
| `/api/cron/bookings/auto-confirm` | */15 |
| `/api/cron/waitlist/expire-offers` | */15 |
| `/api/cron/marketplace/expire-reservations` | */15 |
| `/api/cron/wallet/expire-promotional-credits` | */15 |
| `/api/cron/championships/refresh` | daily (add to workflow) |
| `/api/cron/wallets/reconcile` | nightly (add to workflow) |
