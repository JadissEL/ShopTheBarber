# UI copy consistency checklist

Normalize visible copy so Playwright `getByRole('heading', { name })` assertions match production UI.

**Rule:** Page `<h1>` (via `PageHeader`) should match `MetaTags title` (before the `|` suffix) unless intentionally different for SEO.

---

## Canonical headings (journey personas)

| Page | Route | Canonical `<h1>` | MetaTags title |
|------|-------|-------------------|----------------|
| Client bookings | `/UserBookings` | **My Bookings** | My Bookings |
| Client wallet | `/ClientWallet` | Wallet | Wallet |
| Shopping bag | `/ShoppingBag` | Shopping Bag | Shopping Bag |
| Seller dashboard | `/SellerDashboard` | Sales overview | Sales overview |
| Company dashboard | `/CompanyDashboard` | Company hub | Company hub |
| Blogger dashboard | `/BloggerDashboard` | Creator studio | Creator studio |
| Admin disputes | `/AdminDisputes` | Dispute resolution | Dispute resolution |
| Seller settings | `/SellerSettings` | Settings | Settings |
| Provider payouts | `/ProviderPayouts` | Payouts | Payouts |

---

## RS4 fixes applied

- [x] `UserBookings.jsx` — `My bookings` → **My Bookings** (h1 + MetaTags aligned)

---

## Review checklist (before merging UI changes)

- [ ] New page uses `PageHeader` with explicit `title` prop
- [ ] `MetaTags title` matches h1 (or document intentional divergence)
- [ ] Sentence case for subtitles; title case for primary h1 on app-tier pages
- [ ] E2E journey updated if heading changes
- [ ] No duplicate h1 on same route

---

## E2E assertion pattern

Prefer role-based queries matching canonical copy:

```ts
await expect(page.getByRole('heading', { name: 'My Bookings', level: 1 })).toBeVisible();
```

Use case-insensitive regex only when copy is intentionally variable.

---

*Release Stabilization RS4 — 2026-07-09*
