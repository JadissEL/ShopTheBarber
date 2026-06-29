# Ideal Customer Profiles (ICP)

**Status:** Accepted 2026-06-26 · **Landing pages:** `/for-barbers`, `/for-shops`, `/for-networks`

ShopTheBarber serves three distinct buyer personas. Each has a dedicated landing page and onboarding path. Consumer clients are out of scope for this doc.

---

## 1. Solo barber (ICP-A)

| Field | Detail |
|-------|--------|
| **Who** | Independent barber, 1 chair, often booth rental or home studio |
| **Job to be done** | Fill calendar, stop no-shows, get paid without marketplace commission on existing clients |
| **Pain** | DM chaos, double bookings, Booksy/Fresha commission on *their* clients |
| **Why us** | Flat fee per chair, **0% commission on direct/guest bookings**, reminders + card on file (Cutly-simple) |
| **Landing** | `/for-barbers` → Sign up `?type=barber` |
| **Success metric** | Direct booking link live in 48h; ≥1 prevented no-show in 30 days |

### Messaging hooks

- “Your chair. Your clients. No commission on your regulars.”
- “One prevented no-show pays for the month.”

---

## 2. Shop owner (ICP-B)

| Field | Detail |
|-------|--------|
| **Who** | Owner or manager of 1–3 location barbershop, 2–8 chairs |
| **Job to be done** | Coordinate team, reduce front-desk friction, optional retail |
| **Pain** | Per-barber calendars, commission on walk-in regulars, separate retail stack |
| **Why us** | **Flat fee per location** (+ optional per-chair add-on), team roster, shop profile, marketplace shelf |
| **Landing** | `/for-shops` → Sign up `?type=shop` |
| **Success metric** | All active barbers on one schedule; shop direct link on Google/Instagram |

### Messaging hooks

- “Run the floor, not five different apps.”
- “Per location pricing — not a cut of every fade.”

---

## 3. Network / franchise admin (ICP-C)

| Field | Detail |
|-------|--------|
| **Who** | Multi-location operator, franchise HQ, school chain ops lead |
| **Job to be done** | Roll out consistently, see network KPIs, run targeted promos |
| **Pain** | Fragmented reporting, cannot pilot safely before national spend |
| **Why us** | Admin financials, provider insights, promo targeting, **city pilot playbook** |
| **Landing** | `/for-networks` → `/pilot` application |
| **Success metric** | 5–10 locations live in one city with weekly HQ dashboard review |

### Messaging hooks

- “One network. Many locations. One source of truth.”
- “Prove ROI in one city before national marketing.”

---

## Anti-ICP (who we defer)

- Enterprise salon chains needing custom ERP integrations (phase 2+)
- Pure consumer bargain hunters with no provider relationship (marketplace-only, low LTV)
- Shops that refuse any online payment or deposits (poor fit for no-show ROI story)

---

## Cross-ICP pricing reference

See [GTM pricing](./GTM_PRICING.md) and live page `/pricing`.

| Persona | Primary plan |
|---------|----------------|
| Solo barber | €79/mo per chair (default) |
| Shop owner | €149/mo per location + €29/chair add-on (pilot) |
| Network admin | Custom pilot / volume (contact) |

**Direct bookings:** 0% platform commission (with active flat plan).  
**Discovery bookings:** Optional fee — planned, opt-in later.

---

## Internal alignment

- **Product:** Onboarding wizard, payment protection, fixed-fee module support all three ICPs.
- **Marketing:** Lead with ICP-A and ICP-B in pilot city; ICP-C via outbound + `/pilot`.
- **Sales:** No national paid ads until one city hits density (see PILOT_PROGRAM.md).
