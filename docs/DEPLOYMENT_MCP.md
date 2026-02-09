# Deploy via MCP (Vercel + Render)

You can run **deployment and management through MCP** so the AI in Cursor can create services, deploy, and manage projects using the **Vercel MCP** and **Render MCP** servers.

---

## 1. Add the MCP servers in Cursor

Configure both servers so Cursor (and the AI) can talk to Vercel and Render.

### Option A: One-click (Vercel only)

- **[Add Vercel to Cursor](https://vercel.com/docs/ai-resources/vercel-mcp)** — use the official “Add to Cursor” link; Cursor will prompt you to log in with Vercel.

### Option B: Manual config (Vercel + Render)

Edit your MCP config. Cursor uses either:

- **Project:** `.cursor/mcp.json` in this repo, or  
- **User:** `~/.cursor/mcp.json` (Windows: `%USERPROFILE%\.cursor\mcp.json`)

Add both servers:

```json
{
  "mcpServers": {
    "vercel": {
      "url": "https://mcp.vercel.com"
    },
    "render": {
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_RENDER_API_KEY"
      }
    }
  }
}
```

Replace `YOUR_RENDER_API_KEY` with a key from [Render Dashboard → Settings → API Keys](https://dashboard.render.com/u/settings#api-keys).

**Vercel:** After adding, Cursor will show “Needs login” for Vercel MCP. Click it and complete OAuth so the AI can manage your Vercel projects.

**Render:** No OAuth; the API key in `Authorization` is enough. Restart Cursor after saving the file.

---

## 2. What the AI can do via MCP

| Platform | MCP server   | What the AI can do |
|----------|--------------|--------------------|
| **Vercel** | `https://mcp.vercel.com` | Create/import projects, deploy, list deployments, view logs, search docs. You log in once via OAuth. |
| **Render** | `https://mcp.render.com/mcp` | List workspaces/services, create web services from your Git repo, set env vars, list deploys and logs. Uses your API key. |

So you can say things like:

- *“Deploy the frontend to Vercel using MCP.”*
- *“Create a Render web service for the backend from this repo and set root to `server`.”*
- *“List my Render services and show the latest deploy for the API.”*

The AI will use the Vercel and Render MCP tools to run the right actions.

---

## 3. Repo and env requirements (same as non-MCP)

- **Git:** Code must be pushed to **GitHub** (or GitLab/Bitbucket). Both Vercel and Render deploy from Git.
- **Secrets:** The AI can create services and set *non-secret* env vars. For **secrets** (e.g. `JWT_SECRET`, `STRIPE_API_KEY`), you either:
  - Set them in the **Vercel / Render dashboards** after the service exists, or  
  - Pass them when the AI asks (if your workflow allows).

So: **MCP = do the deploy and config from Cursor; you still push code to GitHub and add secrets in the provider’s UI (or when prompted).**

---

## 4. Suggested flow (all via MCP + GitHub)

1. **Push to GitHub**  
   `git push origin main` (or your default branch).

2. **Add MCP servers**  
   Add Vercel + Render to Cursor as in section 1. Log in to Vercel when prompted; set Render API key.

3. **Ask the AI to deploy**  
   For example:
   - *“Deploy this app: frontend to Vercel, backend to Render using the repo’s `render.yaml`. Use MCP.”*

4. **Set secrets**  
   In **Vercel:** set `VITE_API_URL` to your Render backend URL.  
   In **Render:** set `JWT_SECRET`, `FRONTEND_URL` (Vercel URL), and Stripe keys.  
   (You can do this in the dashboards or, where supported, via MCP/env tools.)

5. **Redeploys**  
   After the first deploy, further pushes to the connected branch trigger new builds on both Vercel and Render. You can also ask the AI to trigger or inspect deploys via MCP.

---

## 5. References

- **Vercel MCP:** [vercel.com/docs/ai-resources/vercel-mcp](https://vercel.com/docs/ai-resources/vercel-mcp) — tools, Cursor setup, OAuth.  
- **Render MCP:** [Render MCP for Cursor](https://dashboard.render.com) → Settings → API Keys; use `https://mcp.render.com/mcp` with Bearer token.  
- **This repo:** [DEPLOYMENT.md](DEPLOYMENT.md) — manual steps without MCP (same result, different UI).

Summary: **Yes — you can do deployment and management through MCP** by adding the Vercel and Render MCP servers in Cursor, then having the AI create services, deploy, and manage projects via those connections. Pushing to GitHub and setting secrets in the provider dashboards (or when the AI asks) stays the same.
