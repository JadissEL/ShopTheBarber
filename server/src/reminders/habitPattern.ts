/** Learn each client's usual booking rhythm from completed visits. */

export type HabitBookingRow = {
    id: string;
    start_time: string;
    barber_id: string;
    barber_name: string | null;
    service_name: string | null;
    shop_id: string | null;
    visit_type: string | null;
    booking_type: string | null;
    service_snapshot: string | null;
};

export type ClientHabitPattern = {
    client_id: string;
    visit_count: number;
    median_interval_days: number;
    preferred_weekday: number | null;
    preferred_weekday_name: string | null;
    last_visit_at: Date;
    predicted_next_due_at: Date;
    last_booking: HabitBookingRow;
    usual_service_name: string;
    usual_barber_name: string;
};

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const MIN_VISITS = 2;
const MIN_INTERVAL_DAYS = 7;
const MAX_INTERVAL_DAYS = 90;
const DEFAULT_INTERVAL_DAYS = 21;

export function parseBookingStartTime(iso: string): Date | null {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? null : d;
}

function median(values: number[]): number {
    if (values.length === 0) return DEFAULT_INTERVAL_DAYS;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

/** Days between consecutive visits (oldest newest), ignoring gaps under MIN_INTERVAL_DAYS. */
export function computeVisitIntervalsDays(bookings: HabitBookingRow[]): number[] {
    const dates = bookings
        .map((b) => parseBookingStartTime(b.start_time))
        .filter((d): d is Date => d !== null)
        .sort((a, b) => a.getTime() - b.getTime());

    const intervals: number[] = [];
    for (let i = 1; i < dates.length; i += 1) {
        const days = (dates[i]!.getTime() - dates[i - 1]!.getTime()) / 86_400_000;
        if (days >= MIN_INTERVAL_DAYS) intervals.push(days);
    }
    return intervals;
}

/** Most frequent weekday when client has 3+ dated visits. */
export function computePreferredWeekday(bookings: HabitBookingRow[]): number | null {
    if (bookings.length < 3) return null;
    const counts = new Array<number>(7).fill(0);
    for (const b of bookings) {
        const d = parseBookingStartTime(b.start_time);
        if (d) counts[d.getDay()]! += 1;
    }
    let best = 0;
    for (let i = 1; i < 7; i += 1) {
        if (counts[i]! > counts[best]!) best = i;
    }
    return best;
}

function mostFrequentServiceName(bookings: HabitBookingRow[]): string {
    const counts = new Map<string, number>();
    for (const b of bookings) {
        const name = b.service_name?.trim() || 'grooming appointment';
        counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    let best = 'grooming appointment';
    let max = 0;
    for (const [name, count] of counts) {
        if (count > max) {
            max = count;
            best = name;
        }
    }
    return best;
}

export function analyzeClientHabit(
    clientId: string,
    bookings: HabitBookingRow[],
    options?: { defaultIntervalDays?: number }
): ClientHabitPattern | null {
    if (bookings.length < MIN_VISITS) return null;

    const sorted = [...bookings].sort((a, b) => {
        const da = parseBookingStartTime(a.start_time)?.getTime() ?? 0;
        const db = parseBookingStartTime(b.start_time)?.getTime() ?? 0;
        return db - da;
    });

    const lastBooking = sorted[0]!;
    const lastVisitAt = parseBookingStartTime(lastBooking.start_time);
    if (!lastVisitAt) return null;

    const intervals = computeVisitIntervalsDays(sorted);
    const rawMedian =
        intervals.length >= 1
            ? median(intervals)
            : (options?.defaultIntervalDays ?? DEFAULT_INTERVAL_DAYS);
    const medianIntervalDays = Math.min(
        MAX_INTERVAL_DAYS,
        Math.max(MIN_INTERVAL_DAYS, Math.round(rawMedian))
    );

    const predictedNextDueAt = new Date(lastVisitAt.getTime() + medianIntervalDays * 86_400_000);
    const weekday = computePreferredWeekday(sorted);

    return {
        client_id: clientId,
        visit_count: sorted.length,
        median_interval_days: medianIntervalDays,
        preferred_weekday: weekday,
        preferred_weekday_name: weekday !== null ? WEEKDAYS[weekday]! : null,
        last_visit_at: lastVisitAt,
        predicted_next_due_at: predictedNextDueAt,
        last_booking: lastBooking,
        usual_service_name: mostFrequentServiceName(sorted),
        usual_barber_name: lastBooking.barber_name?.trim() || 'your barber',
    };
}

export function isDueForRebookNudge(
    pattern: ClientHabitPattern,
    now: Date,
    options?: { leadDays?: number; graceDays?: number }
): boolean {
    const leadDays =
        options?.leadDays ??
        (parseFloat(process.env.REBOOK_NUDGE_LEAD_DAYS || '2') || 2);
    const graceDays =
        options?.graceDays ??
        (parseFloat(process.env.REBOOK_NUDGE_GRACE_DAYS || '3') || 3);

    const windowStart = new Date(pattern.predicted_next_due_at.getTime() - leadDays * 86_400_000);
    const windowEnd = new Date(pattern.predicted_next_due_at.getTime() + graceDays * 86_400_000);
    return now >= windowStart && now <= windowEnd;
}

/** Skip if we already texted since the client's last completed visit. */
export function alreadyNudgedSinceLastVisit(
    rebookNudgeSentAt: string | null | undefined,
    lastVisitAt: Date
): boolean {
    if (!rebookNudgeSentAt?.trim()) return false;
    const sent = new Date(rebookNudgeSentAt);
    if (Number.isNaN(sent.getTime())) return false;
    return sent >= lastVisitAt;
}
