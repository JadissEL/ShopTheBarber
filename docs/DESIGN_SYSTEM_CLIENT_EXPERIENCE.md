# ShopTheBarber — Unified Design System & Client Experience

> **Living spec:** See `src/lib/stbUi.js` and `src/index.css` for the current Complete Visual System v2 tokens. This document is retained for journey/UX reference; hex values below may be outdated.

**Purpose**: One coherent visual language and UX for the entire client journey. Light mode only.

---

## 1. Design tokens (CSS variables)

Defined in `src/index.css`. All UI must use semantic Tailwind classes.

| Token | Hex | Usage |
|-------|-----|--------|
| `--background` | `#FFFFFF` | Page backgrounds |
| `--muted` | `#F6F7F9` | Soft sections, hover surfaces |
| `--card` | `#FFFFFF` | Cards on soft bg; panels use `stb-surface-card` (#EEF1F5) |
| `--border` | `#E3E7EE` | Borders, dividers |
| `--foreground` | `#101828` | Primary text |
| `--muted-foreground` | `#667085` | Secondary text |
| `--primary` | `#FF6A3D` | Primary CTA (orange) — buttons, links, active nav |
| `--success` | `#2ED3C6` | Success / selected slots / active states |
| `--vip` | `#7C4DFF` | VIP barber badges only |
| `--salmon` | `#FF8A7A` | Onboarding soft surfaces |
| `--highlight` | `#FFD166` | Micro highlights only |
| `--radius` | `13px` | Buttons, cards, inputs |

**Usage**: `bg-background`, `bg-primary`, `text-muted-foreground`, `border-border`, `bg-success`, `text-vip`, `rounded-[13px]`.

**Accent rules**: Orange = CTAs. Purple = VIP only. Turquoise = success/selection. Yellow = micro highlights.

---

## 2. Component patterns

- **Buttons**: Primary orange, secondary neutral border, ghost minimal. Radius 13px.
- **Cards**: White on soft page bg; `stb-card-lift` for hover. Border `#E3E7EE`.
- **Nav active**: `stb-nav-active` — `bg-primary/10 text-primary`.
- **Booking steps**: `stb-step-active`, `stb-step-done`, `stb-slot-selected`.

---

## 3. File reference

| Area | Files |
|------|--------|
| Tokens | `src/index.css`, `tailwind.config.js` |
| Primitives | `src/components/ui/button.jsx`, `card.jsx`, `dialog.jsx` |
| Nav helper | `src/lib/navActive.js` |
| Layouts | `src/components/layout/*`, `GlobalNavigation.jsx` |

---

## 4. Deprecated

- `src/globals.css` — do not import; use `index.css`.
