# Financial Ecosystem

## Wallet model

```
Wallet → Credits → Negative balance → Subscription
         ↓
    Wallet Health (internal)
```

### Credits

| Rule | Value |
|------|-------|
| Base conversion | **€1 = 1 credit** (default) |
| Promotional vs paid | Tracked separately on provider wallet; **promotional consumed first** |
| Paid refund | Phase 2 policy — manual admin + Stripe where applicable |
| Promo expiry | Configurable per campaign; default 12 months for platform promos |

### Wallet Health (internal — not shown to clients)

| Status | Balance threshold |
|--------|-------------------|
| Excellent | ≥ €250 |
| Good | ≥ €50 |
| Warning | ≥ €10 |
| Critical | ≥ -€10 |
| Blocked | < -€20 |

**Actions:**
- **Blocked:** No new cash-at-store bookings; existing confirmed bookings honored; top-up required.
- **Critical/Warning:** Dashboard alerts; optional email nudge.

Implementation: `server/src/domain/wallet/health.ts`

---

## Ledger transaction types (reserved)

All financial events append to `ledger_entries`. Types:

1. `recharge`
2. `promotional_credit`
3. `referral_bonus`
4. `cashback`
5. `marketplace_reward`
6. `subscription_payment`
7. `commission`
8. `cancellation_penalty`
9. `deposit_lock`
10. `deposit_release`
11. `deposit_forfeit`
12. `championship_reward`
13. `manual_adjustment`
14. `refund`
15. `withdrawal`
16. `chargeback`
17. `loyalty_bonus`
18. `compensation`
19. `goodwill_credit`
20. `tax_adjustment`
21. `future_financing` (reserved)
22. `future_gift_card` (reserved)
23. `future_tip` (reserved)
24. `future_insurance_reward` (reserved)

Existing provider types mapped: `top_up`, `platform_fee`, `fee_refund`, `penalty`.  
Existing client types mapped: `referral_credit`.

---

## Deposit tiers (platform minimum)

| Service price | Minimum deposit |
|---------------|-----------------|
| €0–29 | €10 |
| €30–49 | €15 |
| €50–99 | €25 |
| €100–199 | €50 |
| €200–399 | €100 |
| €400+ | 30% of service price |

Barbers may set deposit **above** platform minimum; never below.

Implementation: `server/src/domain/deposits/tiers.ts`

---

## Barber wallet (negative balance)

| Question | Decision |
|----------|----------|
| Continue receiving bookings when negative? | Yes until **Blocked** (-€20) for cash bookings; online bookings follow payment protection |
| Block threshold | **Blocked** at balance < -€20 |
| Auto top-up | Phase 2 — Stripe auto-recharge optional |

---

## Source of truth

- **Balances:** `provider_fee_wallets.balance`, `wallet_accounts.balance` (cached)
- **Audit:** `ledger_entries` + `provider_fee_transactions` / `wallet_transactions` (immutable append)
- **Reconciliation:** Nightly job compares sum(transactions) vs balance (Phase 2)
