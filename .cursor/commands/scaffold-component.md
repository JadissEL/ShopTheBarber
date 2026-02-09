# Scaffold a new component

Create a new React component in the correct folder per PROJECT_SCHEMA.md.

1. **Choose location**:
   - **Primitive / reusable UI** → `src/components/ui/<ComponentName>.jsx`
   - **Feature-specific** → `src/components/<feature-folder>/<ComponentName>.jsx` (e.g. `dashboard/`, `home/`, `provider-setup/`)
2. **Create the file** with PascalCase name. Use existing UI primitives (e.g. from `src/components/ui/`) and follow the project's patterns (e.g. Tailwind, Radix).
3. **Export** the component. Add an `index.js` re-export in the folder if the project uses that pattern.
4. **Keep it minimal**: Props interface, no business logic in the first version unless the user asked for it.

If the user specified a name or feature area, use that. Otherwise propose a name and folder based on context.
