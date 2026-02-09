# Deploy ShopTheBarber (always running)

This guide gets the **frontend** on **Vercel** and the **backend** on **Render**, with **GitHub** so each push can redeploy.

**Branching:** Production deploys use the **`main`** branch only. All development and CI run on **`master`**; changes are promoted to `main` only after tests pass. See **[GIT_BRANCHING_AND_DEPLOYMENT.md](GIT_BRANCHING_AND_DEPLOYMENT.md)** for the full workflow.

**Want to do it via MCP?** Add the [Vercel](https://vercel.com/docs/ai-resources/vercel-mcp) and [Render](https://mcp.render.com) MCP servers in Cursor, then ask the AI to deploy using those connections. Full steps: **[DEPLOYMENT_MCP.md](DEPLOYMENT_MCP.md)**.

**Why Vercel + Render (and not e.g. Hostinger free)?** This app is a **Vite + Node** full-stack: the frontend is a Vite/React SPA and the backend is a Node/Fastify API. Vercel’s free tier is built for SPAs and Vite (auto-detects, instant previews, GitHub integration). Render’s free tier runs the Node API and fits the existing `render.yaml`. Hostinger’s free plan is aimed at static or cPanel sites and doesn’t match this stack as well; you’d still need a separate place for the Node API. Using Vercel (frontend) + Render (backend) keeps one workflow, free tiers, and no server management.

---

## 1. Push your code to GitHub

If the project is not yet on GitHub, push both branches. Use **`master`** for daily work and CI; use **`main`** for production (see [GIT_BRANCHING_AND_DEPLOYMENT.md](GIT_BRANCHING_AND_DEPLOYMENT.md)):

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/shop-the-barber.git
git branch -M master
git push -u origin master
git checkout -b main
git push -u origin main
```

Connect the repo in step 2 and 3 and set **production** to deploy from **`main`** only. Pushing to **`main`** (after promoting from `master`) triggers production deploys.

---

## 2. Deploy the backend (Render)

1. Go to [render.com](https://render.com) and sign in (GitHub is fine).
2. **Dashboard** → **New** → **Web Service**.
3. **Connect** the `shop-the-barber` repo (authorize GitHub if asked).
4. Configure:
   - **Name**: `shopthebarber-api` (or any name).
   - **Region**: Choose one close to you.
   - **Root Directory**: `server`
   - **Runtime**: Node.
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start`
5. **Environment** (required):
   - `JWT_SECRET`: Generate a long random string (e.g. `openssl rand -hex 32`).
   - `FRONTEND_URL`: Your Vercel URL **after** step 3, e.g. `https://shop-the-barber.vercel.app` (no trailing slash).
   - `STRIPE_API_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`: From [Stripe Dashboard](https://dashboard.stripe.com/apikeys) (use test keys for staging).
6. Click **Create Web Service**. Wait for the first deploy to finish.
7. Copy the service URL (e.g. `https://shopthebarber-api.onrender.com`). You need it for the frontend.

**Database:** The app uses SQLite by default. On Render’s free tier the disk is **ephemeral** (data can be lost on redeploy). After the first deploy you can run the seed once (Render Dashboard → your service → **Shell** → `npm run push` then `npm run seed`) so the API has sample barbers/shops. For a **persistent, always-reachable** database see [§9](#9-hosted-database-always-reachable) below.

---

## 3. Deploy the frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub is fine).
2. **Add New** → **Project** → import the `shop-the-barber` repo.
3. Configure:
   - **Framework Preset**: Vite (or leave auto).
   - **Root Directory**: leave default (repo root).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   - `VITE_API_URL`: Your **Render backend URL** from step 2, e.g. `https://shopthebarber-api.onrender.com` (no `/api` at the end; the app adds `/api` when calling endpoints).
5. Click **Deploy**. Wait for the build to finish.
6. Copy the Vercel URL (e.g. `https://shop-the-barber.vercel.app`).

---

## 4. Connect frontend and backend

- In **Render** (backend): set `FRONTEND_URL` to your **Vercel URL** (e.g. `https://shop-the-barber.vercel.app`). Redeploy if you had left it blank.
- In **Vercel** (frontend): ensure `VITE_API_URL` is your **Render backend URL** (e.g. `https://shopthebarber-api.onrender.com`). Redeploy if you change it.

After this, the site is “always on”: the frontend runs on Vercel and the API on Render.

---

## 5. Deployments on every push to `main`

- **Vercel** and **Render** must be configured to use the **`main`** branch for production.
- A push to **`main`** triggers a production deploy (frontend and backend).
- Do **not** deploy production from `master`. Develop and run CI on `master`; promote to `main` only after CI passes. See [GIT_BRANCHING_AND_DEPLOYMENT.md](GIT_BRANCHING_AND_DEPLOYMENT.md).

---

## 6. Render: root URL and health check

- **GET /** and **GET /api** return `200` with a short JSON body so Render’s default health probe (or any check on `/`) does not see a 404. For a full DB check, use **GET /api/health**.
- In Render Dashboard → your service → **Settings** → **Health Check Path** you can set `/api/health` if you want the platform to probe the DB; otherwise the default `/` is fine.

---

## 7. Render: Outbound IP addresses (for whitelisting)

When your Render service calls the internet (Stripe webhooks callback, S3, Redis, Sentry, etc.), requests come from **Render’s outbound IPs**, not a unique IP for your service.

- **Where to find them:** Render Dashboard → your service → **Connect** (top right) → **Outbound**.
- **Typical ranges** (same region; confirm in the dashboard): e.g. `74.220.51.0/24`, `74.220.59.0/24`. These are **shared** with other Render services in that region.
- **When you need them:** If a third party (payment provider, database, firewall) requires **IP allowlisting**, add these CIDR ranges so your backend can reach them. Example: Stripe Radar, AWS S3 bucket policy, or Redis allowlist.
- **Note:** Many services use **API keys** only and do not require IP whitelisting; use these IPs only when a provider explicitly asks for them.

---

## 9. Hosted database (always reachable)

To have your **database always reachable**, persistent across redeploys, and **ready whenever a user opens the website**, host it on a managed service instead of SQLite on the server disk.

**What happens when a user opens the site:**  
The frontend (Vercel) loads immediately. It calls your backend (Render). The backend connects to the database. If the DB is hosted on a managed service, it is **always on** and responds right away. So the only delay can be Render’s free-tier spin-down (~50s cold start) unless you upgrade or use a keep-alive (see below).

### Recommended options (pick one)

| Provider | Why | Free tier | Link |
|----------|-----|-----------|------|
| **Render Postgres** | Same dashboard as your API; one-click link; automatic `DATABASE_URL`. | 90-day free, then paid. | [Render Databases](https://render.com/docs/databases) |
| **Neon** | Serverless Postgres, always on, good free tier. | 0.5 GB storage, no credit card. | [neon.tech](https://neon.tech) |
| **Supabase** | Postgres + auth/realtime; generous free tier. | 500 MB, 2 projects. | [supabase.com](https://supabase.com) |
| **Railway** | Postgres (or MySQL); simple. | $5 credit/month. | [railway.app](https://railway.app) |

### Steps (high level)

1. **Create a Postgres database** on one of the providers above. Copy the **connection string** (e.g. `postgresql://user:pass@host:5432/dbname?sslmode=require`).
2. **Add `DATABASE_URL`** in Render: your Web Service → **Environment** → add `DATABASE_URL` = that connection string.
3. **Switch the backend to Postgres**: the app currently uses SQLite (Drizzle + `better-sqlite3`). To use a hosted DB you’d add the Postgres driver and point Drizzle at `DATABASE_URL` (schema stays the same; only the driver and connection config change). Full migration (code + migrations) can be done in a follow-up task.

Until you migrate to Postgres, you can keep using SQLite on Render and re-seed after redeploys, or use **Render’s persistent disk** (paid) so the SQLite file survives redeploys.

### Keeping the backend responsive (no 50s delay)

On Render’s **free** tier, the backend **spins down** after inactivity. The first request after that can take ~50 seconds. To have it “always triggered” and fast when users open the site:

- **Option A (recommended for production):** Upgrade to a **paid** Render instance (e.g. Starter) so the service stays **always on**.
- **Option B:** Use an **uptime / keep-alive** service (e.g. [UptimeRobot](https://uptimerobot.com), cron-job.org) to hit your backend URL (e.g. `GET https://your-api.onrender.com/api/health`) every 10–14 minutes. That keeps the free instance from spinning down as long as traffic is regular.

---

## 10. Optional: use the Blueprint (render.yaml)

The repo includes a `render.yaml` that describes the backend service. In Render you can:

- **New** → **Blueprint** → connect the repo; Render will create the web service from the YAML.

You still must set **secret** env vars (e.g. `JWT_SECRET`, `STRIPE_*`, `FRONTEND_URL`) in the Render Dashboard; the YAML marks them as `sync: false` so you add them by hand.

---

## Quick checklist

| Step | Where | What |
|------|--------|------|
| 1 | GitHub | Repo with `master` (development/CI) and `main` (production). Deploy from `main` only. |
| 2 | Render | New Web Service, branch **main**, root `server`, start `npm run start`, set `JWT_SECRET`, `FRONTEND_URL`, Stripe keys |
| 3 | Vercel | New Project from repo, production branch **main**, set `VITE_API_URL` = Render backend URL |
| 4 | Both | `FRONTEND_URL` = Vercel URL; `VITE_API_URL` = Render URL |
| 5 | Render | Optional: **Connect** → **Outbound** to copy IP ranges for third-party whitelisting (Stripe, S3, Redis, etc.) |
| 6 | DB (optional) | Add a **hosted Postgres** (Render, Neon, Supabase, Railway) and set `DATABASE_URL` so data is persistent and always reachable (see §9). |

After that, the project is always running. Promote `master` → `main` after CI passes to update production (see [GIT_BRANCHING_AND_DEPLOYMENT.md](GIT_BRANCHING_AND_DEPLOYMENT.md)).
