# Session state

## Current snapshot

- **Last session date:** 2026-07-09
- **Current focus:** Release Stabilization Sprint (RS) — auth, provisioning, journeys, local API fix.
- **Verdict:** **READY FOR STAGING (high confidence)** — journeys 46/53; `qa:verify` 7/7; guest 5/5. Not production yet.
- **Next:** Stabilize remaining 7 flaky journey steps; run full suite on staging; commit RS changes when user requests.

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
