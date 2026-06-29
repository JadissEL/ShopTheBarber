import { format, parseISO } from 'date-fns';

export type BookingRow = Record<string, unknown>;

function formatStartFields(startTime: unknown): { date_text: string | null; time_text: string | null } {
    if (!startTime || typeof startTime !== 'string') {
        return { date_text: null, time_text: null };
    }
    try {
        const start = parseISO(startTime);
        if (Number.isNaN(start.getTime())) return { date_text: null, time_text: null };
        return {
            date_text: format(start, 'PPP'),
            time_text: format(start, 'h:mm a'),
        };
    } catch {
        return { date_text: null, time_text: null };
    }
}

export function resolveVisitType(row: BookingRow): 'shop' | 'mobile' {
    const vt = row.visit_type;
    return vt === 'mobile' ? 'mobile' : 'shop';
}

export function resolveLocationLabel(row: BookingRow): string {
    const locationText = typeof row.location_text === 'string' ? row.location_text.trim() : '';
    if (locationText) return locationText;
    if (resolveVisitType(row) === 'mobile') return 'At client location';
    return 'At the shop';
}

/** Normalize booking rows for API clients (date/time/location aliases). */
export function serializeBookingRow(row: BookingRow): BookingRow {
    const formatted = formatStartFields(row.start_time);
    const dateText =
        (typeof row.date_text === 'string' && row.date_text.trim()) || formatted.date_text;
    const timeText =
        (typeof row.time_text === 'string' && row.time_text.trim()) || formatted.time_text;
    const visitType = resolveVisitType(row);
    const location = resolveLocationLabel(row);
    const travelFee =
        typeof row.travel_fee_amount === 'number' && !Number.isNaN(row.travel_fee_amount)
            ? row.travel_fee_amount
            : null;

    const rebookServiceIds = extractRebookServiceIds(row);

    return {
        ...row,
        visit_type: visitType,
        date_text: dateText,
        time_text: timeText,
        location,
        is_at_home: visitType === 'mobile',
        is_group: row.booking_type === 'group',
        travel_fee_amount: travelFee,
        travel_distance_km:
            typeof row.travel_distance_km === 'number' ? row.travel_distance_km : null,
        travel_zone_label:
            typeof row.travel_zone_label === 'string' ? row.travel_zone_label : null,
        rebook_service_ids: rebookServiceIds,
        is_guest_booking: !row.client_id && !!(row.client_phone || row.guest_access_token),
    };
}

function extractRebookServiceIds(row: BookingRow): string[] {
    if (Array.isArray(row.rebook_service_ids)) {
        return row.rebook_service_ids.filter((id): id is string => typeof id === 'string');
    }
    const raw = row.service_snapshot;
    if (!raw) return [];
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!parsed?.services || !Array.isArray(parsed.services)) return [];
        return parsed.services
            .map((s: { id?: string; service_id?: string }) => s.service_id || s.id)
            .filter((id: unknown): id is string => typeof id === 'string' && id.length > 0);
    } catch {
        return [];
    }
}

export function serializeBookingRows(rows: BookingRow[]): BookingRow[] {
    return rows.map(serializeBookingRow);
}
