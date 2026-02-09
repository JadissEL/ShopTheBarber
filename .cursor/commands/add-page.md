# Add a new page

Scaffold a new page in this project and wire it into routing.

1. **Create the page component** in `src/pages/<Name>.jsx` using PascalCase (e.g. `BookingHistory.jsx`).
2. **Follow PROJECT_SCHEMA.md**: One component per file; use existing layout and UI primitives from `src/components/`.
3. **Register the route** in the app router (e.g. `App.jsx` or wherever routes are defined) and add to `pages.config.js` if this project uses it.
4. **Add navigation** if the page should appear in the nav: update the navigation config or sidebar in `src/components/layout/` or `src/components/navigation/`.

If the user specified a page name or path, use that. Otherwise propose a sensible name and path.
