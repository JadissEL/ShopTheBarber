# Add a new API route

Add a new server route and keep business logic in the logic layer.

1. **Choose the domain** (e.g. `auth`, `payments`, `admin`, `provider`) and create or extend the route file under `server/src/<domain>/`.
2. **Keep handlers thin**: Parse request, call a function from `server/src/logic/`, return response. Do not put business logic in the route handler.
3. **Wire the route** in `server/src/index.ts` (or the main app file) so the new route is registered.
4. **Document** any new query/body params or response shape if the API is used by the frontend or external clients.

If the user specified a method, path, or behavior, use that. Otherwise propose a clear path and method (GET/POST/etc.).
