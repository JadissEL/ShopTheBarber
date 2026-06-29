import type { HabitBookingRow } from './habitPattern';

function parseServiceIdsFromSnapshot(raw: string | null | undefined): string[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw) as { services?: Array<{ id?: string; service_id?: string }> };
        if (!Array.isArray(parsed?.services)) return [];
        return parsed.services
            .map((s) => s.service_id || s.id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0);
    } catch {
        return [];
    }
}

export function buildRebookFlowUrl(booking: HabitBookingRow, frontendBase?: string): string {
    const base = (frontendBase || process.env.FRONTEND_URL || 'https://shop-the-barber.vercel.app').replace(
        /\/$/,
        ''
    );
    const params = new URLSearchParams();
    params.set('barberId', booking.barber_id);
    if (booking.shop_id) params.set('shopId', booking.shop_id);
    if (!booking.shop_id) params.set('context', 'independent');
    if (booking.visit_type === 'mobile') params.set('location', 'mobile');
    if (booking.booking_type === 'group') params.set('group', '1');

    const serviceIds = parseServiceIdsFromSnapshot(booking.service_snapshot);
    if (serviceIds.length === 1) {
        params.set('serviceId', serviceIds[0]);
    } else if (serviceIds.length > 1) {
        params.set('serviceIds', serviceIds.join(','));
    }

    params.set('rebook', '1');
    params.set('fromBooking', booking.id);
    return `${base}/BookingFlow?${params.toString()}`;
}
