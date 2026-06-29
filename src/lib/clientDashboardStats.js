const SPEND_STATUSES = new Set(['completed', 'confirmed', 'pending']);

function bookingDate(booking) {
  const raw = booking.start_time || booking.date_text;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function bookingSpend(booking) {
  const price = Number(booking.price_at_booking);
  if (!Number.isFinite(price) || price <= 0) return 0;
  if (booking.status === 'cancelled' || booking.status === 'no_show') return 0;
  return price;
}

function monthRange(year, month) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/** Sum spend for bookings in a calendar month. */
export function sumSpendInMonth(bookings, year, month) {
  const { start, end } = monthRange(year, month);
  return (bookings || []).reduce((sum, b) => {
    if (!SPEND_STATUSES.has(b.status)) return sum;
    const d = bookingDate(b);
    if (!d || d < start || d > end) return sum;
    return sum + bookingSpend(b);
  }, 0);
}

/** Current vs prior month spend with trend label. */
export function computeMonthlySpending(bookings) {
  const now = new Date();
  const current = sumSpendInMonth(bookings, now.getFullYear(), now.getMonth());
  const priorDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prior = sumSpendInMonth(bookings, priorDate.getFullYear(), priorDate.getMonth());

  let trend = '-';
  if (prior > 0) {
    const pct = Math.round(((current - prior) / prior) * 100);
    trend = pct >= 0 ? `+${pct}%` : `${pct}%`;
  } else if (current > 0) {
    trend = 'New';
  }

  return {
    amount: current.toFixed(2),
    trend,
    hasSpend: current > 0 || prior > 0,
  };
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Most frequent booking weekday when user has 3+ bookings with dates. */
export function computePreferredBookingDay(bookings) {
  const counts = new Array(7).fill(0);
  let total = 0;
  for (const b of bookings || []) {
    const d = bookingDate(b);
    if (!d) continue;
    counts[d.getDay()] += 1;
    total += 1;
  }
  if (total < 3) return null;
  let best = 0;
  for (let i = 1; i < 7; i += 1) {
    if (counts[i] > counts[best]) best = i;
  }
  return WEEKDAYS[best];
}

/** Unique barber IDs from booking history, most recent first. */
export function topBookedBarberIds(bookings, limit = 3) {
  const seen = new Set();
  const ids = [];
  const sorted = [...(bookings || [])].sort((a, b) => {
    const da = bookingDate(a)?.getTime() ?? 0;
    const db = bookingDate(b)?.getTime() ?? 0;
    return db - da;
  });
  for (const b of sorted) {
    if (!b.barber_id || seen.has(b.barber_id)) continue;
    seen.add(b.barber_id);
    ids.push(b.barber_id);
    if (ids.length >= limit) break;
  }
  return ids;
}

export function resolveTopBarbers(bookings, barbers, limit = 3) {
  const ids = topBookedBarberIds(bookings, limit);
  return ids
    .map((id) => barbers.find((b) => b.id === id))
    .filter(Boolean);
}
