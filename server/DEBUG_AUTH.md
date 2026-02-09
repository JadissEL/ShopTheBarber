# Auth 500 — Debug Steps

## Root cause (fixed)

**If Sign In / Sign Up always returned 500:** The backend was **crashing on startup** before it could handle any request. The error was:

`Method 'GET' already declared for route '/api/shops'` (FST_ERR_DUPLICATED_ROUTE).

- **Cause:** `index.ts` registers generic entity routes including GET `/api/shops` for entity `shop`. `jobs/routes.ts` also registered GET `/api/shops`, causing a duplicate.
- **Fix:** Removed the duplicate GET `/api/shops` handler from `server/src/jobs/routes.ts`. The generic route in index.ts serves `/api/shops`.

After this fix, restart the backend; auth (login/register) should work.

---

## Before you start

- **Backend** must be running on port **3001** (from the `server` folder: `npm run dev`).
- **Frontend** runs on port **3000** and proxies `/api` to 3001.
- On startup the server logs `[DB] SQLite path: ...` — confirm that path exists and the file is there.

## STEP 1 — Locate the failing request

- **Sign In:** `POST /api/auth/login` (body: `{ "email", "password" }`)
- **Sign Up:** `POST /api/auth/register` (body: `{ "email", "password", "full_name", "role?" }`)
- Frontend uses `BASE_URL = '/api'`, so requests go to `http://localhost:3000/api/auth/...` and Vite proxies to `http://localhost:3001/api/auth/...`

## STEP 2 — Capture the exact error

1. **Start the backend** (in this folder):
   ```bash
   npm run dev
   ```
2. **Try Sign Up or Sign In** from the UI, or run:
   ```bash
   node scripts/test-auth-request.mjs
   ```
3. **Check the terminal where the server is running.** You will see either:
   - `REGISTER request` / `LOGIN request` (request received)
   - `REGISTER catch` or `LOGIN catch` with `message`, `code`, `stack` (exact error)
4. **Check the response body:** DevTools → Network → click the failed request → Response tab. The backend returns JSON with `error` and optional `hint`.

## STEP 3 — Common causes and fixes

| What you see in logs/response | Fix |
|-------------------------------|-----|
| `no such table: users` or `SQLITE_ERROR` | Run `npm run push` then `npm run seed` |
| `no such column: stripe_*` | Run `node scripts/add-users-stripe-columns.mjs` |
| `Insert failed: ...` | Same as above; ensure DB schema is applied |
| `Token failed` / JWT error | Ensure `.env` has `JWT_SECRET` or the server uses the default |
| `hasBody: false` or `bodyKeys: []` | Request body not parsed; ensure `Content-Type: application/json` and body is valid JSON |

## STEP 4 — Verify DB and auth

- **Health check:** Open `http://localhost:3001/api/health` in the browser (or run `node -e "fetch('http://localhost:3001/api/health').then(r=>r.json()).then(console.log).catch(e=>console.error(e.message))"`). Should return `{ "ok": true, "db": "ok" }`. If 503 or connection refused, start the backend and/or run `npm run push` and `npm run seed`.
- **Users table:** After signup, inspect `sovereign.sqlite` (e.g. with DB Browser for SQLite) and confirm a row in `users`.

## Quick test (backend must be running)

```bash
cd server
npm run dev
# In another terminal:
node scripts/test-auth-request.mjs register
```
Check the first terminal for `REGISTER request` and any `REGISTER catch` or error; check the second for Status and Body.
