# Project Schema — Preferred Project Structure

This document defines the **canonical structure** for **ShopTheBarber**. Use it as a template when adding features, onboarding, or scaffolding new code.

**Desktop-first**: This app is a web platform first (desktop ≥1024px primary; mobile/tablet are adaptations). All layouts and UI must respect this. See [docs/ARCHITECTURE_DESKTOP_FIRST.md](docs/ARCHITECTURE_DESKTOP_FIRST.md) and `.cursor/rules/desktop-first-web-platform.mdc`.

**Full-stack only**: Every feature must be complete end-to-end (frontend, UX, backend, database, system uniformity). No frontend-only or backend-only work. See [docs/ARCHITECTURE_FULL_STACK_UNIFIED.md](docs/ARCHITECTURE_FULL_STACK_UNIFIED.md) and `.cursor/rules/full-stack-unified-development.mdc`.

**Database (2026-06):** **Neon PostgreSQL + Prisma** only. Schema: `server/prisma/schema.prisma`. Migrations: `server/prisma/migrations/`. See [docs/NEON_PRISMA.md](docs/NEON_PRISMA.md). Legacy SQLite/Drizzle paths in older docs are obsolete.

---

## Root Layout

```
shop-the-barber/
├── public/                 # Static assets (served as-is)
├── server/                 # Backend API (Node + Fastify + Prisma + Neon)
├── src/                    # Frontend app (React + Vite)
├── docs/                   # Specifications, audits, and specs
├── index.html
├── package.json            # Frontend deps & scripts
├── vite.config.js
├── tailwind.config.js
├── components.json         # shadcn/ui config
├── jsconfig.json
├── eslint.config.js
├── postcss.config.js
├── .gitignore
└── README.md
```

---

## Frontend (`src/`)

### Directory Map

| Path | Purpose | Conventions |
|------|---------|-------------|
| `src/api/` | API client, entity helpers, integrations | One module per domain (e.g. `entities.js`, `integrations.js`) |
| `src/assets/` | Images, SVGs, static media | Reference via import or `public/` |
| `src/components/` | Reusable UI and feature components | See component layout below |
| `src/functions/` | Client-side helpers (e.g. email/booking logic) | Keep thin; real logic on server |
| `src/hooks/` | Custom React hooks | `use-*.jsx` or `use-*.ts` |
| `src/lib/` | App-wide utilities, context, routing helpers | Auth, query client, validations, layout |
| `src/pages/` | Route-level pages (one per route/screen) | PascalCase; map 1:1 to routes where possible |
| `src/utils/` | Pure helpers, formatters, constants | No React; easily testable |
| `src/App.jsx` | Root component and top-level routing | |
| `src/main.jsx` | Entry point | |
| `src/Layout.jsx` | Shared layout wrapper | |
| `src/pages.config.js` | Route/page configuration | |
| `*.css` | Global styles (e.g. `globals.css`, `App.css`, `index.css`) | |

### Component Layout (`src/components/`)

```
components/
├── ui/                     # Primitives (buttons, inputs, cards, etc.) — shadcn-style
├── layout/                 # AppLayout, Navbar, Footer, SidebarNav, PublicLayout
├── context/                # AuthContext, BookingContext
├── routing/                # RouteGuard
├── navigation/             # navigationVisibility, navigationConfig
├── seo/                    # MetaTags, SchemaMarkup
├── dashboard/              # Dashboard-specific (MetricCard, QuickActions, etc.)
├── home/                   # Landing (Hero, Features, Testimonials, CTA)
├── barber/                 # Barber flow (e.g. ServiceSelection)
├── provider-setup/         # Onboarding (ProfileSetup, ServiceSetup, AvailabilitySetup, …)
├── provider-settings/      # Settings (AvailabilityManager, …)
├── scheduling/             # ShiftForm, ShopHoursEditor, TimeOffManager, WeeklySchedule
├── dispute/                # DisputeCard, ResolutionActions
├── moderation/             # ModerationActions, UserModerationCard
├── loyalty/                # LoyaltyCard
├── promotions/             # PromotionList
├── notifications/          # NotificationCenter, RealTimeNotifications, notificationUtils
├── analytics/              # ExportUtils
├── admin/                  # Admin-only (e.g. BackupHealthDashboard)
├── dashboard/              # FeaturedServices, PersonalizedBarberPicks, etc.
├── hooks/                  # use-debounce, useFormValidation (component-level hooks)
├── schemas.jsx             # Form/validation schemas (e.g. Zod)
├── theme-provider.jsx
└── [shared components]    # QueryOptimizer, UserNotRegisteredError, etc.
```

**Rules:**

- **`ui/`** — Presentational primitives; minimal app logic.
- **Feature folders** (e.g. `dashboard/`, `provider-setup/`) — Group by feature or flow.
- **One component per file**; PascalCase filenames for components.
- **Contexts** in `context/`; **route guards** in `routing/`.

---

## Backend (`server/`)

### Directory Map

```
server/
├── prisma/
│   ├── schema.prisma       # Canonical DB schema (Neon PostgreSQL)
│   └── migrations/         # Versioned Prisma migrations
├── scripts/
│   ├── build-database.mjs  # Render build: generate + migrate deploy + verify
│   └── verify-production-schema.mjs
├── src/
│   ├── index.ts            # App entry, Fastify setup, route registration
│   ├── db/
│   │   ├── prisma.ts       # Prisma Client singleton
│   │   └── seed.ts         # Seed data (npm run seed)
│   ├── auth/               # Clerk auth (requestUser.ts, routes.ts)
│   ├── middleware/         # rateLimit, etc.
│   ├── logic/              # Domain logic (no HTTP)
│   │   ├── booking.ts
│   │   ├── review.ts
│   │   ├── email.ts
│   │   ├── promoCode.ts
│   │   └── moderation.ts
│   ├── admin/              # Admin-only API
│   ├── provider/           # Provider-facing API
│   ├── payments/           # Stripe routes
│   ├── webhooks/           # Stripe webhooks
│   └── <domain>/           # Feature modules (reviews, providerShowcase, …)
├── package.json
└── .env.example            # DATABASE_URL, CLERK_SECRET_KEY, …
```

**Rules:**

- **Routes** — Domain folders under `src/`; wire in `index.ts`.
- **Business logic** — In `logic/` or domain modules; keep HTTP handlers thin.
- **DB** — Edit `prisma/schema.prisma`; run `npx prisma migrate dev`; commit migration SQL.
- **Webhooks** — In `webhooks/` (e.g. Stripe).
- **Scripts** — In `scripts/`; run via `npm run` or `node`.

---

## Public Assets (`public/`)

```
public/
├── manifest.json           # PWA manifest
└── icons/
    ├── icon-144x144.png
    ├── icon-192x192.png
    └── icon-512x512.png
```

Use for favicons, PWA assets, and any URL-referenced static files.

---

## Documentation (`docs/`)

```
docs/
├── CANCELLATION_REFUND_SPECIFICATION.md
├── FORM_VALIDATION_AUDIT.md
├── PII_PROTECTION_SPECIFICATION.md
├── RATE_LIMIT_SPECIFICATION.md
├── TAX_COMPLIANCE_GREECE.md
└── validateBookingAvailability.test.md
```

- **Specifications** — Behavior, compliance, and contracts.
- **Audits** — Validation and security reviews.
- **Tests** — Scenario or acceptance docs (e.g. booking validation).

---

## Naming Conventions

| Kind | Convention | Example |
|------|------------|--------|
| React components | PascalCase | `BookingCard.jsx`, `ProviderDashboard.jsx` |
| Hooks | `use` + camelCase | `use-mobile.jsx`, `useFormValidation.ts.jsx` |
| Utilities / lib | camelCase | `utils.js`, `app-params.js` |
| API modules | camelCase | `apiClient.js`, `entities.js` |
| Server modules | camelCase | `booking.ts`, `rateLimit.ts` |
| Config files | lowercase + suffix | `pages.config.js`, `vite.config.js` |

---

## Where to Put New Code

| You're adding… | Put it here |
|----------------|-------------|
| New page/screen | `src/pages/` + route in router/config |
| New reusable UI piece | `src/components/ui/` or feature folder under `components/` |
| New API call/entity | `src/api/` (extend or add file) |
| New hook | `src/hooks/` or `src/components/hooks/` |
| New backend route | `server/src/<domain>/` (e.g. `auth/`, `admin/`) |
| New business rule | `server/src/logic/` |
| New DB table/column | `server/prisma/schema.prisma` + `npx prisma migrate dev` → commit under `server/prisma/migrations/` |
| New spec or audit | `docs/` |

---

## Tech Stack Summary

- **Frontend:** React 18, Vite 6, React Router, TanStack Query, Tailwind, Radix UI (shadcn-style), Zod, Clerk.
- **Backend:** Node 20+, Fastify, **Prisma Client**, **Neon PostgreSQL**, Clerk auth, Zod validation.
- **Payments:** Stripe Connect (including webhooks).
- **Deploy:** Vercel (frontend) + Render (API) — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

This schema is the single source of truth for the preferred project structure. When in doubt, match this layout and naming. For database commands, see [docs/NEON_PRISMA.md](docs/NEON_PRISMA.md) and [AGENTS.md](AGENTS.md).
