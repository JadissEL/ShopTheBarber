# GTM Pricing Model

**Canonical public page:** `/pricing`  
**Live config API:** `GET /api/fixed-fee/config`

---

## Positioning

ShopTheBarber is **SaaS-first**, not marketplace-first:

| Principle | Policy |
|-----------|--------|
| Predictable cost | Flat monthly fee per **chair** (solo) or **location** (shop) |
| Direct relationships | **0% platform commission** on direct & guest bookings |
| Discovery (future) | Optional discovery fee for *new* clients from Explore — **not enabled yet** |
| No surprise tax | Providers opt in before any discovery fee ships |

This aligns with competitive positioning vs Booksy/Fresha (20–30% commission) and Cutly (simple booking + no-show focus).

---

## Default rates (EUR)

| Plan | Monthly | Notes |
|------|---------|--------|
| Solo barber | €79 | Per chair / independent profile |
| Shop location | €149 | Base location fee |
| Extra chair | €29 | Pilot add-on per additional chair at same address |
| Annual prepay | 30% off | Via fixed-fee checkout (Jan–Mar enrollment window in product) |

Amounts are stored in `pricing_rules` and exposed via `/api/fixed-fee/config`.

---

## Direct vs discovery

| Source | Commission | Status |
|--------|------------|--------|
| Provider link, QR, bio | 0% | Live (GTM + fixed-fee waiver path) |
| Returning client rebook | 0% | Live |
| Guest checkout (no account) | 0% | Live |
| Explore / marketplace discovery | TBD opt-in fee | **Planned** |

Code constant: `DISCOVERY_FEE_STATUS = 'planned'` in `src/lib/gtmPricing.js`.

---

## ROI narrative (Cutly framing)

**Headline:** “One prevented no-show pays for the month.”

Calculator on `/pricing` uses:

- Average service price (default €35)
- No-shows per month
- Monthly platform fee

Logic: `src/lib/gtmPricing.js` → `computeRoi()`.

---

## Related docs

- [ICP.md](./ICP.md) — who each plan serves
- [PILOT_PROGRAM.md](./PILOT_PROGRAM.md) — founding-city pricing lock
- [PARTNER_CHANNEL.md](./PARTNER_CHANNEL.md) — brand/school partnerships
