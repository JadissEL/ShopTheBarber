import { prisma } from '../../db/prisma';
import { parseWaitlistServiceIds } from './serviceIds';

export type WaitlistEntryRow = {
    id: string;
    client_id: string | null;
    barber_id: string | null;
    shop_id: string | null;
    service_id: string | null;
    service_ids_json?: string | null;
    slot_start: string | null;
    preferred_time: string | null;
    position: number | null;
    status: string | null;
    created_at?: string | null;
};

type ContextMaps = {
    barbers: Map<string, { id: string; name: string | null; image_url: string | null }>;
    services: Map<string, { id: string; name: string; price: number; duration_minutes: number }>;
    clients: Map<string, { id: string; full_name: string | null; email: string; avatar_url: string | null }>;
    shops: Map<string, { id: string; name: string | null }>;
};

async function loadWaitlistContextMaps(entries: WaitlistEntryRow[]): Promise<ContextMaps> {
    const barberIds = [...new Set(entries.map((e) => e.barber_id).filter(Boolean))] as string[];
    const serviceIds = [...new Set(entries.map((e) => e.service_id).filter(Boolean))] as string[];
    const clientIds = [...new Set(entries.map((e) => e.client_id).filter(Boolean))] as string[];
    const shopIds = [...new Set(entries.map((e) => e.shop_id).filter(Boolean))] as string[];

    const [barbers, services, clients, shops] = await Promise.all([
        barberIds.length
            ? prisma.barbers.findMany({
                  where: { id: { in: barberIds } },
                  select: { id: true, name: true, image_url: true },
              })
            : [],
        serviceIds.length
            ? prisma.services.findMany({
                  where: { id: { in: serviceIds } },
                  select: { id: true, name: true, price: true, duration_minutes: true },
              })
            : [],
        clientIds.length
            ? prisma.users.findMany({
                  where: { id: { in: clientIds } },
                  select: { id: true, full_name: true, email: true, avatar_url: true },
              })
            : [],
        shopIds.length
            ? prisma.shops.findMany({
                  where: { id: { in: shopIds } },
                  select: { id: true, name: true },
              })
            : [],
    ]);

    return {
        barbers: new Map(barbers.map((b) => [b.id, b])),
        services: new Map(services.map((s) => [s.id, s])),
        clients: new Map(clients.map((c) => [c.id, c])),
        shops: new Map(shops.map((s) => [s.id, s])),
    };
}

function clientDisplayName(client: ContextMaps['clients'] extends Map<string, infer V> ? V : never): string {
    if (client.full_name?.trim()) return client.full_name.trim();
    const local = client.email.split('@')[0];
    return local || 'Client';
}

export function serializeWaitlistEntry(entry: WaitlistEntryRow, maps: ContextMaps, includeClient = false) {
    const barber = entry.barber_id ? maps.barbers.get(entry.barber_id) : null;
    const service = entry.service_id ? maps.services.get(entry.service_id) : null;
    const shop = entry.shop_id ? maps.shops.get(entry.shop_id) : null;
    const client = includeClient && entry.client_id ? maps.clients.get(entry.client_id) : null;
    const serviceIds = parseWaitlistServiceIds(entry);
    const serviceCount = serviceIds.length;

    return {
        id: entry.id,
        client_id: entry.client_id,
        barber_id: entry.barber_id,
        shop_id: entry.shop_id,
        service_id: entry.service_id,
        service_ids: serviceIds,
        service_count: serviceCount,
        slot_start: entry.slot_start,
        preferred_time: entry.preferred_time,
        position: entry.position,
        status: entry.status,
        created_at: entry.created_at ?? null,
        barber_name: barber?.name ?? null,
        barber_image_url: barber?.image_url ?? null,
        service_name: service?.name ?? null,
        service_label:
            serviceCount > 1 && service?.name
                ? `${service.name} + ${serviceCount - 1} more`
                : service?.name ?? null,
        service_price: service?.price ?? null,
        service_duration_minutes: service?.duration_minutes ?? null,
        shop_name: shop?.name ?? null,
        ...(includeClient && client
            ? {
                  client_name: clientDisplayName(client),
                  client_email: client.email,
                  client_avatar_url: client.avatar_url,
              }
            : {}),
    };
}

export async function serializeWaitlistEntries(entries: WaitlistEntryRow[], includeClient = false) {
    if (entries.length === 0) return [];
    const maps = await loadWaitlistContextMaps(entries);
    return entries.map((e) => serializeWaitlistEntry(e, maps, includeClient));
}

export async function serializeWaitlistOffers(
    offers: Array<{
        id: string;
        slot_start: string;
        slot_end: string | null;
        status: string;
        offer_expires_at: string;
        waitlist_entry: WaitlistEntryRow | null;
    }>
) {
    const entries = offers.map((o) => o.waitlist_entry).filter(Boolean) as WaitlistEntryRow[];
    const maps = entries.length ? await loadWaitlistContextMaps(entries) : await loadWaitlistContextMaps([]);

    return offers.map((offer) => {
        const entry = offer.waitlist_entry;
        const enrichedEntry = entry ? serializeWaitlistEntry(entry, maps, false) : null;
        return {
            id: offer.id,
            slot_start: offer.slot_start,
            slot_end: offer.slot_end,
            status: offer.status,
            offer_expires_at: offer.offer_expires_at,
            waitlist_entry: enrichedEntry,
            barber_name: enrichedEntry?.barber_name ?? null,
            barber_image_url: enrichedEntry?.barber_image_url ?? null,
            service_name: enrichedEntry?.service_name ?? null,
            service_label: enrichedEntry?.service_label ?? enrichedEntry?.service_name ?? null,
            service_price: enrichedEntry?.service_price ?? null,
            service_duration_minutes: enrichedEntry?.service_duration_minutes ?? null,
            shop_name: enrichedEntry?.shop_name ?? null,
            position: enrichedEntry?.position ?? null,
        };
    });
}
