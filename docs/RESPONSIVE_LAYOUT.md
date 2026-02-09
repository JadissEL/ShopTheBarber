# Responsive Layout Architecture

## Desktop-first principle (non-negotiable)

This project is a **web platform first**, not a mobile app that runs on desktop.

- **Primary experience**: Desktop (≥ 1024px). The app must feel like a full SaaS/marketplace/dashboard on PC (e.g. Shopify, Stripe, Linear).
- **Adaptations**: Mobile and tablet are responsive adaptations; they must not define the base design.
- **Rule**: On desktop, never use bottom tab nav, mobile-only FABs, or single-column-only layouts when multi-column is appropriate. Use sidebar or top nav, wide content, and information-dense UI. See `.cursor/rules/desktop-first-web-platform.mdc` for the full rule.

## Breakpoints (Tailwind defaults)

| Breakpoint | Min width | Usage |
|------------|-----------|--------|
| (default) | 0px | Mobile-first base |
| `sm` | 640px | Small devices |
| `md` | 768px | Tablets |
| **`lg`** | **1024px** | **Desktop** (primary breakpoint for layout changes) |
| `xl` | 1280px | Large desktop |
| `2xl` | 1536px | Extra large |

## Client zone (authenticated customer app)

### Desktop (≥ 1024px)

- **Layout**: `ClientLayout` provides a persistent **sidebar** (`ClientDesktopSidebar`) and main content area.
- **Navigation**: Sidebar only. Top `GlobalNavigation` is hidden for client zone on desktop to avoid duplication.
- **No bottom nav**: `ClientBottomNav` returns `null` when `useIsDesktop()` is true.
- **No floating “Book” FAB** in the main area (the sidebar has a “Book appointment” button).
- **Content width**: Pages use `max-w-7xl` (or `lg:max-w-7xl`) and `lg:px-8` so content scales up to ~1280px+.
- **Padding**: `pb-24 lg:pb-8` so mobile keeps space for bottom nav; desktop does not.

### Mobile / tablet (< 1024px)

- **Layout**: Main content only (no persistent sidebar).
- **Navigation**: `ClientBottomNav` (bottom tab bar) + optional hamburger menu opening `SidebarMenu` (e.g. Dashboard).
- **Floating “Book”**: Central “+” in bottom nav links to booking flow.
- **Content**: Single-column; containers use `max-w-lg` or similar where appropriate.

## Provider / admin zones

- No `ClientLayout`. Standard top `GlobalNavigation` + main content.
- Background and layout unchanged (dark theme for provider/admin).

## Public zone (landing, Explore, About, etc.)

- `PublicLayout`: top `Navbar` (with desktop nav at `lg`), main, `Footer`.
- Pages that render `ClientBottomNav` (e.g. Explore) hide it on desktop via `useIsDesktop()` inside `ClientBottomNav`.

## Key files

- `src/hooks/useMediaQuery.js` – `useMediaQuery(query)`, `useIsDesktop()` (uses `(min-width: 1024px)`).
- `src/components/layout/ClientLayout.jsx` – Wraps client zone content; desktop = sidebar + main.
- `src/components/layout/ClientDesktopSidebar.jsx` – Sidebar nav (Home, Bookings, Marketplace, Chat, Profile, Book CTA).
- `src/components/dashboard/ClientBottomNav.jsx` – Renders only when `!useIsDesktop()`.
- `src/Layout.jsx` – Uses `ClientLayout` when `zone === APP_ZONES.CLIENT`.
- `src/components/layout/AppLayout.jsx` – Light background for client zone, dark for provider/admin.

## Quality checks

- Desktop (≥ 1024px) does not show bottom tab bar or mobile-only FAB in client area.
- Desktop client uses sidebar + full-width-friendly content (up to `max-w-7xl`).
- Mobile behavior (bottom nav, single column, touch-friendly) is unchanged.
- Layout structure (sidebar vs. top nav) changes at `lg`, not only spacing.
