# Rate Limiting Specification - COMPLETE ✅

**Status:** Booking API rate limiting implemented | **Date:** 2026-01-28 | **Requirement:** Item #8 - Data & Security

---

## Overview

Rate limiting prevents abuse, spam, and DoS attacks on the booking system. Implemented via `enforceBookingRateLimit()` backend function with multi-layer protection.

---

## Rate Limit Rules

### Layer 1: User Booking Quota
**Rule:** Max 5 bookings per user per hour (across all barbers)  
**Enforcement:** Query Booking entity by `created_by` email + timestamp  
**Response:** 3600s retry-after if exceeded  
**Use Case:** Prevents user from spamming bookings

### Layer 2: Duplicate Barber Protection
**Rule:** Max 1 booking per user per barber per 30 minutes  
**Enforcement:** Query Booking entity by `created_by` + `barber_id` + timestamp  
**Response:** 1800s retry-after if exceeded  
**Use Case:** Prevents user from booking same barber multiple times consecutively

### Layer 3: IP-Based Request Rate Limit
**Rule:** Max 3 requests per second per IP address  
**Enforcement:** Query RateLimitLog entity by `ip_address` + timestamp window  
**Response:** 5s retry-after if exceeded  
**Use Case:** Prevents rapid-fire spam clicks or bot automation

---

## Implementation Details

### Function Signature
```javascript
enforceBookingRateLimit(context: {
  client_id: string,      // User making the booking
  barber_id: string,      // Target barber
  client_email: string,   // For deduplication (created_by field)
  ip_address: string      // Client IP for request throttling
}): Promise<{
  status: 'ALLOWED' | 'RATE_LIMITED',
  reason?: string,        // Why rate limited
  message: string,        // User-facing message
  retry_after_seconds?: number,
  user_bookings_this_hour?: number,
  remaining_quota?: number
}>
```

### Check Flow
1. User booking quota (1 hour window) ← FIRST CHECK
2. Duplicate barber booking (30 min window) ← PREVENTS MULTI-BOOK
3. IP request rate (1 second window) ← PREVENTS SPAM CLICKS
4. Audit log to RateLimitLog ← ALWAYS LOG
5. Return result with retry guidance

---

## Storage Entity

**Entity:** `RateLimitLog` (already defined in snapshot)

Fields used:
- `ip_address` (string) - Client IP
- `action` (enum: 'booking_create', 'search', 'message_send')
- `client_id` (string) - User ID if authenticated
- `status` (enum: 'allowed', 'rate_limited', 'pending_booking')
- `created_date` (auto, ISO timestamp)
- `details` (string) - Additional context

---

## Integration Points

### Client-Side (Frontend)
- Disable "Book" button during submission
- Catch rate limit response (HTTP 429)
- Display retry-after countdown
- Debounce rapid form submissions

### Backend Flow
1. **Booking API receives request**
   ```
   POST /api/bookings
   {client_id, barber_id, start_time, ...}
   ```

2. **Call enforceBookingRateLimit()** before creating Booking
   ```javascript
   const rateLimitCheck = await enforceBookingRateLimit({
     client_id: user.id,
     barber_id: booking.barber_id,
     client_email: user.email,
     ip_address: request.headers['x-forwarded-for'] || request.ip
   });

   if (rateLimitCheck.status === 'RATE_LIMITED') {
     return {
       status: 429,
       headers: { 'Retry-After': rateLimitCheck.retry_after_seconds },
       body: rateLimitCheck
     };
   }
   ```

3. **Proceed with booking creation if allowed**

---

## Error Responses

### Rate Limited (429)
```json
{
  "status": "RATE_LIMITED",
  "reason": "USER_BOOKING_QUOTA_EXCEEDED",
  "message": "You can only create 5 bookings per hour. Try again later.",
  "retry_after_seconds": 3600
}
```

### Allowed (200)
```json
{
  "status": "ALLOWED",
  "message": "Rate limit check passed",
  "user_bookings_this_hour": 2,
  "remaining_quota": 3
}
```

---

## Edge Cases Handled

### Unauthenticated Users
- Rate limited by IP only (Layer 3)
- Cannot track by `created_by` (not logged in)

### Mobile/VPN Users
- Shared IP may result in false positives
- Mitigated by per-user quota (Layers 1-2 still work)

### Clock Skew
- Uses server timestamp (now) as source of truth
- All comparisons in UTC

### Multiple Barbers Same Shop
- Each barber tracked separately (Layer 2 uses barber_id)
- User can book different barbers within the hour

---

## Monitoring & Alerting

### Log Queries
Monitor for abuse patterns:
```
SELECT ip_address, COUNT(*) as request_count
FROM RateLimitLog
WHERE action = 'booking_create' AND created_date > NOW() - 1 HOUR
GROUP BY ip_address
HAVING COUNT(*) > 10
```

### Alert Triggers
- ⚠️ Same IP hitting rate limit 10+ times in 1 hour
- ⚠️ Same user hitting quota 5+ times in 24 hours
- 🔴 Same user attempting barber booking 10+ times in 30 min (likely bot)

---

### Redis / Upstash integration (implemented)
- IP throttling uses **Upstash Redis** (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) via `@upstash/ratelimit` sliding windows
- Shared across all server instances; automatic TTL expiration
- Booking Layer 3: 3 requests/second/IP on `POST /api/bookings`
- Public endpoints: availability (30/min), promo validate (20/min), geocode/reverse-geocode (20/min), travel quote (40/min)
- Local dev falls back to in-process store when Upstash is unset (production requires env vars)

### Future enhancements
- Increase limits for verified/established users
- Stricter limits for new accounts
- IP reputation scoring

### Whitelist/Bypass
- Admin bypass for legitimate bulk operations
- VIP user quota increases
- IP whitelist for internal services

---

## Testing Checklist

- ✅ Single user rapid bookings blocked (Layer 1)
- ✅ Same user + barber within 30 min blocked (Layer 2)
- ✅ Rapid IP requests blocked (Layer 3)
- ✅ Different barbers allowed within quota (Layer 1 ✓, Layer 2 ✓)
- ✅ Retry-after header set correctly
- ✅ Logs created in RateLimitLog
- ✅ Authenticated users tracked by email
- ✅ Unauthenticated users tracked by IP
- ✅ 1-hour window resets correctly
- ✅ 30-minute window resets correctly
- ✅ 1-second window resets correctly

---

## Audit Sign-Off

**Item #8: Rate limiting on booking API** ✅ COMPLETE

- Multi-layer rate limiting implemented
- IP + user + barber tracking active
- Audit logging enabled
- Error responses standardized
- Production-ready with scaling path