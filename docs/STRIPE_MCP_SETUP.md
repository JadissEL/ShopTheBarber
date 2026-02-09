# Stripe API Keys via MCP (or file)

You can set Stripe API keys in three ways. The server reads them in this order: **env vars** → **`server/.stripe-keys.json`** (MCP-friendly file).

---

## 1. Environment variables (classic)

In `server/.env`:

```env
STRIPE_API_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

See [STRIPE_SETUP.md](STRIPE_SETUP.md) for full Stripe setup.

---

## 2. MCP-friendly file: `server/.stripe-keys.json`

The backend can load keys from **`server/.stripe-keys.json`** if env vars are not set. This file is **gitignored** so you can safely put secrets in it.

**Format:**

```json
{
  "STRIPE_API_KEY": "sk_test_...",
  "STRIPE_WEBHOOK_SECRET": "whsec_..."
}
```

**Use cases:**

- An MCP tool or script writes this file (e.g. after you provide keys in Cursor).
- You keep one secrets file per machine instead of editing `.env`.
- CI or a deploy script writes this file from a vault or MCP-backed source.

**Priority:** Env vars override. If `STRIPE_API_KEY` is set in the environment, the server uses it and does not read from the file for that key.

---

## 3. Stripe MCP in Cursor (for using Stripe from the IDE)

To use **Stripe MCP** inside Cursor (Stripe tools from the AI/IDE), configure the Stripe MCP server with your API key. That is separate from the backend: the backend still needs keys via env or `.stripe-keys.json`.

### Option A: Remote Stripe MCP (recommended)

1. In Cursor: **Settings → MCP** (or edit `~/.cursor/mcp.json`).
2. Add the Stripe server:

```json
{
  "mcpServers": {
    "stripe": {
      "url": "https://mcp.stripe.com"
    }
  }
}
```

3. When prompted, sign in or provide your Stripe API key so the MCP can call Stripe.

### Option B: Local Stripe MCP with API key

Run the Stripe MCP locally and pass the key:

```bash
npx -y @stripe/mcp --tools=all --api-key=YOUR_STRIPE_SECRET_KEY
```

Or set `STRIPE_SECRET_KEY` in the environment before running.

### Using the same key in the backend

- **Option 1:** Copy the same key into `server/.env` or `server/.stripe-keys.json` (see above).
- **Option 2:** Run the project script (see below) to write `server/.stripe-keys.json` from env, then start the server.

---

## Script: write keys to `server/.stripe-keys.json`

From the **project root** or from **server/**:

```bash
# From project root
STRIPE_API_KEY=sk_test_xxx STRIPE_WEBHOOK_SECRET=whsec_xxx node server/scripts/set-stripe-keys.js

# From server/
cd server
STRIPE_API_KEY=sk_test_xxx STRIPE_WEBHOOK_SECRET=whsec_xxx npm run set-stripe-keys
```

You can run this after getting keys from Stripe MCP or from your Stripe Dashboard; the backend will then pick them up from `server/.stripe-keys.json` (env vars still override).

---

## Summary

| Source                    | Used when                          |
|---------------------------|------------------------------------|
| `process.env`             | Always; overrides file             |
| `server/.stripe-keys.json`| When env vars are not set          |

MCP connection: use Stripe MCP in Cursor for Stripe operations in the IDE; set backend keys via **env** or **`server/.stripe-keys.json`** (by hand, script, or an MCP tool that writes that file).
