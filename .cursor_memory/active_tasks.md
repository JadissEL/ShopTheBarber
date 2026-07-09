# Active tasks

## Release Stabilization (RS)

| Task | Priority | Status |
|------|----------|--------|
| RS1 — Auth / storageState per persona | CRITICAL | done |
| RS2 — qa:verify provisioning | CRITICAL | done |
| RS3 — 7 role journeys + shop owner | HIGH | done |
| RS4 — UI copy checklist | MEDIUM | partial |
| RS5 — Guest booking seed | MEDIUM | done |
| RS6 — Production gate re-run | GATE | in progress (46/53 journeys) |
| Fix remaining 7 flaky journey steps | HIGH | pending |
| Staging journey re-run | HIGH | pending |
| Dashboard tab empty states (Upcoming/History/Reviews) | HIGH | done (local) |
| Blog: image upload + moderation UX | HIGH | done (local) |

## Standing rules

- **No V3** feature development until production sign-off.
- Use `npm run dev:e2e` for authenticated E2E (not `npm run dev` with production API in `.env.local`).
