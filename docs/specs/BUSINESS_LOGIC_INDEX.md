# Business Logic Index — ShopTheBarber

**Status:** Active specification library  
**Last updated:** 2026-06-28  
**Companion:** [`LAUNCH_POLICY_QUESTIONNAIRE.md`](../LAUNCH_POLICY_QUESTIONNAIRE.md)

---

## Purpose

Single entry point for the **financial and trust ecosystem** — wallet, bookings, reputation, championships, marketplace, and analytics. Use this before implementing any policy-sensitive code.

---

## Specification library

| Document | Scope |
|----------|--------|
| [FINANCIAL_ECOSYSTEM.md](./FINANCIAL_ECOSYSTEM.md) | Wallet, credits, Wallet Health, ledger transaction types, subscriptions |
| [BOOKING_OPERATIONS.md](./BOOKING_OPERATIONS.md) | Deposits, QR check-in, chairs, waiting list, price lock, buffers, edge cases |
| [REPUTATION_TRUST.md](./REPUTATION_TRUST.md) | Client reputation, Reliability Index, Barber Trust Score, Availability Score |
| [CHAMPIONSHIPS.md](./CHAMPIONSHIPS.md) | Ranking formula, seasons, Hall of Fame |
| [MARKETPLACE_RULES.md](./MARKETPLACE_RULES.md) | Inventory reservation, first-reservation wins, seller rules |
| [DASHBOARDS_ANALYTICS.md](./DASHBOARDS_ANALYTICS.md) | Admin, barber, client dashboard metrics |
| [COMPETITIVE_LANDSCAPE.md](./COMPETITIVE_LANDSCAPE.md) | Country market scores and tier strategy (reference) |
| [PHASED_ROLLOUT.md](./PHASED_ROLLOUT.md) | Phase 1 / 2 / 3 implementation scope |
| [DOMAIN_ARCHITECTURE.md](./DOMAIN_ARCHITECTURE.md) | Modular engines + immutable event ledger |

---

## Phase map

| Phase | Ships | Spec |
|-------|-------|------|
| **1** | Ledger types, wallet health, tiered deposits, price lock, chairs, QR, waitlist, marketplace holds, public stats | This index + BOOKING + FINANCIAL |
| **2** | Client reputation, barber trust, reliability index, championships, dynamic deposits, dashboards | REPUTATION + CHAMPIONSHIPS + DASHBOARDS |
| **3** | Multi-shop RBAC, tax exports, gift cards, financing | PHASED_ROLLOUT |

---

## Founder decisions (summary)

See [BOOKING_OPERATIONS.md](./BOOKING_OPERATIONS.md) and [FINANCIAL_ECOSYSTEM.md](./FINANCIAL_ECOSYSTEM.md) for full detail.

- **Capacity:** One booking per slot per chair/worker on-platform; barber configures chairs in dashboard.
- **Waiting list:** Ordered queue; 15-minute accept window; cascade on decline/expiry.
- **Marketplace:** First reservation wins.
- **Price lock:** `price_at_booking` enforced at create; no post-confirm price changes.
- **QR check-in:** Unique token per booking; barber scan records timestamp + optional GPS.
- **Public stats:** Completion rate, completed count, repeat rate, tenure, badges.
- **Deposits:** Tiered minimum by service price; barber may increase, never decrease below platform minimum.
- **Wallet Health:** Internal tiers (Excellent → Blocked); block cash bookings at Blocked (-€20).
- **Vacation/emergency:** Barber must disable calendar; admins may emergency-cancel/override.

---

## Implementation code map

| Domain | Server path |
|--------|-------------|
| Ledger types | `server/src/domain/ledger/` |
| Deposits | `server/src/domain/deposits/` |
| Wallet health | `server/src/domain/wallet/` |
| Price lock / QR | `server/src/domain/booking/` |
| Chairs | `server/src/domain/capacity/` |
| Waitlist | `server/src/domain/waitlist/` |
| Marketplace holds | `server/src/domain/marketplace/reservations.ts` |

---

## Related existing docs

- [`CANCELLATION_REFUND_SPECIFICATION.md`](../CANCELLATION_REFUND_SPECIFICATION.md)
- [`BOOKING_FLOWS.md`](../BOOKING_FLOWS.md)
- [`GTM_PRICING.md`](../GTM_PRICING.md)
- [`TAX_COMPLIANCE_GREECE.md`](../TAX_COMPLIANCE_GREECE.md)
