# Marketplace Rules

## Inventory conflict

**First reservation wins.**

1. Add to cart → create `marketplace_reservations` (TTL 30 min).
2. Available stock = `products.stock - sum(active reservations)`.
3. On payment success → convert reservation to order, decrement `products.stock`.
4. On expiry → release reservation.

---

## Price lock

Order line prices snapshot at checkout session creation (existing `order_items`).

---

## Seller without services

**TBD** — default: must have active barber or shop profile (Phase 3).

---

## Payment

Marketplace uses Stripe online payment (unlike in-chair service cash). Wallet integration Phase 3 (questionnaire M3).
