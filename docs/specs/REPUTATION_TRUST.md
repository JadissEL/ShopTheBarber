# Reputation & Trust

**Phase 2 implementation** — spec locked; code in `server/src/domain/reputation/` (future).

---

## Client reputation score

### Point events

| Action | Points |
|--------|--------|
| Complete booking | +5 |
| Marketplace purchase < €20 | +1 |
| Marketplace €20–100 | +3 |
| Marketplace > €100 | +5 |
| Verified review | +2 |
| Review marked helpful | +1 |
| Verified email | +3 |
| Verified phone | +5 |
| Verified ID | +20 |
| Complete profile | +10 |
| Birthday verified | +2 |
| Refer client (success) | +15 |
| Refer barber (success) | +30 |
| Invite professional | +30 |
| First purchase after referral | +10 |
| Every €100 spent | +2 |
| Every year on platform | +5 |
| Late cancellation | -5 |
| No-show | -20 |
| False dispute | -30 |
| Fraud attempt | -100 + suspension |
| One inactive month | -1 |

### Levels

| Level | Score |
|-------|-------|
| New | 0 |
| Bronze | 50 |
| Silver | 200 |
| Gold | 500 |
| Platinum | 1000 |
| Diamond | 2500 |
| Legend | 5000 |

Unlocks: lower deposits, discounts, beta features, exclusive products (Phase 2).

---

## Reliability Index (internal, 0–100 base)

Starting score: **100**

| Event | Delta |
|-------|-------|
| Late cancellation | -5 |
| No-show | -15 |
| Dispute lost | -20 |
| Fast response | +2 |
| Many successful appointments | +5 |
| Long membership | +3 |

Powers: dynamic deposits, fraud risk, priority support (Phase 2).

---

## Barber Trust Score (internal)

Factors: tenure, cancellation rate, disputes, chargebacks, confirmation speed, refund frequency, wallet behavior, retention, rule violations, KYC completeness.

Separate from public star rating.

---

## Barber Availability Score (public)

Based on: response time, cancel rate, schedule accuracy. Displayed on profile (Phase 2).

---

## Dynamic deposits (Phase 2)

High reputation → lower deposit (min platform floor).  
Poor history (no-shows) → up to 100% deposit.
