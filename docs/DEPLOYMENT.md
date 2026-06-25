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
   - **Build Command**: match the repo (**Blueprint** pulls this automatically):  
     `npm install --include=dev && node scripts/build-database.mjs`  
     — with **SQLite** (no `DATABASE_URL`) this wipes ephemeral `sovereign.sqlite` and runs `drizzle-kit push`. With **`DATABASE_URL`** (Render Postgres) it runs **`drizzle-kit migrate`** (additive SQL under `server/drizzle/`). For an **empty** Postgres on first boot, either run `npx drizzle-kit push` once from your machine against that URL or set **`DRIZZLE_BOOTSTRAP=push`** for a **single** deploy, then remove it (see [AGENTS.md](../AGENTS.md)).
   - **Start Command**: `npm run start`
5. **Environment** (required / common):
   - `JWT_SECRET`: Generate a long random string (e.g. `openssl rand -hex 32`).
   - `FRONTEND_URL`: Your Vercel URL **after** step 3, e.g. `https://shop-the-barber.vercel.app` (no trailing slash).
   - `CLERK_SECRET_KEY`: Same Clerk instance as the frontend `VITE_CLERK_PUBLISHABLE_KEY` (see [AGENTS.md](../AGENTS.md)).
   - `STRIPE_API_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`: From [Stripe Dashboard](https://dashboard.stripe.com/apikeys) (use test keys for staging).
   - Optional: `DATABASE_URL` when using Render Postgres; optional one-time `DRIZZLE_BOOTSTRAP` as above.
6. Click **Create Web Service**. Wait for the first deploy to finish.
7. Copy the service URL (e.g. `https://shopthebarber-api.onrender.com`). You need it for the frontend.

**Database:** Without `DATABASE_URL`, the service uses **SQLite** on Render’s ephemeral disk — data may reset on redeploy; the boot path can seed if barbers are empty. With **`DATABASE_URL`**, the app uses **PostgreSQL** (`server/src/db/index.ts`). Operational detail: **`[AGENTS.md](../AGENTS.md)`** (`build-database`, `migrate`, Clerk + `users.clerk_user_id`, optional Playwright checks).

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

## 6. Optional: use the Blueprint (render.yaml)

The repo includes a `render.yaml` that describes the backend service. In Render you can:

- **New** → **Blueprint** → connect the repo; Render will create the web service from the YAML.

You still must set **secret** env vars (e.g. `JWT_SECRET`, `STRIPE_*`, `FRONTEND_URL`, `CLERK_SECRET_KEY`) in the Render Dashboard; the YAML marks several as `sync: false` so you add them by hand.

**Manual QA after deploy:** GitHub → **Actions** → workflow **Playwright API checks** (`workflow_dispatch`): smoke `/api/health` against your API URL; optional Clerk Bearer and optional **browser** sign-in specs (secrets documented in **AGENTS.md**).

---

## Quick checklist

| Step | Where | What |
|------|--------|------|
| 1 | GitHub | Repo with `master` (development/CI) and `main` (production). Deploy from `main` only. |
| 2 | Render | Web Service from Blueprint or manually: branch **main**, root `server`, build `npm install --include=dev && node scripts/build-database.mjs`, start `npm run start`, env `JWT_SECRET`, `FRONTEND_URL`, Clerk, Stripe, optional `DATABASE_URL` |
| 3 | Vercel | New Project from repo, production branch **main**, set `VITE_API_URL` = Render backend URL |
| 4 | Both | `FRONTEND_URL` = Vercel URL; `VITE_API_URL` = Render URL |

After that, the project is always running. Promote `master` → `main` after CI passes to update production (see [GIT_BRANCHING_AND_DEPLOYMENT.md](GIT_BRANCHING_AND_DEPLOYMENT.md)).
