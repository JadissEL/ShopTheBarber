# Incident runbook — API downtime & degraded service

**Audience:** On-call / platform admin  
**Monitors:** GitHub [uptime-monitor.yml](../.github/workflows/uptime-monitor.yml) (every 5 min), Render health check, optional Slack webhook  
**Public comms:** [/StatusPage](/StatusPage) (frontend) fed by `GET /api/status/public`

---

## Severity levels

| Level | Signal | Example |
|-------|--------|---------|
| **SEV-1** | `/api/health/ready` 503, bookings down | DB unreachable, bad migration |
| **SEV-2** | Degraded — partial features | Geocoding missing, Stripe misconfigured |
| **SEV-3** | Non-user-facing | Uptime workflow flaky, preview env only |

---

## First 5 minutes

1. **Confirm impact**
   - `curl -sS https://<API>/api/health/ready | jq`
   - Open [/StatusPage](https://shop-the-barber.vercel.app/StatusPage) (or your prod URL)
   - Check [Sentry](https://sentry.io) for error spike
   - Check GitHub Actions → **Uptime Monitor** last run

2. **Assign roles**
   - **Incident lead:** coordinates comms + fixes
   - **Comms:** updates status page / support macros

3. **Post initial status** (see [Status comms](#status-comms) below)

---

## Common causes & fixes

### Database / migrations (`db: error` or `migrations: failed`)

```bash
cd server && npm run verify:schema   # needs DATABASE_URL
npx prisma migrate deploy            # on Render shell or redeploy
```

- Check Neon dashboard — branch healthy, connection limit not exceeded
- Recent deploy? Review latest migration in `server/prisma/migrations/`

### Schema incomplete (`schema: incomplete`)

- Run `node scripts/build-database.mjs` on Render build or manually `prisma migrate deploy`
- Compare `checks` object in `/api/health/ready` response

### API up but frontend broken

- Verify Vercel `VITE_API_URL` points to current Render URL
- Verify Clerk publishable key matches secret app
- Check browser console for CORS / 401 loops

### Stripe / payments degraded

- Confirm `STRIPE_API_KEY` + `STRIPE_WEBHOOK_SECRET` on Render
- Stripe Dashboard → Webhooks → recent delivery failures
- Status page shows payments **degraded** if `STRIPE_API_KEY` unset

### Geocoding degraded

- Set `MAPBOX_ACCESS_TOKEN` or `GOOGLE_MAPS_API_KEY` on Render
- Address autocomplete may fail; booking with manual address may still work

---

## Status comms

### Public status page

Set on **Render** (API) environment variable:

```json
STATUS_PAGE_INCIDENTS=[{"title":"Booking API disruption","status":"investigating","message":"We are investigating elevated errors on bookings. Updates every 30 minutes.","updated_at":"2026-06-26T12:00:00Z"}]
```

- Remove or set `"status":"resolved"` when fixed
- Frontend polls `/api/status/public` every 60s

### Support inbox

- Watch **Admin → Support Inbox** for user reports
- Macro reply: “We’re aware of an issue affecting [bookings/payments]. Track live status at [StatusPage URL].”

### Slack (optional)

If `SLACK_WEBHOOK_URL` is set, failed uptime checks notify automatically.

---

## Escalation checklist

| Step | Action |
|------|--------|
| 1 | Identify failing component from `/api/status/public` |
| 2 | Roll back Render deploy if regression < 2h old |
| 3 | Roll back Vercel if frontend env regression |
| 4 | Neon: failover / restore from branch if data issue |
| 5 | Post-mortem within 48h — append to `mistakes_and_learnings.md` |

---

## Recovery verification

- [ ] `/api/health/ready` → 200, `"ok": true`
- [ ] `/api/status/public` → `"overall_status": "operational"`
- [ ] Test sign-in + one booking (test Stripe)
- [ ] Clear `STATUS_PAGE_INCIDENTS` or mark resolved
- [ ] Confirm Uptime Monitor green for 30+ minutes

---

## Related docs

- [OBSERVABILITY_AND_DATA.md](./OBSERVABILITY_AND_DATA.md) — health endpoints, Sentry
- [DEPLOYMENT.md](./DEPLOYMENT.md) — env vars, deploy flow
- [KEYS_FINALIZATION_WALKTHROUGH.md](./KEYS_FINALIZATION_WALKTHROUGH.md) — secrets setup
