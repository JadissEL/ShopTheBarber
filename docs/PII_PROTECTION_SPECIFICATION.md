# PII Protection Specification - COMPLETE ✅

**Status:** API responses sanitized | **Date:** 2026-01-28 | **Requirement:** Item #7 - Data & Security

---

## PII Classification

### Tier 1: Never Expose (High Risk)
- Full credit card numbers
- CVV/CVC codes
- Password hashes
- Social security numbers
- Full passport numbers
- Bank account numbers
- Auth tokens / JWT secrets

### Tier 2: Conditionally Expose (Medium Risk)
- Full email addresses (only to email owner or admin)
- Full phone numbers (only to booking parties)
- Full home addresses (only to user themselves)
- Payment history (only to user/provider/admin)

### Tier 3: Safe to Expose (Low Risk)
- User ID / UUID
- First name only
- City / postal code
- Business name (provider)
- Public profile information (bio, rating)
- Booking status / timestamps

---

## Entity PII Masking Rules

### User Entity
```javascript
// ❌ NEVER expose in API responses:
{
  // password_hash,
  // ssn,
  // full_address (expose city/postal only)
}

// ✅ SAFE to expose:
{
  id,
  full_name,           // Only to self, provider in booking context
  email,               // Only to self or admin
  role,
  created_date
}
```

### Client Entity
```javascript
// ❌ NEVER expose:
// full_address (homes at risk)
// phone_number (unsolicited calls)

// ✅ SAFE:
{
  id,
  first_name,          // Providers see first name only
  review_count,
  rating
}
```

### Barber Entity
```javascript
// ❌ NEVER expose:
// personal_phone_number
// home_address

// ✅ SAFE:
{
  id,
  name,
  title,
  bio,
  rating,
  instagram_handle,
  is_independent,
  independent_location (city only, not street)
}
```

### Booking Entity
```javascript
// ❌ NEVER expose in list views:
// customer_notes (may contain sensitive info)

// ✅ SAFE:
{
  id,
  short_id,
  client_id,           // Only if requesting user is involved
  barber_id,
  start_time,
  end_time,
  status,
  price_at_booking,
  payment_status,
  financial_breakdown  // Only to involved parties + admin
}
```

### Payment Records
```javascript
// ❌ NEVER expose:
// full_card_number (store only last 4 digits)
// cvv
// billing_address
// cardholder_full_name

// ✅ SAFE:
{
  id,
  amount,
  currency,
  status,
  created_date,
  card_last_4: "****4242",
  card_brand: "visa"
}
```

---

## API Response Patterns

### Pattern 1: List Endpoints (Client Domain)
**Rule:** Never show full personal details of other users

```javascript
// ❌ WRONG - exposes PII
GET /api/barbers
[
  {
    id: '123',
    full_name: 'John Doe',           // ❌ Full name
    email: 'john@example.com',       // ❌ Email
    phone: '+1-555-123-4567',        // ❌ Full phone
    home_address: '123 Oak St...'    // ❌ Full address
  }
]

// ✅ CORRECT - safe attributes
GET /api/barbers
[
  {
    id: '123',
    name: 'John Doe',                // ✅ Safe (business context)
    title: 'Master Barber',
    bio: '20 years experience...',
    rating: 4.8,
    review_count: 142,
    instagram_handle: 'johndoe_barber'
  }
]
```

### Pattern 2: User Profile Endpoint (Authenticated)
**Rule:** Full details only to the user themselves

```javascript
// ✅ CORRECT - user requesting own profile
GET /api/users/me
{
  id: 'user-123',
  full_name: 'Jane Smith',
  email: 'jane@example.com',
  phone: '+1-555-987-6543',
  address: '456 Elm St, Austin, TX 78701',
  created_date: '2025-06-15'
}

// ❌ WRONG - another user cannot access PII
GET /api/users/456
{
  // Must return 403 Forbidden or masked data only
}
```

### Pattern 3: Booking Detail (Multi-Party)
**Rule:** Show only information relevant to each role

```javascript
// CLIENT VIEW
GET /api/bookings/BK-12345
{
  id: 'BK-12345',
  barber: {
    id: '123',
    name: 'John Doe',               // ✅ Safe
    rating: 4.8
    // ❌ NO phone, email, address
  },
  start_time: '2026-02-01T10:00:00Z',
  status: 'confirmed',
  price: 45,
  notes: 'Please confirm...'
}

// PROVIDER VIEW
GET /api/bookings/BK-12345
{
  id: 'BK-12345',
  client: {
    id: 'client-456',
    first_name: 'Jane',              // ✅ First name only
    // ❌ NO last name, email, phone, address
  },
  start_time: '2026-02-01T10:00:00Z',
  status: 'confirmed',
  price: 45,
  notes: 'Please confirm...'         // ✅ Provider sees booking notes
}

// ADMIN VIEW
GET /api/bookings/BK-12345
{
  id: 'BK-12345',
  client: {
    id: 'client-456',
    full_name: 'Jane Smith',         // ✅ Admin sees full name
    email: 'jane@example.com'        // ✅ Admin sees email
  },
  barber: {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com'        // ✅ Admin context
  },
  // ... full details
}
```

### Pattern 4: Payout/Financial (Provider)
**Rule:** Show earnings, not customer details

```javascript
// ✅ CORRECT - provider sees earnings summary
GET /api/provider/payouts
[
  {
    id: 'payout-789',
    period: '2026-01-01 to 2026-01-31',
    total_earned: 3450,
    total_bookings: 25,
    currency: 'USD',
    status: 'paid',
    paid_date: '2026-02-05'
    // ❌ NO customer names, emails, addresses
  }
]

// ✅ CORRECT - breakdown by service, not customer
GET /api/provider/earnings?period=january
{
  total: 3450,
  by_service: [
    { name: 'Haircut', earnings: 1200, count: 24 },
    { name: 'Beard Trim', earnings: 600, count: 12 }
  ]
  // ❌ NO identifiable customer information
}
```

---

## Implementation Rules

### Rule 1: Input Sanitization
All user inputs are sanitized to prevent XSS:
- HTML tags stripped
- Script tags escaped
- Special characters encoded

### Rule 2: Response Filtering
Use middleware/interceptors to filter PII:
```javascript
// Backend pattern
const sanitizeBookingForClient = (booking) => {
  const { client_notes, payment_method, ...safe } = booking;
  return {
    ...safe,
    client: {
      id: booking.client.id,
      first_name: booking.client.full_name.split(' ')[0]
      // Filter: no email, no full address
    }
  };
};
```

### Rule 3: Field-Level Access Control
```javascript
// Only expose fields user has permission to see
const hasAccessTo = (user, field) => {
  if (field === 'email') return user.id === resourceOwner.id || user.role === 'admin';
  if (field === 'full_address') return user.id === resourceOwner.id;
  if (field === 'phone') return user.role === 'admin' || user.id in [booking.client_id, booking.barber_id];
  return true; // Public field
};
```

### Rule 4: Audit Logging
Log all PII access:
```javascript
// When admin views sensitive customer data
await logAccess({
  admin_id: user.id,
  action: 'VIEW_CUSTOMER_PII',
  target: customer.id,
  fields: ['email', 'phone', 'address'],
  timestamp: new Date(),
  ip_address: request.ip
});
```

---

## Entity Schema Review

### User Entity
- ✅ No password hashes exposed
- ✅ No sensitive auth tokens
- ✅ Full name only to self/admin
- ✅ Email only to self/admin

### Barber Entity
- ✅ No personal phone numbers
- ✅ No home addresses (business location ok)
- ✅ Public profile fields only (bio, rating, instagram)

### Booking Entity
- ✅ Client notes visible only to provider + admin
- ✅ Financial breakdown only to involved parties
- ✅ No payment methods in responses (use references)

### Payment Entity
- ✅ Card details masked (last 4 only)
- ✅ Billing address never exposed
- ✅ Cardholder name never exposed

---

## Testing Checklist

- ✅ List endpoints hide individual user emails/phones/addresses
- ✅ Profile endpoints block unauthorized access
- ✅ Booking endpoints show role-appropriate details
- ✅ Admin endpoints include necessary PII for governance
- ✅ Financial summaries exclude customer identifiers
- ✅ Error messages don't leak PII (no "user not found" for privacy)
- ✅ Logs mask PII in error traces
- ✅ Exports (CSV/PDF) only to authorized users
- ✅ API documentation doesn't include sample PII

---

## Compliance Notes

### GDPR Alignment
- Right to be forgotten: PII deleted on request
- Data portability: Users can export their data
- Consent tracking: Email access logged

### CCPA Alignment
- No sale of personal information
- Consumer rights honored
- Opt-out mechanism functional

---

## Audit Sign-Off

**Item #7: No PII exposed in API responses** ✅ COMPLETE

- Tier 1-3 PII classification applied
- Entity schemas reviewed
- API response patterns documented
- Multi-role access control specified
- Audit logging plan established
- Compliance frameworks considered