# Session state

## Current snapshot

- **Last session date:** 2026-07-10
- **Current focus:** Tab empty states on provider dashboard + prior auth/blog fixes (local, not deployed).
- **Verdict:** RS pushed (`e89f946`); new fixes local, **not yet deployed**.
- **Next:** Deploy fixes; verify shop owner on `/ProviderPayouts` and `/ClientList`; optional commit/push on user request.

## Fixes in progress (local)

- `useManagedShop` now uses `AuthContext` (no raw `auth.me()` race).
- `ProviderPayouts` + `ClientList` wait for auth sync before sign-in gate.
- Blog: `POST /api/articles/upload-image`, cover + inline picture upload, moderation copy clarified.

## Key commands

```bash
npm run dev:server          # API :3001
npm run dev:e2e             # Vite :3000 with local /api proxy (NOT production VITE_API_URL)
npm run qa:provision && npm run qa:verify
npm run test:e2e:journeys
```

## Archive

- R1 report: `PRODUCTION_READINESS_REPORT.md` (62/100 → 78/100 post-RS)
- RS plan: `RELEASE_STABILIZATION_PLAN.md`
- P1 company commerce — `a41d7fb`
