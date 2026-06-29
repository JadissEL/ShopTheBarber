# Mistakes and learnings

**Append-only.** What went wrong, root cause, fix, and any new rule to prevent recurrence.

## Template

```markdown
### YYYY-MM-DD — Short label

- **What went wrong:** …
- **Why:** …
- **Correction:** …
- **New rule:** …
```

---

### 2026-06-26 — Clerk pk/sk mismatch blocked login
- **What went wrong:** `.env.local` used `distinct-eel-9` publishable key while `server/.env` had no secret (or a different Clerk app).
- **Root cause:** Frontend and backend must use keys from the **same** Clerk application.
- **Fix:** Aligned both to ShopTheBarber keys documented in `VERCEL_DEPLOYMENT_GUIDE.md` / Render production env.
- **Rule going forward:** After changing `VITE_CLERK_PUBLISHABLE_KEY`, always set matching `CLERK_SECRET_KEY` from the same Clerk Dashboard app.

### 2026-06-26 — Auth sync loop caused SetupGuide hang
- **What went wrong:** `runBackendSync` depended on full `clerkUser` object; Clerk re-renders changed reference → endless `/api/auth/me` calls and `syncStatus` flipping back to `syncing`.
- **Fix:** Sync once per `clerkUser.id` via ref; use `authUser` directly in onboarding (no duplicate `currentUser` query); 15s fetch timeout on `/auth/me`.
- **Rule going forward:** Never put unstable Clerk hook objects in `useCallback` deps — use stable ids only.
