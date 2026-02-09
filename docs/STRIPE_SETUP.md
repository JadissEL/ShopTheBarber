# Stripe Setup — ShopTheBarber

This guide covers configuring Stripe for payments (checkout and webhooks).

## Quick fix: "Payment Error: Stripe is not configured"

In **test mode** you use both keys from [Stripe Dashboard → API keys](https://dashboard.stripe.com/apikeys):

1. **Create or edit** `server/.env` (copy from `server/.env.example` if it doesn’t exist).
2. **Set both test keys** (no quotes, no spaces around `=`):
   ```env
   STRIPE_API_KEY=sk_test_your_full_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_public_key_here
   ```
   - **Secret key (sk_test_...)** — required on the server to create checkout sessions. Never expose it.
   - **Public key (pk_test_...)** — optional; used by the frontend. Exposed safely at `GET /api/payments/config` so the app can use it for Stripe.js or display.
3. **Restart the backend**: stop the server, then in the `server` folder run `npm run dev` again.  
   The server loads `server/.env` from the server directory, so it works whether you start the app from the repo root or from `server/`.
4. Retry the booking and confirm payment.

---

## 1. Where to set keys

Keys are read in this order: **env vars** (e.g. `server/.env`) → **`server/.stripe-keys.json`** (MCP-friendly; gitignored). You can use either.

**Option A – Environment variables**

In `server/.env` (copy from `server/.env.example`):

| Variable | Description |
|----------|-------------|
| `STRIPE_API_KEY` | **Secret** key from [Stripe Dashboard → API Keys](https://dashboard.stripe.com/apikeys). Use `sk_test_...` for test mode, `sk_live_...` for production. Required for creating checkout sessions. |
| `STRIPE_PUBLISHABLE_KEY` | **Public** key (`pk_test_...` / `pk_live_...`). Safe to expose. Used by the frontend; exposed at `GET /api/payments/config`. Optional for redirect Checkout; needed if you use Stripe.js on the client. |
| `STRIPE_WEBHOOK_SECRET` | Signing secret from [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks). Required for webhook signature verification. |
| `FRONTEND_URL` | Your frontend URL (e.g. `https://app.yourdomain.com`). Used for checkout success/cancel redirects. |

**Option B – MCP-friendly file**

Put keys in `server/.stripe-keys.json` (gitignored). See **[STRIPE_MCP_SETUP.md](STRIPE_MCP_SETUP.md)** for format, Stripe MCP in Cursor, and the `npm run set-stripe-keys` script.

**Never commit** `.env`, `.stripe-keys.json`, or share `sk_live_` keys.

## 2. Webhook endpoint

- **URL**: `https://<your-backend-host>/api/webhooks/stripe`
- **Method**: POST (raw body; do not parse as JSON so signature can be verified).

### Events to subscribe to

In Stripe Dashboard → Webhooks → Add endpoint, select:

- `checkout.session.completed` — marks booking as paid and sends confirmation email.
- `charge.succeeded` — backup for payment confirmation (if not using Checkout).
- `charge.failed` — marks booking as cancelled on payment failure.
- `charge.refunded` — updates booking to refunded.
- `payout.paid` / `payout.failed` — if you use Stripe Connect for provider payouts.

### Local testing

Use [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

Use the printed webhook signing secret as `STRIPE_WEBHOOK_SECRET` in `.env`.

## 3. Flow

1. **Frontend**: User completes booking → calls `POST /api/functions/create-checkout-session` with `{ bookingId }` → redirects to returned Stripe Checkout URL.
2. **User**: Pays on Stripe; redirects to `FRONTEND_URL/Dashboard?status=success&bookingId=...`.
3. **Backend**: Stripe sends `checkout.session.completed` to your webhook → booking is set to `payment_status: paid`, `status: confirmed` → confirmation email is sent (if Resend is configured).

## 4. When Stripe is not configured

If `STRIPE_API_KEY` is missing or invalid:

- `POST /api/functions/create-checkout-session` returns **503** with a message to set `STRIPE_API_KEY`.
- `GET /api/payments/balance` returns **503**.

See `server/.env.example` for a full list of env vars.
