# Architecture: Desktop-first web platform

This document states the **non-negotiable** product and UX architecture for this codebase.

## Core principle

**This is a desktop web platform (SaaS / marketplace / dashboard) that adapts responsively to other devices.**

- It is **not** a mobile app that happens to run on desktop.
- **Desktop (PC / laptop, ≥ 1024px) is the primary experience.**
- Mobile and tablet are **adaptations**, not the base design.

When the application is used on a PC:

- It must feel like a **full web platform**.
- It must **not** feel like a mobile app stretched to desktop.

All current and future features, pages, components, and layouts must respect this principle.

## Desktop behavior (mandatory)

**On desktop (≥ 1024px):**

- Wide layouts (use available horizontal space).
- Multi-column grids where appropriate.
- Sidebar navigation or full top navigation.
- Information-dense UI suitable for mouse and keyboard.
- Platform-style UX (Shopify, Stripe, Linear, Notion).

**Not allowed on desktop:**

- Bottom tab navigation.
- Floating “+” mobile action buttons as primary navigation.
- Single-column-only layouts when content could use multiple columns.
- Touch-first spacing everywhere.
- Artificial max-width constraints that mimic mobile.

## Responsive behavior

- **Responsive** means the **structure** changes at breakpoints, not just font size or padding.
- Desktop, tablet, and mobile each have intentionally designed layouts.

**Breakpoints:**

| Segment        | Width           |
|----------------|-----------------|
| Mobile         | &lt; 768px       |
| Tablet         | 768px – 1023px  |
| Desktop        | ≥ 1024px        |
| Large desktop  | ≥ 1440px        |

Desktop layouts must continue to improve past 1024px (e.g. scale to max-w-7xl or full width), not freeze at a narrow width.

## Development order

For every new task:

1. **Start with desktop layout first.**
2. Then adapt for tablet.
3. Then adapt for mobile.

If a component is mobile-specific (e.g. bottom nav, FAB):

- It must be **conditionally rendered** (e.g. hidden on desktop).
- It must **not** appear on desktop.

## Self-check before completing any task

- “Does this feel like a real web platform on PC?”
- “Would a SaaS user be comfortable using this all day on desktop?”
- “Is this optimized for mouse, keyboard, and large screens?”

If the answer is no → revise.

## Implementation reference

- **Cursor rule** (always applied): `.cursor/rules/desktop-first-web-platform.mdc`
- **Layout and breakpoints**: `docs/RESPONSIVE_LAYOUT.md`
- **Hook**: `useIsDesktop()` from `@/hooks/useMediaQuery` for conditional desktop vs mobile UI

## Acknowledgment

**This is a desktop-first web platform with responsive adaptations.** All future implementations must comply with this rule.
