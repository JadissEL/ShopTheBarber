# Marketplace Legal — Seller Terms, VAT & Shipping

**Status:** Active when `VITE_FEATURE_MARKETPLACE` is enabled (default: on)  
**Last updated:** 2026-06-26  
**Public pages:** `/marketplace/seller-terms`, `/marketplace/buyer-terms`

---

## Scope

This document governs **physical product sales** on ShopTheBarber (grooming retail), distinct from **service bookings**. If the marketplace module is disabled via env, these obligations apply only to historical orders.

---

## Roles

| Role | Responsibility |
|------|----------------|
| **Seller** (barber, shop, approved brand) | Merchant of record for their SKUs — listing accuracy, VAT, fulfillment, returns |
| **Buyer** (customer) | Payment, accurate address, consumer rights per jurisdiction |
| **Platform** (ShopTheBarber) | Technology, checkout, payment facilitation, optional default shipping math — **not** seller of record for third-party products |

---

## Seller terms (summary)

Full text: **`/marketplace/seller-terms`**

Sellers agree to:

1. **Accurate listings** — price, stock, images, category, ingredients/restrictions where required  
2. **VAT compliance** — list VAT-inclusive prices for B2C in Greece when registered; maintain AFM/VAT ID  
3. **Fulfillment** — ship within `processing_days` on seller shipping profile; provide tracking when available  
4. **Returns** — publish a return policy; honor statutory consumer withdrawal where applicable  
5. **Prohibited goods** — no counterfeit, unsafe, or non-grooming unrelated items  
6. **Platform fee** — any marketplace commission or rev-share per separate commercial agreement  
7. **Acceptance** — required at product submit (`seller_terms_accepted: true`, version `2026-06-26`)

Provider service terms (`ProviderTermsOfService`) still apply; marketplace terms **add** retail obligations.

---

## VAT (Greece focus)

| Item | Policy |
|------|--------|
| **Standard rate** | 24% on physical grooming goods (see [TAX_COMPLIANCE_GREECE.md](./TAX_COMPLIANCE_GREECE.md)) |
| **Checkout display** | Estimated VAT line — config `MARKETPLACE_VAT_RATE` (server) / `VITE_MARKETPLACE_VAT_RATE` (client), default **0.24** |
| **List prices** | Sellers should set **VAT-inclusive** consumer prices when VAT-registered |
| **Threshold** | €30,000 annual turnover → VAT registration (seller obligation) |
| **Invoicing** | Sellers issue compliant receipts/invoices for their sales; platform provides order records |

Checkout tax is an **estimate** for display and Stripe line items; sellers remain responsible for filing.

---

## Shipping liability

| Stage | Liable party | Notes |
|-------|--------------|-------|
| Listing & packing | **Seller** | Correct SKU, condition, packaging |
| Platform default shipping fee | **Platform config** | `PLATFORM_FREE_SHIPPING_MIN` / `PLATFORM_FLAT_SHIPPING` — seller may override via shipping profile |
| Dispatch & carrier | **Seller** (contract with carrier) | Until carrier scan / proof of pickup |
| In transit loss/damage | **Carrier / insurance** | Seller should use tracked shipping; claims per carrier policy |
| Wrong address (buyer error) | **Buyer** | Reshipment at buyer cost unless seller policy says otherwise |
| Non-delivery dispute | **Seller first**, platform mediates | 7-day buyer report window recommended |
| Returns & refunds | **Seller policy** + consumer law | Platform may facilitate payment reversal via Stripe |

**Seller shipping profile** (`seller_shipping_profiles`): ship-from address, processing days, free-shipping threshold, flat rate, return policy — shown to buyers.

---

## Buyer terms (summary)

Full text: **`/marketplace/buyer-terms`**

Buyers acknowledge:

- Products are sold by named sellers, not ShopTheBarber directly (except `seller_type: platform` SKUs)  
- Estimated VAT and shipping at checkout  
- Seller return policy applies  
- Checkout requires acceptance of buyer marketplace terms  

Also see customer **Terms of Service** § Marketplace purchases.

---

## Feature flag

```bash
# Disable marketplace module (nav, guards, new orders)
VITE_FEATURE_MARKETPLACE=false
```

When off: hide marketplace nav/routes via `FeatureGuard`; legal terms remain available for past orders and admin.

---

## Implementation map

| Area | Location |
|------|----------|
| Seller terms page | `src/pages/MarketplaceSellerTerms.jsx` |
| Buyer terms page | `src/pages/MarketplaceBuyerTerms.jsx` |
| Shared client constants | `src/lib/marketplaceLegal.js` |
| Server VAT + submit gate | `server/src/marketplace/legalConfig.ts` |
| Checkout legal UI | `src/pages/Checkout.jsx` |
| Seller accept on submit | `MarketplaceProductEditor.jsx`, `POST /api/products/:id/submit` |
| Shipping liability copy | `SellerShippingProfile.jsx` |
| API config | `GET /api/marketplace/legal-config` |

---

## Related

- [TAX_COMPLIANCE_GREECE.md](./TAX_COMPLIANCE_GREECE.md)  
- [FEATURE_MODULES.md](./FEATURE_MODULES.md)  
- [CANCELLATION_REFUND_SPECIFICATION.md](./CANCELLATION_REFUND_SPECIFICATION.md)  
