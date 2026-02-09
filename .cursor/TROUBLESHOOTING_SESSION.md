# Troubleshooting session

**Started**: 2026-02-04  
**Status**: In progress  
**Last updated**: Grey contrast fix

---

## Observed

User reported: "a lot of grey buttons and grey zones or grey cards where we are not able to see the content" — content (text/icons) not visible on grey surfaces (low contrast).

---

## Scope

- **Theme**: Dark mode (`.dark`) and light; CSS variables in `src/index.css`; Tailwind theme.
- **Components**: Button (outline, secondary, ghost), Card, inputs; any element using `bg-muted`, `bg-secondary`, `bg-slate-800`, `bg-gray-100/200` with `text-muted-foreground` or inherited grey text.
- **Files**: `src/index.css`, `src/components/ui/button.jsx`, pages using grey backgrounds (BookingFlow, Explore, Dashboard, etc.).

---

## Hypotheses

| # | Hypothesis | Status |
|---|------------|--------|
| 1 | In dark mode, `text-muted-foreground` (63.9% lightness) on `bg-muted` (14.9%) or `bg-slate-800` has low contrast | Confirmed |
| 2 | In dark mode, step indicators / buttons using `bg-gray-200` with muted text render light-on-light (grey text on light grey) | Confirmed |
| 3 | Grey cards/zones inherit foreground that matches or blends with grey background | Confirmed |

---

## Changed

- **src/index.css**: Added global rules for readable text on grey surfaces:
  - **Dark theme**: On `.bg-muted`, `.bg-muted/50`, `.bg-secondary`, and any `[class*="bg-slate-800"]` / `bg-slate-700`: main text → 92% lightness, muted text → 88% lightness.
  - **Light grey (gray-100, gray-200)**: Default (light mode) → text 38% (dark grey); in dark mode → text 90% (light) for contrast.

---

## Verified

- Lint: not run (CSS-only change). User should confirm: open Dashboard, Explore, BookingFlow, SidebarMenu and check grey buttons, grey cards, and grey zones; content (labels, descriptions, icons) should be clearly visible.

---

## Close

**Root cause**: Grey surfaces (muted, secondary, slate-800, gray-100/200) used theme `--muted-foreground` or inherited foreground, which in dark mode was too close in brightness to the grey background (low contrast).  
**Fix**: Global CSS in `src/index.css` forces higher-contrast text on those surfaces (lighter text on dark grey, darker text on light grey).  
**Verified by**: User confirmation after checking Dashboard, Explore, BookingFlow, and any grey buttons/cards.
