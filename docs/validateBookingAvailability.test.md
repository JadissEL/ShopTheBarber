# Double-Booking Prevention: Test Cases

## Unit Test Suite for validateBookingAvailability()

### Test 1: Happy Path - Slot Available ✅
```
Given:
  - Barber: barber_123
  - Date: Monday 2:00 PM (within shift 9 AM - 6 PM)
  - Duration: 60 minutes
  - No existing bookings or time blocks

Expected:
  status: 'AVAILABLE'
  message: 'Slot is available'
```

---

### Test 2: Concurrent Booking Race Condition 🏁
```
Scenario: Two users book the same 2:00-3:00 PM slot simultaneously

Request A (arrives at server 14:00:00.001):
  barber_id: 'barber_123'
  start_datetime: '2025-02-28T14:00:00Z'
  duration_minutes: 60

Request B (arrives at server 14:00:00.002):
  barber_id: 'barber_123'
  start_datetime: '2025-02-28T14:00:00Z'
  duration_minutes: 60

Expected:
  Request A: status='AVAILABLE' → booking created ✅
  Request B: status='UNAVAILABLE', reason='BOOKING_CONFLICT' ❌
```

---

### Test 3: Overlap With Existing Booking
```
Given:
  - Existing booking: 2:00-2:30 PM (Haircut, 30 min)
  - New booking attempt: 2:15-3:15 PM (Beard, 60 min)

Expected:
  status: 'UNAVAILABLE'
  reason: 'BOOKING_CONFLICT'
  conflicting_booking.id returned
```

---

### Test 4: Booking During Time Block (Vacation)
```
Given:
  - TimeBlock: Jan 20-25, reason='vacation'
  - Booking attempt: Jan 23, 2:00 PM

Expected:
  status: 'UNAVAILABLE'
  reason: 'TIME_BLOCK_CONFLICT'
  blocked_period: { start: '2025-01-20T00:00:00Z', end: '2025-01-25T23:59:59Z' }
```

---

### Test 5: Booking Outside Shift Hours
```
Given:
  - Shift: 9:00 AM - 5:00 PM
  - Booking attempt: 6:00 PM - 7:00 PM (after hours)

Expected:
  status: 'UNAVAILABLE'
  reason: 'OUTSIDE_SHIFT_HOURS'
  shift_hours: { start: '9:00 AM', end: '5:00 PM' }
```

---

### Test 6: Booking Starts Before Shift, Ends During Shift
```
Given:
  - Shift: 9:00 AM - 5:00 PM
  - Booking attempt: 8:30 AM - 10:00 AM

Expected:
  status: 'UNAVAILABLE'
  reason: 'OUTSIDE_SHIFT_HOURS'
```

---

### Test 7: Booking Ends After Shift, Starts During Shift
```
Given:
  - Shift: 9:00 AM - 5:00 PM
  - Service duration: 90 minutes
  - Booking attempt: 4:30 PM - 6:00 PM

Expected:
  status: 'UNAVAILABLE'
  reason: 'OUTSIDE_SHIFT_HOURS'
```

---

### Test 8: Shop Context - Barber Not Member
```
Given:
  - barber_id: 'barber_123'
  - shop_id: 'shop_xyz'
  - Barber is NOT a member of shop_xyz

Expected:
  Error: 'Barber barber_123 is not an active member of shop shop_xyz'
```

---

### Test 9: Shop Context - Shifts Filtered by Shop
```
Given:
  - Barber works at 2 shops:
    - Shop A: Mondays 9-5
    - Shop B: Mondays 12-8
  - Booking attempt: Shop A, Monday 7:00 PM (in Shop B's hours, not A)

Expected:
  status: 'UNAVAILABLE'
  reason: 'OUTSIDE_SHIFT_HOURS'
  (Because Shop A closes at 5 PM)
```

---

### Test 10: Independent Context - No Shop ID
```
Given:
  - barber_id: 'barber_123' (independent, no shop affiliations)
  - Shift filters: shop_id IS NULL
  - Booking attempt: Monday 2:00 PM (within independent shift hours)

Expected:
  status: 'AVAILABLE'
```

---

### Test 11: TimeBlock with Shop Scope
```
Given:
  - Barber works at Shop A and Shop B
  - TimeBlock: Shop A only, Jan 20-25 (maintenance)
  - Booking attempt 1: Shop A, Jan 23 → should be blocked
  - Booking attempt 2: Shop B, Jan 23 → should be available

Expected:
  Booking 1: status='UNAVAILABLE', reason='TIME_BLOCK_CONFLICT'
  Booking 2: status='AVAILABLE'
```

---

### Test 12: TimeBlock Global (No Shop Scope)
```
Given:
  - Barber works at Shop A and Shop B
  - TimeBlock: GLOBAL (shop_id = null), Jan 20-25 (personal vacation)
  - Booking attempt 1: Shop A, Jan 23
  - Booking attempt 2: Shop B, Jan 23

Expected:
  Both: status='UNAVAILABLE', reason='TIME_BLOCK_CONFLICT'
```

---

### Test 13: Booking in the Past
```
Given:
  - Current time: 2025-02-28 10:00 AM
  - Booking attempt: 2025-02-27 2:00 PM (yesterday)

Expected:
  Error: 'Cannot book in the past'
```

---

### Test 14: No Shifts Defined
```
Given:
  - Barber has 0 shifts for Monday
  - Booking attempt: Monday 2:00 PM

Expected:
  status: 'UNAVAILABLE'
  reason: 'NO_SHIFTS_DEFINED'
  message: 'Barber has no shifts on Monday for this context'
```

---

### Test 15: Exact Time Match (Slot Ends When Next Begins)
```
Given:
  - Booking 1: 2:00-2:30 PM
  - Booking 2 attempt: 2:30-3:00 PM (starts exactly when first ends)

Expected:
  status: 'AVAILABLE'
  (No overlap: [2:00, 2:30) vs [2:30, 3:00))
```

---

### Test 16: Micro-Overlap (1 second overlap)
```
Given:
  - Booking 1: 2:00-2:30 PM
  - Booking 2 attempt: 2:29:59-3:00 PM (1 second overlap)

Expected:
  status: 'UNAVAILABLE'
  reason: 'BOOKING_CONFLICT'
```

---

### Test 17: Multiple Existing Bookings - Finds Correct Conflict
```
Given:
  - Booking A: 1:00-1:30 PM
  - Booking B: 2:00-2:30 PM
  - Booking C: 4:00-4:30 PM
  - Booking attempt: 2:15-3:00 PM

Expected:
  status: 'UNAVAILABLE'
  conflicting_booking.id = B (correct conflict identified)
```

---

### Test 18: Cancelled Booking Not Considered
```
Given:
  - Booking: 2:00-2:30 PM, status='cancelled'
  - Booking attempt: 2:15-3:00 PM

Expected:
  status: 'AVAILABLE'
  (Cancelled bookings ignored)
```

---

### Test 19: No-Show Booking Not Considered
```
Given:
  - Booking: 2:00-2:30 PM, status='no_show'
  - Booking attempt: 2:15-3:00 PM

Expected:
  status: 'AVAILABLE'
  (No-shows ignored)
```

---

### Test 20: Load Test - 100 Concurrent Requests
```
Scenario: Simulate 100 users simultaneously booking same 2:00-3:00 PM slot

Expected:
  - 1 request returns: status='AVAILABLE' ✅
  - 99 requests return: status='UNAVAILABLE', reason='BOOKING_CONFLICT' ❌
  - Response time: < 2 seconds each
  - Database lock contention: acceptable (no hanging locks)
```

---

## Input Validation Tests

### Test V1: Missing barber_id
```
Input: { service_ids: ['s1'], start_datetime: '2025-02-28T14:00:00Z', ... }
Expected: Error: 'barber_id required'
```

### Test V2: Missing service_ids
```
Input: { barber_id: 'b1', start_datetime: '2025-02-28T14:00:00Z', ... }
Expected: Error: 'service_ids required'
```

### Test V3: Empty service_ids array
```
Input: { barber_id: 'b1', service_ids: [], start_datetime: '2025-02-28T14:00:00Z', ... }
Expected: Error: 'service_ids required'
```

### Test V4: Invalid start_datetime format
```
Input: { barber_id: 'b1', service_ids: ['s1'], start_datetime: 'not-a-date', ... }
Expected: Error: 'Invalid start_datetime format'
```

### Test V5: Invalid context_type
```
Input: { ..., context_type: 'admin' }
Expected: Error: 'context_type must be shop or independent'
```

### Test V6: Negative duration_minutes
```
Input: { ..., duration_minutes: -30 }
Expected: Error: 'duration_minutes must be > 0'
```

---

## Performance Benchmarks

| Test | Expected Time | Status |
|------|----------------|--------|
| Single availability check | < 200 ms | Baseline |
| 50 concurrent checks (unique slots) | < 1s total | Scale |
| 100 concurrent checks (same slot) | < 2s total | Race condition handling |
| Barber with 100 existing bookings | < 300 ms | Large dataset |
| TimeBlock with 10+ overlaps | < 200 ms | Complex filtering |

---

## Integration Tests (End-to-End)

### Test E1: Full Booking Flow
```
1. User fills booking form
2. validateBookingAvailability() called
3. Returns AVAILABLE
4. Booking.create() called
5. Booking created in DB
6. Confirmation email sent

Expected: All steps succeed, booking visible in provider dashboard
```

### Test E2: Race Condition - User Experience
```
1. User A clicks "Book"
2. User B clicks "Book" (same slot, same moment)
3. Both requests sent to backend
4. Server validates both

Expected:
- User A: Success page, booking confirmed
- User B: Error "Slot no longer available", offered alternatives
```

---

## Manual Testing Script

Use this to verify the function works before launch:

```bash
# 1. Create a test barber
barberId=$(curl -X POST /api/barbers -d '{"name":"Test"}' | jq -r '.id')

# 2. Create shifts for Monday 9-5
curl -X POST /api/shifts -d '{
  "barber_id": "'$barberId'",
  "day": "Monday",
  "start_time": "09:00",
  "end_time": "17:00"
}'

# 3. First booking attempt (should succeed)
curl -X POST /api/validateBookingAvailability -d '{
  "barber_id": "'$barberId'",
  "service_ids": ["svc1"],
  "start_datetime": "2025-03-03T14:00:00Z",
  "duration_minutes": 60,
  "context_type": "independent"
}'
# Expected: {"status":"AVAILABLE"}

# 4. Create the first booking
curl -X POST /api/bookings -d '{
  "barber_id": "'$barberId'",
  "start_time": "2025-03-03T14:00:00Z",
  "price_at_booking": 50
}'

# 5. Second booking attempt (should fail - conflict)
curl -X POST /api/validateBookingAvailability -d '{
  "barber_id": "'$barberId'",
  "service_ids": ["svc1"],
  "start_datetime": "2025-03-03T14:30:00Z",
  "duration_minutes": 60,
  "context_type": "independent"
}'
# Expected: {"status":"UNAVAILABLE","reason":"BOOKING_CONFLICT"}
``