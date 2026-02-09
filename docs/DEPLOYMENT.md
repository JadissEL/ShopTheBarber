# Deploy ShopTheBarber (always running)

This guide gets the **frontend** on **Vercel** and the **backend** on **Render**, with **GitHub** so each push can redeploy.

**Want to do it via MCP?** Add the [Vercel](https://vercel.com/docs/ai-resources/vercel-mcp) and [Render](https://mcp.render.com) MCP servers in Cursor, then ask the AI to deploy using those connections. Full steps: **[DEPLOYMENT_MCP.md](DEPLOYMENT_MCP.md)**.

---

## 1. Push your code to GitHub

If the project is not yet on GitHub:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/shop-the-barber.git
git branch -M main
git push -u origin main
```

Use your own repo URL. From then on, **pushing to `main`** will trigger deploys (after you connect the repo in step 2 and 3).

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

**Database:** The app uses SQLite by default. On Render’s free tier the disk is **ephemeral** (data can be lost on redeploy). After the first deploy you can run the seed once (Render Dashboard → your service → **Shell** → `npm run push` then `npm run seed`) so the API has sample barbers/shops. For a persistent DB later you can add [Render Postgres](https://render.com/docs/databases) or another hosted DB and set `DATABASE_URL` (backend would need to support Postgres; currently it uses SQLite).

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

## 5. Deployments on every push

- **Vercel**: Redeploys automatically when you push to the connected branch (usually `main`).
- **Render**: Redeploys automatically when you push to the same branch.

So: **push to GitHub** → both frontend and backend can rebuild and go live without extra steps.

---

## 6. Optional: use the Blueprint (render.yaml)

The repo includes a `render.yaml` that describes the backend service. In Render you can:

- **New** → **Blueprint** → connect the repo; Render will create the web service from the YAML.

You still must set **secret** env vars (e.g. `JWT_SECRET`, `STRIPE_*`, `FRONTEND_URL`) in the Render Dashboard; the YAML marks them as `sync: false` so you add them by hand.

---

## Quick checklist

| Step | Where | What |
|------|--------|------|
| 1 | GitHub | Repo with latest code, push to `main` |
| 2 | Render | New Web Service, root `server`, start `npm run start`, set `JWT_SECRET`, `FRONTEND_URL`, Stripe keys |
| 3 | Vercel | New Project from repo, set `VITE_API_URL` = Render backend URL |
| 4 | Both | `FRONTEND_URL` = Vercel URL; `VITE_API_URL` = Render URL |

After that, the project is always running; push to GitHub to update both frontend and backend.
