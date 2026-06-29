# Championships

**Phase 2 implementation** — distinct from weekly tombola (`server/src/tombola/`).

---

## Ranking formula (100% total)

| Criterion | Weight |
|-----------|--------|
| Average reviews | 30% |
| Confirmed bookings | 25% |
| Revenue generated (country-normalized) | 20% |
| Repeat clients | 10% |
| Cancellation rate (inverse) | 7% |
| Response time | 3% |
| Profile completeness | 2% |
| Account seniority | 2% |
| Verified business information | 1% |

Revenue normalized within country so premium/low-volume markets compete fairly.

---

## Seasons

- Duration: **6 months** (Spring, Summer, Autumn, Winter)
- Winners enter **Hall of Fame** permanently
- Badges displayed on public profile

---

## Eligibility

- Barber Trust Score above threshold
- No open fraud disputes
- Wallet not Blocked

Implementation: `championship_seasons`, `championship_scores` tables (Phase 2).
