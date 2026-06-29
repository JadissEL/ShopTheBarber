# Feature modules

ShopTheBarber groups ~100 pages into **feature modules** so navigation and routes stay manageable. The registry lives in `src/lib/featureRegistry.js`.

## Modules

| Module | Env variable | Default |
|--------|--------------|---------|
| Core (booking, explore, account) | — | always on |
| Marketplace | `VITE_FEATURE_MARKETPLACE` | enabled |
| Careers | `VITE_FEATURE_CAREERS` | enabled |
| Content & inspiration | `VITE_FEATURE_CONTENT` | enabled |
| Engagement (loyalty, tombola, referrals) | `VITE_FEATURE_ENGAGEMENT` | enabled |
| Messaging | `VITE_FEATURE_MESSAGING` | enabled |
| Programs & events | `VITE_FEATURE_PROGRAMS` | enabled |
| Shop operations | `VITE_FEATURE_SHOP_OPS` | enabled |
| Admin platform tools | — | always on |

Set a variable to `false` in `.env.local` or Vercel to disable that module for a build.

## What gets gated

When a module is disabled:

1. **Navigation** — client sidebar, provider/admin grouped sidebars, public navbar, mobile More sheet, and `NAV_MENUS` omit those links.
2. **Routes** — `FeatureGuard` redirects deep links to Home with a toast (routes stay registered for simpler deploys).

### Marketplace legal (when module is on)

Retail sales require documented seller/buyer terms, VAT display, and shipping liability. Canonical doc: **[docs/MARKETPLACE_LEGAL.md](MARKETPLACE_LEGAL.md)**.

| Page | Path |
|------|------|
| Seller terms | `/marketplace/seller-terms` |
| Buyer terms | `/marketplace/buyer-terms` |

Env: `MARKETPLACE_VAT_RATE` (server, default `0.24`) · `VITE_MARKETPLACE_VAT_RATE` (client checkout display).

Disable module: `VITE_FEATURE_MARKETPLACE=false` — terms pages remain for historical orders.

## Admin UI

**Admin → System → Feature modules** (`AdminFeatureToggles`) shows a read-only view from the registry. Runtime toggles are not implemented; change env vars and redeploy the frontend.

## Tests

```bash
npm run test -- src/lib/featureRegistry.test.js
```

## Adding a new page

1. Add the PascalCase page name to the correct module’s `pages` array in `featureRegistry.js`.
2. If it needs a nav link, add it to the relevant `*_NAV_*` config in the same file.
3. Extend tests if the page introduces new gating behavior.
