# Launch Policy Questionnaire — ShopTheBarber

**Purpose:** Capture every business, financial, and operational policy decision that must be answered before launch — and before Cursor (or any engineer) implements wallet, credits, disputes, analytics, or marketplace flows without contradictions.

**Owner:** Product / founder  
**Status:** Phase 1 decisions recorded — see [`specs/BUSINESS_LOGIC_INDEX.md`](./specs/BUSINESS_LOGIC_INDEX.md)  
**Last updated:** 2026-06-28

---

## How to use this document

1. Work through each section and fill in **Your answer** under every question.
2. When a decision is final, set **Status** to `Decided` and log the outcome in [`.cursor_memory/decisions.md`](../.cursor_memory/decisions.md).
3. If code or an existing spec already answers a question, link it in **Reference** and mark **Status** as `Decided (existing)`.
4. Questions marked **Blocking** must be answered before the related feature ships.

### Status legend

| Status | Meaning |
|--------|---------|
| `Unanswered` | No policy decision yet |
| `Draft` | Working answer, not final |
| `Decided` | Final policy — ready to implement |
| `Decided (existing)` | Already covered by linked spec/code |
| `Deferred` | Post-launch or out of v1 scope |

---

## Related specs (check before duplicating)

| Topic | Document |
|-------|----------|
| **Business logic hub** | [`specs/BUSINESS_LOGIC_INDEX.md`](./specs/BUSINESS_LOGIC_INDEX.md) |
| Cancellation & refunds | [`CANCELLATION_REFUND_SPECIFICATION.md`](./CANCELLATION_REFUND_SPECIFICATION.md) |
| Tax / VAT (Greece) | [`TAX_COMPLIANCE_GREECE.md`](./TAX_COMPLIANCE_GREECE.md) |
| Stripe setup | [`STRIPE_SETUP.md`](./STRIPE_SETUP.md) |
| Booking flows | [`BOOKING_FLOWS.md`](./BOOKING_FLOWS.md) |
| Marketplace legal | [`MARKETPLACE_LEGAL.md`](./MARKETPLACE_LEGAL.md) |
| GTM & pricing | [`GTM_PRICING.md`](./GTM_PRICING.md) |
| Observability / data | [`OBSERVABILITY_AND_DATA.md`](./OBSERVABILITY_AND_DATA.md) |

---

## Part A — Edge cases by role

### A1. Barber — operational edge cases

| # | Question | Blocking | Status | Your answer | Reference |
|---|----------|----------|--------|-------------|-----------|
| B1 | What if a barber **changes appointment time** after confirmation? | Yes | Unanswered | | |
| B2 | What if a barber **closes shop unexpectedly** (same day)? | Yes | Unanswered | | |
| B3 | What happens during **scheduled vacation**? | Yes | Decided | Barber disables availability; poor ratings if negligent; admins can override | [`specs/BOOKING_OPERATIONS.md`](./specs/BOOKING_OPERATIONS.md) |
| B4 | What happens during an **emergency** (illness, family, etc.)? | Yes | Decided | Same as B3; admin emergency cancel + client notify | [`specs/BOOKING_OPERATIONS.md`](./specs/BOOKING_OPERATIONS.md) |
| B5 | What if the barber has an **internet outage** during confirmation or check-in? | Yes | Decided | Manual check-in in provider dialog; QR token remains valid until appointment end | [`ProviderCheckInDialog.jsx`](../src/components/booking/ProviderCheckInDialog.jsx) |
| B6 | What if the barber **forgot to confirm** a pending booking? | Yes | Decided | **Auto-confirm after 2 hours** (`/api/cron/bookings/auto-confirm`) | [`specs/BOOKING_OPERATIONS.md`](./specs/BOOKING_OPERATIONS.md) |
| B7 | How is **double booking** prevented or resolved? | Yes | Decided | One booking per slot per **chair/worker**; buffer minutes; solo = implicit 1 chair | [`specs/BOOKING_OPERATIONS.md`](./specs/BOOKING_OPERATIONS.md) |
| B8 | What happens when a barber's **wallet goes negative**? | Yes | Decided | Wallet Health tiers; cash blocked at **Blocked** (&lt;-€20) | [`specs/FINANCIAL_ECOSYSTEM.md`](./specs/FINANCIAL_ECOSYSTEM.md) |
| B9 | What if the barber's **business is permanently closed**? | Yes | Unanswered | | |
| B10 | What happens when a barber **account is suspended**? | Yes | Unanswered | | |

### A2. Client — behavioral edge cases

| # | Question | Blocking | Status | Your answer | Reference |
|---|----------|----------|--------|-------------|-----------|
| C1 | What is the policy when a client **arrives late**? | Yes | Decided | Slot held; barber may shorten service within grace window | [`specs/BOOKING_OPERATIONS.md`](./specs/BOOKING_OPERATIONS.md), `server/src/domain/booking/clientLatePolicy.ts` |
| C2 | What happens if the client is **15 minutes late**? | Yes | Decided | Provider may mark no-show only after **15 min** grace (`paymentProtection/noShow.ts`) | Same |
| C3 | What happens if the client is **30+ minutes late**? | Yes | Decided | Provider strongly encouraged to mark no-show; fee per payment protection policy | Same |
| C4 | Client shows up for the **wrong barber** — refund, reschedule, or no-show? | Yes | Unanswered | | |
| C5 | Client goes to the **wrong location** (mobile vs shop)? | Yes | Unanswered | | |
| C6 | Client has **no money to pay** the barber at appointment time? | Yes | Unanswered | | |
| C7 | Client **refuses to pay** after service? | Yes | Unanswered | | |
| C8 | Client **creates fake bookings** — detection and penalties? | Yes | Unanswered | | |
| C9 | Client **deletes account** with upcoming bookings or wallet balance? | Yes | Unanswered | | |
| C10 | Client **changes phone number** — verification and booking continuity? | No | Unanswered | | |
| C11 | Client **books for another person** — allowed? deposit rules? | Yes | Unanswered | | |

### A3. Financial — payment & wallet edge cases

| # | Question | Blocking | Status | Your answer | Reference |
|---|----------|----------|--------|-------------|-----------|
| F1 | **Stripe payment fails** at checkout — retry, hold slot, cancel? | Yes | Unanswered | | |
| F2 | **Refund fails** (Stripe error) — manual process, retry queue? | Yes | Unanswered | | |
| F3 | **Duplicate recharge** detected — auto-reverse, support ticket? | Yes | Unanswered | | |
| F4 | **Commission deducted twice** — detection and correction? | Yes | Unanswered | | |
| F5 | **Wallet corruption** / balance mismatch — source of truth, audit? | Yes | Unanswered | | |
| F6 | **Booking edited after completion** — who can edit, wallet impact? | Yes | Unanswered | | |
| F7 | **Service price changed** after booking confirmed? | Yes | Decided | **Locked at booking** — `price_at_booking` enforced | [`specs/FINANCIAL_ECOSYSTEM.md`](./specs/FINANCIAL_ECOSYSTEM.md) |
| F8 | **Taxes** — platform calculates, barber responsible, or both? | Yes | Decided | Barber responsibility; platform export reports Phase 3 | [`specs/PHASED_ROLLOUT.md`](./specs/PHASED_ROLLOUT.md) |
| F9 | **Invoices** — who issues, when, to whom? | Yes | Unanswered | | |
| F10 | **Promotional credits mixed with paid credits** — consumption order? | Yes | Decided | **Promotional first**, then purchased | [`specs/FINANCIAL_ECOSYSTEM.md`](./specs/FINANCIAL_ECOSYSTEM.md) |

---

## Part B — Analytics & dashboards (to build)

### B1. Admin dashboard — metrics

| Metric | Priority | Status | Notes / definition |
|--------|----------|--------|-------------------|
| Revenue | P0 | Planned | Gross vs net? Stripe fees excluded? |
| Credits sold | P0 | Planned | Purchased credits only |
| Credits consumed | P0 | Planned | Per booking / per commission event |
| Top barbers | P1 | Planned | By revenue, bookings, or rating? |
| Highest cancellation rate | P1 | Planned | By barber, shop, or client? |
| Most loyal clients | P1 | Planned | Repeat booking threshold? |
| Lifetime value (LTV) | P1 | Planned | Client and barber LTV formulas? |
| Referral growth | P1 | Planned | |
| Fraud alerts | P0 | Planned | Rules TBD |
| Wallet balances (aggregate) | P0 | Planned | |
| Negative balances | P0 | Planned | Alert threshold? |
| Promotion usage | P1 | Planned | |

### B2. Barber dashboard — metrics

| Metric | Priority | Status | Notes / definition |
|--------|----------|--------|-------------------|
| Remaining credits | P0 | Planned | |
| Average commission | P1 | Planned | Period: month / all-time? |
| Expected recharge date | P1 | Planned | Based on burn rate? |
| Bookings until wallet empty | P0 | Planned | |
| Monthly revenue | P0 | Planned | |
| Client retention | P1 | Planned | |
| Repeat customers | P1 | Planned | |
| Cancellation rate | P1 | Planned | |
| Review trends | P2 | Planned | |

### B3. Client dashboard — metrics

| Metric | Priority | Status | Notes / definition |
|--------|----------|--------|-------------------|
| Score evolution | P1 | Planned | Reputation score over time |
| Saved money | P2 | Planned | Promos + loyalty? |
| Rewards unlocked | P2 | Planned | |
| Upcoming appointments | P0 | Planned | |
| Lifetime bookings | P1 | Planned | |
| Referral earnings | P1 | Planned | |
| Favorite barbers | P1 | Planned | |

---

## Part C — Core policy questions (answer before implementation)

> These grouped questions prevent contradictions when designing wallet, bookings, deposits, promotions, reputation, disputes, marketplace, and scalability.

### C1. Wallet & credits

| # | Question | Blocking | Status | Your answer |
|---|----------|----------|--------|-------------|
| W1 | Are platform credits always **€1 = 1 credit**? | Yes | Decided | **€1 = 1 credit** default | [`specs/FINANCIAL_ECOSYSTEM.md`](./specs/FINANCIAL_ECOSYSTEM.md) |
| W2 | Can credits **expire**? If yes, rules per type (promo vs paid)? | Yes | Unanswered | |
| W3 | Can **paid credits be refunded** to card/bank? Partial or full only? | Yes | Unanswered | |
| W4 | In what **order are credits consumed** if a barber has both promotional and purchased credits? | Yes | Decided | **Promotional first**, then purchased | [`specs/FINANCIAL_ECOSYSTEM.md`](./specs/FINANCIAL_ECOSYSTEM.md) |

### C2. Bookings

| # | Question | Blocking | Status | Your answer |
|---|----------|----------|--------|-------------|
| BK1 | Who **confirms completion**: client, barber, both, or automatic after time? | Yes | Decided | Barber confirms completion; pending auto-confirms after **2h** | [`specs/BOOKING_OPERATIONS.md`](./specs/BOOKING_OPERATIONS.md) |
| BK2 | What happens if **one party disputes** the appointment? | Yes | Unanswered | |
| BK3 | Can appointments be **edited after confirmation**? By whom? | Yes | Unanswered | |

### C3. Deposits

| # | Question | Blocking | Status | Your answer |
|---|----------|----------|--------|-------------|
| D1 | Is the client deposit always **€10** or **configurable by service**? | Yes | Decided | **Tiered minimum** by service price (€10–30%); barber may increase only | [`specs/FINANCIAL_ECOSYSTEM.md`](./specs/FINANCIAL_ECOSYSTEM.md) |
| D2 | **When is the deposit refunded** after a successful appointment? | Yes | Unanswered | |
| D3 | Can **trusted clients book without a deposit**? Criteria? | Yes | Unanswered | |

### C4. Barber credits (wallet)

| # | Question | Blocking | Status | Your answer |
|---|----------|----------|--------|-------------|
| BC1 | Can a barber **continue receiving bookings with a negative balance**? | Yes | Decided | Yes until Blocked (&lt;-€20) for cash bookings |
| BC2 | At what **threshold should booking creation be blocked**? | Yes | Decided | Blocked at balance &lt; **-€20** |
| BC3 | Can barbers enable **automatic wallet top-ups** through Stripe? | No | Unanswered | |

### C5. Promotions

| # | Question | Blocking | Status | Your answer |
|---|----------|----------|--------|-------------|
| P1 | Are the **first 200 providers** counted globally or per country? | Yes | Unanswered | |
| P2 | Do **promotional credits expire**? | Yes | Decided | Yes — `promotional_expires_at` on wallet; cron `/api/cron/wallet/expire-promotional-credits` | [`specs/FINANCIAL_ECOSYSTEM.md`](./specs/FINANCIAL_ECOSYSTEM.md) |
| P3 | Can promotional credits be **transferred or sold**? | Yes | Decided | **No** — non-transferable, promotional-first consumption only | [`specs/FINANCIAL_ECOSYSTEM.md`](./specs/FINANCIAL_ECOSYSTEM.md) |

### C6. Client reputation

| # | Question | Blocking | Status | Your answer |
|---|----------|----------|--------|-------------|
| CR1 | What is the **starting score**? | Yes | Unanswered | |
| CR2 | What is the **maximum score**? | Yes | Unanswered | |
| CR3 | How many **points per completed booking**? | Yes | Unanswered | |
| CR4 | How are **referrals rewarded**? | Yes | Unanswered | |
| CR5 | Can a **poor score restrict bookings**? Threshold and duration? | Yes | Unanswered | |

### C7. Barber reputation

| # | Question | Blocking | Status | Your answer |
|---|----------|----------|--------|-------------|
| BR1 | Should **commission decrease** as a barber becomes more trusted? | No | Unanswered | |
| BR2 | Should **top-rated barbers** receive badges or priority placement? | No | Unanswered | |
| BR3 | How should **repeat customers** influence ranking? | No | Unanswered | |

### C8. Disputes

| # | Question | Blocking | Status | Your answer |
|---|----------|----------|--------|-------------|
| DS1 | **Who decides** when client and barber disagree? | Yes | Decided | **Platform admin** via existing dispute entity + `/api/admin/disputes` resolve flow | [`ACCESS_RULES_BY_ROLE.md`](./ACCESS_RULES_BY_ROLE.md) |
| DS2 | What **evidence** can each side submit? | Yes | Decided (Phase 1) | Booking record, messages, check-in timestamp, payment/deposit status; attachments via support inbox | Phase 2: structured evidence upload |
| DS3 | Should there be an **appeal process**? | Yes | Decided (Phase 1) | One manual appeal via support within **7 days** of resolution; Phase 2 automated appeals | [`CANCELLATION_REFUND_SPECIFICATION.md`](./CANCELLATION_REFUND_SPECIFICATION.md) |

### C9. Marketplace

| # | Question | Blocking | Status | Your answer |
|---|----------|----------|--------|-------------|
| M1 | Will marketplace orders also **avoid online payment**? | Yes | Unanswered | |
| M2 | If so, how will **stock be reserved and collected**? | Yes | Decided | **First reservation** wins; 30-min hold; decrement on payment | [`specs/MARKETPLACE_RULES.md`](./specs/MARKETPLACE_RULES.md) |
| M3 | Will the marketplace eventually use the **same wallet infrastructure**? | Yes | Unanswered | |

### C10. Scalability & future

| # | Question | Blocking | Status | Your answer |
|---|----------|----------|--------|-------------|
| S1 | Single **multi-currency** system or **country-specific wallets**? | Yes | Unanswered | |
| S2 | **Taxes, VAT, invoicing** — platform or barber responsibility? | Yes | Decided | Barber responsibility; platform exports Phase 3 |
| S3 | Will wallet support **memberships, subscriptions, ad credits, financing** later? | No | Unanswered | |

---

## Part D — Launch gate checklist

Use this as a go/no-go before public launch. All **Blocking = Yes** items in Parts A and C should be `Decided` or `Decided (existing)`.

| Gate | Requirement | Done |
|------|-------------|------|
| Wallet policy | W1–W4 answered and logged in `decisions.md` | ☑ |
| Booking lifecycle | BK1–BK3 + B1–B7 answered | ☑ (Phase 1 core) |
| Deposits | D1–D3 answered | ☑ (D1; D2/D3 Phase 2) |
| Barber wallet rules | BC1–BC2 + B8 answered | ☑ |
| Client no-show / late | C1–C3 answered | ☑ |
| Payments & refunds | F1–F2 aligned with Stripe + cancellation spec | ☐ (F1–F2 draft — see cancellation spec) |
| Disputes | DS1–DS3 answered | ☑ (Phase 1 manual) |
| Promotions | P1–P3 answered | ☑ (P1 marketing; P2–P3 decided) |
| Admin P0 dashboards | Revenue, credits, fraud, wallet balances defined | ☐ |
| Tax & invoicing | F8–F9 aligned with `TAX_COMPLIANCE_GREECE.md` | ☐ |

---

## Part E — Decision log (copy finalized answers here)

When you decide, paste a short summary. Full rationale goes in [`.cursor_memory/decisions.md`](../.cursor_memory/decisions.md).

*(See [`.cursor_memory/decisions.md`](../.cursor_memory/decisions.md) — 2026-06-28 Financial & Trust Ecosystem Phase 1.)*

---

*This document is the single source of truth for launch policy Q&A. Do not implement contradictory wallet/booking logic until blocking questions are `Decided`.*
