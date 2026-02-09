# Run full Journey & UX audit

Execute the **Journey & UX Auditor** workflow. Use the skill **journey-ux-auditor** for methodology and references.

## Workflow

1. **Load the journey map**
   - Read `.cursor/skills/journey-ux-auditor/references/journey-map.md` for zones and pages.
   - Optionally run `node .cursor/skills/journey-ux-auditor/scripts/list-routes-by-zone.js` from repo root to list routes by zone.

2. **Map and check**
   - **UX organization**: Confirm single source of truth for nav visibility (`navigationVisibility.js`), zone (`navigationConfig.jsx`), routes (`App.jsx`, `pages.config.js`). Flag duplicate or conflicting logic.
   - **User journey (CLIENT)**: Home/Explore → SignIn → Dashboard; Explore → Barber/Shop → BookingFlow → UserBookings; Favorites, Chat, Review, Loyalty, AccountSettings. Check links, guards, and no dead ends.
   - **Barber/shop journey (PROVIDER)**: SignIn (provider) → ProviderDashboard; ProviderBookings, ProviderPayouts, ProviderSettings, BarberProfile, ShopProfile. Check role guard and all provider links.
   - **Admin journey (ADMIN)**: Admin routes (AdminBackups, AdminDisputes, AdminUserModeration, GlobalFinancials, UserModerationDetail). Check admin-only guard and links.
   - **Discrepancies**: Redundant code (duplicate path/role checks), hardcoded paths that don’t match `pages.config.js`, duplicate flows or components.
   - **Old techniques**: Deprecated React patterns, inaccessible markup, brittle layout, duplicated styles.
   - **Broken workflows**: Booking flow guards and state; auth redirects by role; nav/back behavior; redirect loops.

3. **Report**
   - List all findings by journey (user / barber / shop / admin) and by category (UX org, guards, links, redundancy, old techniques, broken workflows).
   - For each: file/location, issue, suggested fix.

4. **Fix**
   - Apply fixes using modern, universal techniques (React 18+, semantic/accessible, Tailwind + tokens, single source of truth).
   - Preserve existing behavior unless the user asked for a change (per antigravity-system rule).
   - After changes: re-check the list above and confirm no regressions.

## Optional

- For a heavy, context-isolated run: invoke the **Journey Auditor** subagent (`.cursor/agents/journey-ux-auditor.md`) so the main chat stays clean.
- After UX/navigation changes, re-run this command to verify no regressions.
