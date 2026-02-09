# Resend Email Setup — ShopTheBarber

This guide covers configuring [Resend](https://resend.com) for transactional email (booking confirmation, cancellation, welcome).

## 1. Environment variables

In `server/.env` (copy from `server/.env.example`):

| Variable | Description |
|----------|-------------|
| `RESEND_API_KEY` | API key from [Resend Dashboard → API Keys](https://resend.com/api-keys). Create a key with “Send” permission. |
| `EMAIL_FROM` | Sender address, e.g. `Shop The Barber <bookings@yourdomain.com>`. Must be a verified domain in Resend. |
| `FRONTEND_URL` | Frontend URL (e.g. `https://app.yourdomain.com`). Used in email links (Dashboard, Explore). |

**Never commit** `.env` or share your API key.

## 2. Resend Dashboard

1. **Sign up / log in**: [resend.com](https://resend.com).
2. **Verify a domain**: Add your domain (e.g. `yourdomain.com`) and add the DNS records Resend provides. Until then you can use `onboarding@resend.dev` for testing (limited to your own email).
3. **Create API key**: Dashboard → API Keys → Create. Use this as `RESEND_API_KEY`.

## 3. When Resend is not configured

If `RESEND_API_KEY` is not set:

- **Welcome email** (on signup): Skipped; registration still succeeds.
- **Booking confirmation / cancellation**: `sendEmail` logs the payload to the server console and returns success (no email sent). Useful for local dev without Resend.

So the app runs without Resend; emails are only sent when the key and sender are set.

## 4. Templates used

| Template | When |
|----------|------|
| `welcome` | After user registers. |
| `confirmation` | After booking is created (server-side) or after Stripe checkout completes (webhook). |
| `cancellation` | When a booking is cancelled (via send-booking-email or logic). |

Templates are defined in `server/src/logic/email.ts`. You can change copy or HTML there.

## 5. Production checklist

- [ ] Domain verified in Resend.
- [ ] `RESEND_API_KEY` set in production `.env`.
- [ ] `EMAIL_FROM` uses your verified domain (e.g. `Shop The Barber <bookings@yourdomain.com>`).
- [ ] `FRONTEND_URL` set to production frontend URL.

See `server/.env.example` for a full list of env vars.
