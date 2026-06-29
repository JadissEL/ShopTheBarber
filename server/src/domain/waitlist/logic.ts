import crypto from 'crypto';
import { addMinutes, format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { prisma } from '../../db/prisma';
import { createBookingLogic } from '../../logic/booking';
import { sendEmail } from '../../logic/email';
import { calculateBookingQuote } from '../../pricing/logic';
import { isFinancialTrustSchemaError } from '../schemaGuard';
import { serializeWaitlistEntries, serializeWaitlistOffers } from './serialize';
import { parseWaitlistServiceIds, serializeWaitlistServiceIds } from './serviceIds';

export const WAITLIST_OFFER_MINUTES = 15;

export async function joinWaitlist(params: {
    clientId: string;
    barberId: string;
    shopId?: string | null;
    serviceId?: string | null;
    serviceIds?: string[];
    slotStart: string;
    preferredTime?: string | null;
}) {
    const existing = await prisma.waiting_list_entries.findFirst({
        where: {
            client_id: params.clientId,
            barber_id: params.barberId,
            slot_start: params.slotStart,
            status: { in: ['pending', 'offered'] },
        },
    });
    if (existing) {
        const [serialized] = await serializeWaitlistEntries([existing], false);
        return serialized;
    }

    const count = await prisma.waiting_list_entries.count({
        where: {
            barber_id: params.barberId,
            slot_start: params.slotStart,
            status: { in: ['pending', 'offered'] },
        },
    });

    const serviceIdsInput = [
        ...(Array.isArray(params.serviceIds) ? params.serviceIds : []),
        ...(params.serviceId ? [params.serviceId] : []),
    ];
    const { service_id, service_ids_json } = serializeWaitlistServiceIds(serviceIdsInput);

    const created = await prisma.waiting_list_entries.create({
        data: {
            id: crypto.randomUUID(),
            client_id: params.clientId,
            barber_id: params.barberId,
            shop_id: params.shopId ?? null,
            service_id,
            service_ids_json,
            slot_start: params.slotStart,
            preferred_time: params.preferredTime ?? null,
            position: count + 1,
            status: 'pending',
        },
    });
    const [serialized] = await serializeWaitlistEntries([created], false);
    return serialized;
}

export async function createWaitlistOfferForSlot(params: {
    barberId: string;
    slotStart: string;
    slotEnd?: string | null;
}) {
    const entry = await prisma.waiting_list_entries.findFirst({
        where: {
            barber_id: params.barberId,
            slot_start: params.slotStart,
            status: 'pending',
        },
        orderBy: { position: 'asc' },
    });
    if (!entry) return null;

    const expiresAt = addMinutes(new Date(), WAITLIST_OFFER_MINUTES).toISOString();
    const offer = await prisma.waitlist_offers.create({
        data: {
            id: crypto.randomUUID(),
            waitlist_entry_id: entry.id,
            slot_start: params.slotStart,
            slot_end: params.slotEnd ?? null,
            status: 'pending',
            offer_expires_at: expiresAt,
        },
    });

    await prisma.waiting_list_entries.update({
        where: { id: entry.id },
        data: { status: 'offered' },
    });

    if (entry.client_id) {
        const [barber, service, client] = await Promise.all([
            entry.barber_id
                ? prisma.barbers.findUnique({ where: { id: entry.barber_id }, select: { name: true } })
                : null,
            entry.service_id
                ? prisma.services.findUnique({ where: { id: entry.service_id }, select: { name: true } })
                : null,
            prisma.users.findUnique({
                where: { id: entry.client_id },
                select: { email: true, full_name: true },
            }),
        ]);
        const slotLabel = format(new Date(params.slotStart), 'EEE d MMM · h:mm a', { locale: enUS });
        const barberLabel = barber?.name ?? 'your barber';
        const serviceLabel = service?.name ? ` for ${service.name}` : '';
        await prisma.notifications.create({
            data: {
                id: crypto.randomUUID(),
                user_id: entry.client_id,
                title: 'Your waitlist slot is ready',
                content: `${barberLabel}${serviceLabel} · ${slotLabel}. You have ${WAITLIST_OFFER_MINUTES} minutes to accept.`,
                type: 'waitlist',
            },
        });
        if (client?.email) {
            sendEmail({
                to: client.email,
                subject: `Waitlist slot available — ${WAITLIST_OFFER_MINUTES} min to accept`,
                template: 'waitlist_offer',
                data: {
                    clientName: client.full_name,
                    barberName: barber?.name,
                    serviceName: service?.name,
                    slotLabel,
                    minutes: WAITLIST_OFFER_MINUTES,
                },
            }).catch(() => { /* non-blocking */ });
        }
    }

    return { offer, entry };
}

export async function onBookingCancelledTriggerWaitlist(booking: {
    barber_id: string;
    start_time: string;
    end_time: string;
}) {
    return createWaitlistOfferForSlot({
        barberId: booking.barber_id,
        slotStart: booking.start_time,
        slotEnd: booking.end_time,
    });
}

async function buildWaitlistAcceptPayload(
    offer: { slot_start: string },
    entry: {
        barber_id: string | null;
        shop_id: string | null;
        service_id: string | null;
        service_ids_json?: string | null;
        slot_start: string | null;
    },
    clientPayload: Record<string, unknown>,
    clientId: string
): Promise<Record<string, unknown>> {
    const slotStart = new Date(offer.slot_start || entry.slot_start || Date.now());
    if (Number.isNaN(slotStart.getTime())) {
        throw new Error('Invalid slot time on waitlist offer');
    }

    const hasClientQuote =
        typeof clientPayload.date_text === 'string' &&
        typeof clientPayload.time_text === 'string' &&
        typeof clientPayload.price_at_booking === 'number' &&
        (Array.isArray(clientPayload.service_ids)
            ? clientPayload.service_ids.length > 0
            : Boolean(
                  (clientPayload.service_snapshot as { services?: unknown[] } | undefined)?.services
                      ?.length
              ));

    if (hasClientQuote) {
        return {
            ...clientPayload,
            barber_id: entry.barber_id,
            shop_id: entry.shop_id,
            client_id: clientId,
        };
    }

    if (!entry.barber_id) throw new Error('Waitlist entry is missing barber');

    const serviceIds: string[] = [];
    if (Array.isArray(clientPayload.service_ids)) {
        serviceIds.push(
            ...clientPayload.service_ids.filter((id: unknown) => typeof id === 'string')
        );
    }
    if (serviceIds.length === 0) {
        serviceIds.push(...parseWaitlistServiceIds(entry));
    }
    if (serviceIds.length === 0) {
        throw new Error('Waitlist entry is missing a service; please book manually or rejoin the waitlist');
    }

    const quote = await calculateBookingQuote({
        service_ids: serviceIds,
        barber_id: entry.barber_id,
        shop_id: entry.shop_id ?? null,
        shop_member_id: null,
        user_id: clientId,
        promo_code: null,
        context_type: entry.shop_id ? 'shop' : 'independent',
    });

    const service = await prisma.services.findUnique({
        where: { id: serviceIds[0] },
        select: { name: true },
    });

    const serviceLabel =
        serviceIds.length > 1
            ? `${service?.name ?? 'Service'} + ${serviceIds.length - 1} more`
            : service?.name ?? 'Barber Service';

    return {
        ...clientPayload,
        barber_id: entry.barber_id,
        shop_id: entry.shop_id,
        client_id: clientId,
        service_ids: serviceIds,
        date_text: format(slotStart, 'PPP', { locale: enUS }),
        time_text: format(slotStart, 'h:mm a', { locale: enUS }),
        duration_at_booking: quote.total_duration_minutes,
        price_at_booking: quote.final_price,
        context_type: entry.shop_id ? 'shop' : 'independent',
        status: 'pending',
        payment_status: 'unpaid',
        payment_method:
            typeof clientPayload.payment_method === 'string' ? clientPayload.payment_method : 'card',
        service_name: serviceLabel,
    };
}

export async function acceptWaitlistOffer(params: {
    offerId: string;
    clientId: string;
    bookingPayload: Record<string, unknown>;
}) {
    const offer = await prisma.waitlist_offers.findUnique({
        where: { id: params.offerId },
        include: { waitlist_entry: true },
    });
    if (!offer || offer.status !== 'pending') throw new Error('Offer not found or no longer valid');
    if (offer.waitlist_entry?.client_id !== params.clientId) throw new Error('Unauthorized');
    if (new Date(offer.offer_expires_at).getTime() < Date.now()) {
        await expireWaitlistOffer(offer.id);
        throw new Error('Offer has expired');
    }

    const entry = offer.waitlist_entry;
    if (!entry) throw new Error('Waitlist entry not found');

    const bookingPayload = await buildWaitlistAcceptPayload(
        offer,
        entry,
        params.bookingPayload,
        params.clientId
    );

    const booking = await createBookingLogic({
        ...bookingPayload,
        client_id: params.clientId,
        barber_id: entry.barber_id,
        shop_id: entry.shop_id,
    });

    try {
        await prisma.$transaction([
            prisma.waitlist_offers.update({
                where: { id: offer.id },
                data: { status: 'accepted' },
            }),
            prisma.waiting_list_entries.update({
                where: { id: offer.waitlist_entry_id },
                data: { status: 'booked' },
            }),
        ]);
    } catch (err) {
        await prisma.bookings
            .update({
                where: { id: booking.id },
                data: { status: 'cancelled', updated_at: new Date().toISOString() },
            })
            .catch(() => { /* best effort */ });
        throw err;
    }

    return booking;
}

export async function expireWaitlistOffer(offerId: string) {
    const offer = await prisma.waitlist_offers.findUnique({
        where: { id: offerId },
        include: { waitlist_entry: true },
    });
    if (!offer || offer.status !== 'pending') return null;

    await prisma.waitlist_offers.update({
        where: { id: offerId },
        data: { status: 'expired' },
    });
    await prisma.waiting_list_entries.update({
        where: { id: offer.waitlist_entry_id },
        data: { status: 'pending' },
    });

    if (offer.waitlist_entry) {
        return createWaitlistOfferForSlot({
            barberId: offer.waitlist_entry.barber_id!,
            slotStart: offer.slot_start,
            slotEnd: offer.slot_end,
        });
    }
    return null;
}

export async function listMyPendingWaitlistOffers(clientId: string) {
    const now = new Date().toISOString();
    const offers = await prisma.waitlist_offers.findMany({
        where: {
            status: 'pending',
            offer_expires_at: { gt: now },
            waitlist_entry: { client_id: clientId },
        },
        include: {
            waitlist_entry: true,
        },
        orderBy: { offer_expires_at: 'asc' },
        take: 20,
    });
    return serializeWaitlistOffers(offers);
}

export async function listMyWaitlistEntries(clientId: string) {
    const entries = await prisma.waiting_list_entries.findMany({
        where: {
            client_id: clientId,
            status: { in: ['pending', 'offered'] },
        },
        orderBy: [{ slot_start: 'asc' }, { position: 'asc' }],
        take: 50,
    });
    return serializeWaitlistEntries(entries, false);
}

export async function listBarberWaitlistQueue(barberId: string) {
    const entries = await prisma.waiting_list_entries.findMany({
        where: {
            barber_id: barberId,
            status: { in: ['pending', 'offered'] },
        },
        orderBy: [{ slot_start: 'asc' }, { position: 'asc' }],
        take: 100,
    });
    return serializeWaitlistEntries(entries, true);
}

export async function cancelWaitlistEntry(params: { entryId: string; clientId: string }) {
    const entry = await prisma.waiting_list_entries.findFirst({
        where: { id: params.entryId, client_id: params.clientId },
        include: { offers: { where: { status: 'pending' }, take: 1 } },
    });
    if (!entry) throw new Error('Waitlist entry not found');
    if (entry.status === 'booked') throw new Error('This waitlist entry is already booked');

    const pendingOffer = entry.offers[0];
    const slotStart = entry.slot_start;
    const barberId = entry.barber_id;

    if (pendingOffer) {
        await prisma.waitlist_offers.update({
            where: { id: pendingOffer.id },
            data: { status: 'cancelled' },
        });
    }

    await prisma.waiting_list_entries.update({
        where: { id: entry.id },
        data: { status: 'cancelled' },
    });

    if (pendingOffer && barberId && slotStart) {
        await createWaitlistOfferForSlot({
            barberId,
            slotStart,
            slotEnd: pendingOffer.slot_end,
        });
    }

    return { cancelled: true };
}

export async function expireDueWaitlistOffers() {
    try {
        const now = new Date().toISOString();
        const due = await prisma.waitlist_offers.findMany({
            where: { status: 'pending', offer_expires_at: { lt: now } },
            take: 50,
        });
        for (const offer of due) {
            await expireWaitlistOffer(offer.id);
        }
        return { expired: due.length };
    } catch (err) {
        if (isFinancialTrustSchemaError(err)) return { expired: 0, schema_pending: true };
        throw err;
    }
}
