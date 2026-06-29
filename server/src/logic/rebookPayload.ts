import { prisma } from '../db/prisma';
import { serializeBookingRow } from './bookingSerialize';

function parseServiceSnapshot(raw: string | null | undefined): string[] {
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

export async function buildRebookPayloadForBooking(bookingId: string) {
    const booking = await prisma.bookings.findUnique({
        where: { id: bookingId },
        include: {
            booking_services: { select: { service_id: true } },
        },
    });
    if (!booking) return null;

    const fromJoin = booking.booking_services.map((r) => r.service_id);
    const fromSnapshot = parseServiceSnapshot(booking.service_snapshot);
    const serviceIds = fromJoin.length > 0 ? fromJoin : fromSnapshot;

    const serialized = serializeBookingRow(booking);
    const isGroup = booking.booking_type === 'group';
    const visitType = booking.visit_type === 'mobile' ? 'mobile' : 'shop';
    const shopId = booking.shop_id ?? null;
    const context = shopId ? 'shop' : 'independent';

    return {
        booking_id: booking.id,
        barber_id: booking.barber_id,
        shop_id: shopId,
        context,
        visit_type: visitType,
        service_ids: serviceIds,
        is_group: isGroup,
        party_size: booking.party_size ?? null,
        group_event_label: booking.group_event_label ?? null,
        location_text: booking.location_text ?? null,
        client_latitude: booking.client_latitude ?? null,
        client_longitude: booking.client_longitude ?? null,
        payment_method: booking.payment_method ?? 'online',
        barber_name: booking.barber_name ?? null,
        service_name: booking.service_name ?? null,
        ...serialized,
        rebook_service_ids: serviceIds,
    };
}
