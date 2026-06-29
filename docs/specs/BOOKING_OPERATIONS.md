# Booking Operations

## Founder decisions

| Topic | Decision |
|-------|----------|
| Vacation / forgot to disable | Barber responsible; may receive poor ratings; **admins can emergency-cancel** and notify clients |
| Shop temporarily closed | Same as vacation — barber/owner disables availability |
| Hospitalized / emergency | Admin override + mass reschedule tool |
| Auto-confirm if barber silent | **2 hours** after booking request → auto-confirm |
| Platform capacity | **One booking per slot per chair/worker**; no double-book on-platform |
| External/walk-in bookings | Barber's risk; not platform-managed |
| Waiting list | **Yes** — see Waitlist workflow |
| Price after booking | **Locked** at `price_at_booking` |
| QR check-in | **Yes** — see QR flow |
| Public stats | **Yes** — see providerStats API |
| Booking buffer | Service duration + configurable cleaning buffer (default 0, barber sets) |

---

## Price lock

On `createBooking`:
1. Sum service prices at current catalog rates.
2. Store in `bookings.price_at_booking`.
3. Post-confirmation: price changes on catalog **do not** affect existing bookings.
4. Admin may adjust only via dispute/compensation flow (logged in ledger).

---

## QR check-in flow

```
Client books → confirmed → qr_check_in_token generated
Client arrives → barber scans QR (or enters token)
→ booking_check_ins row: scanned_at, scanned_by, lat/lng optional
→ proof of attendance for disputes
```

---

## Chair & capacity module

```
Shop
├── Chair 1 → Barber A (Mon–Fri)
├── Chair 2 → Barber B
└── Chair 3 → disabled
```

Rules (all **yes**):
- Employee may work multiple chairs (different times)
- Chair reassignment by day via `chair_assignments`
- Employee may work in multiple shops
- Owner may disable a chair (`is_active = false`)

Solo barber with no chairs configured: **1 implicit chair** (backward compatible).

Overlap validation: same `chair_id` + overlapping `[start, end + buffer]` → reject.

---

## Waitlist workflow

1. Client joins waitlist for a full slot (`waiting_list_entries.position`).
2. On cancellation → offer to position #1 via `waitlist_offers`.
3. Client has **15 minutes** to accept.
4. Accept → atomic booking creation.
5. Decline/expiry → offer to #2, repeat.

---

## Deposit integration

Tiered minimum from [FINANCIAL_ECOSYSTEM.md](./FINANCIAL_ECOSYSTEM.md) combined with barber `paymentProtection` policy — use **max(platform_minimum, barber_setting)**.

---

## Edge cases (policy stubs — Phase 2 detail)

| Code | Policy direction |
|------|----------------|
| B1 | Reschedule requires client accept; or barber cancels with full refund |
| B6 | Auto-confirm at 2h if pending |
| B7 | Prevented by chair overlap validation |
| B8 | Wallet Health — see FINANCIAL_ECOSYSTEM |
| C1–C3 | Late policy: 15min grace; 30min+ barber may mark no-show per payment protection |
| C8 | Reliability Index penalty + fraud review (Phase 2) |
| F7 | **Decided:** price locked at booking |
