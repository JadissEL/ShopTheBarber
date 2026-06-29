import { prisma } from '../db/prisma';
import { offersMobileService } from '../lib/serviceLocation';
import { distanceKm, roundKm } from './distance';
import { geocodeAddress, type GeocodeResult } from './geocoding';

export type TravelZoneInput = {
    id?: string;
    label: string;
    min_distance_km: number;
    max_distance_km: number;
    fee_amount: number;
    sort_order?: number;
};

export type AtHomeAreaInput = {
    base_address?: string | null;
    base_latitude?: number | null;
    base_longitude?: number | null;
    service_radius_km?: number;
    travel_fees_enabled?: boolean;
    zones?: TravelZoneInput[];
};

export const DEFAULT_TRAVEL_ZONES: TravelZoneInput[] = [
    { label: '0-5 km', min_distance_km: 0, max_distance_km: 5, fee_amount: 0, sort_order: 0 },
    { label: '5-15 km', min_distance_km: 5, max_distance_km: 15, fee_amount: 10, sort_order: 1 },
    { label: '15-25 km', min_distance_km: 15, max_distance_km: 25, fee_amount: 20, sort_order: 2 },
];

export type AtHomeTravelQuote = {
    in_service_area: boolean;
    distance_km: number | null;
    travel_fee: number;
    zone_label: string | null;
    client_latitude: number;
    client_longitude: number;
    formatted_address: string;
    service_radius_km: number | null;
    travel_fees_enabled: boolean;
    owner_type: 'barber' | 'shop' | null;
};

type AreaWithZones = Awaited<ReturnType<typeof loadAreaById>>;

async function loadAreaById(areaId: string) {
    return prisma.at_home_service_areas.findUnique({
        where: { id: areaId },
        include: { zones: { orderBy: [{ sort_order: 'asc' }, { min_distance_km: 'asc' }] } },
    });
}

export async function resolveAtHomeArea(params: {
    barberId: string;
    shopId?: string | null;
    contextType?: string | null;
}) {
    const inShopContext = !!params.shopId && params.contextType !== 'independent';

    if (inShopContext && params.shopId) {
        const shop = await prisma.shops.findUnique({
            where: { id: params.shopId },
            select: { id: true, offers_mobile_service: true },
        });
        if (shop && offersMobileService(shop)) {
            const area = await prisma.at_home_service_areas.findUnique({
                where: { shop_id: params.shopId },
                include: { zones: { orderBy: [{ sort_order: 'asc' }, { min_distance_km: 'asc' }] } },
            });
            if (area) return { area, ownerType: 'shop' as const };
        }
    }

    const barber = await prisma.barbers.findUnique({
        where: { id: params.barberId },
        select: { id: true, offers_mobile_service: true },
    });
    if (!barber || !offersMobileService(barber)) return null;

    const area = await prisma.at_home_service_areas.findUnique({
        where: { barber_id: params.barberId },
        include: { zones: { orderBy: [{ sort_order: 'asc' }, { min_distance_km: 'asc' }] } },
    });
    if (!area) return null;
    return { area, ownerType: 'barber' as const };
}

export function matchTravelZone(
    distanceKmValue: number,
    zones: { label: string; min_distance_km: number; max_distance_km: number; fee_amount: number }[]
): { label: string; fee: number } | null {
    for (const zone of zones) {
        if (distanceKmValue >= zone.min_distance_km && distanceKmValue <= zone.max_distance_km) {
            return { label: zone.label, fee: zone.fee_amount };
        }
    }
    return null;
}

export function quoteFromArea(
    area: NonNullable<AreaWithZones>,
    ownerType: 'barber' | 'shop',
    clientLat: number,
    clientLng: number,
    formattedAddress: string
): AtHomeTravelQuote {
    const hasBase =
        area.base_latitude != null &&
        area.base_longitude != null &&
        Number.isFinite(area.base_latitude) &&
        Number.isFinite(area.base_longitude);

    if (!hasBase) {
        return {
            in_service_area: true,
            distance_km: null,
            travel_fee: 0,
            zone_label: null,
            client_latitude: clientLat,
            client_longitude: clientLng,
            formatted_address: formattedAddress,
            service_radius_km: area.service_radius_km,
            travel_fees_enabled: area.travel_fees_enabled,
            owner_type: ownerType,
        };
    }

    const dist = roundKm(
        distanceKm(area.base_latitude, area.base_longitude, clientLat, clientLng)
    );
    const radius = area.service_radius_km ?? 25;
    const inRadius = dist <= radius + 0.01;

    if (!inRadius) {
        return {
            in_service_area: false,
            distance_km: dist,
            travel_fee: 0,
            zone_label: null,
            client_latitude: clientLat,
            client_longitude: clientLng,
            formatted_address: formattedAddress,
            service_radius_km: radius,
            travel_fees_enabled: area.travel_fees_enabled,
            owner_type: ownerType,
        };
    }

    let travelFee = 0;
    let zoneLabel: string | null = null;
    if (area.travel_fees_enabled && area.zones.length > 0) {
        const match = matchTravelZone(dist, area.zones);
        if (match) {
            travelFee = match.fee;
            zoneLabel = match.label;
        }
    }

    return {
        in_service_area: true,
        distance_km: dist,
        travel_fee: travelFee,
        zone_label: zoneLabel,
        client_latitude: clientLat,
        client_longitude: clientLng,
        formatted_address: formattedAddress,
        service_radius_km: radius,
        travel_fees_enabled: area.travel_fees_enabled,
        owner_type: ownerType,
    };
}

export async function quoteAtHomeTravel(params: {
    barberId: string;
    shopId?: string | null;
    contextType?: string | null;
    address?: string;
    latitude?: number;
    longitude?: number;
}): Promise<AtHomeTravelQuote> {
    const resolved = await resolveAtHomeArea(params);
    if (!resolved) {
        throw new Error('This provider has not configured at-home service coverage');
    }

    let geo: GeocodeResult;
    if (
        params.latitude != null &&
        params.longitude != null &&
        Number.isFinite(params.latitude) &&
        Number.isFinite(params.longitude)
    ) {
        geo = {
            latitude: params.latitude,
            longitude: params.longitude,
            formatted_address: params.address?.trim() || `${params.latitude}, ${params.longitude}`,
            provider: 'coordinates',
        };
    } else if (params.address?.trim()) {
        geo = await geocodeAddress(params.address);
    } else {
        throw new Error('Address or coordinates required for at-home travel quote');
    }

    return quoteFromArea(
        resolved.area,
        resolved.ownerType,
        geo.latitude,
        geo.longitude,
        geo.formatted_address
    );
}

function validateZones(zones: TravelZoneInput[], radiusKm: number): void {
    if (zones.length === 0) return;
    for (const z of zones) {
        if (z.max_distance_km <= z.min_distance_km) {
            throw new Error(`Zone "${z.label}" must have max distance greater than min distance`);
        }
        if (z.max_distance_km > radiusKm + 0.001) {
            throw new Error(`Zone "${z.label}" exceeds service radius (${radiusKm} km)`);
        }
        if (z.fee_amount < 0) {
            throw new Error(`Zone "${z.label}" fee cannot be negative`);
        }
    }
}

export async function upsertBarberAtHomeArea(barberId: string, input: AtHomeAreaInput) {
    const barber = await prisma.barbers.findUnique({ where: { id: barberId } });
    if (!barber) throw new Error('Barber not found');
    if (!offersMobileService(barber)) {
        throw new Error('Enable at-home visits before configuring travel zones');
    }

    const radius = input.service_radius_km ?? 25;
    if (radius <= 0 || radius > 200) {
        throw new Error('Service radius must be between 1 and 200 km');
    }

    const zones = input.zones ?? DEFAULT_TRAVEL_ZONES;
    validateZones(zones, radius);

    let baseLat = input.base_latitude ?? null;
    let baseLng = input.base_longitude ?? null;
    let baseAddress = input.base_address?.trim() || null;

    if (baseAddress && (baseLat == null || baseLng == null)) {
        const geo = await geocodeAddress(baseAddress);
        baseLat = geo.latitude;
        baseLng = geo.longitude;
        baseAddress = geo.formatted_address;
    }

    const existing = await prisma.at_home_service_areas.findUnique({ where: { barber_id: barberId } });
    const areaId = existing?.id ?? crypto.randomUUID();

    const area = existing
        ? await prisma.at_home_service_areas.update({
              where: { id: areaId },
              data: {
                  base_address: baseAddress,
                  base_latitude: baseLat,
                  base_longitude: baseLng,
                  service_radius_km: radius,
                  travel_fees_enabled: input.travel_fees_enabled ?? existing.travel_fees_enabled,
                  updated_at: new Date().toISOString(),
              },
          })
        : await prisma.at_home_service_areas.create({
              data: {
                  id: areaId,
                  barber_id: barberId,
                  base_address: baseAddress,
                  base_latitude: baseLat,
                  base_longitude: baseLng,
                  service_radius_km: radius,
                  travel_fees_enabled: input.travel_fees_enabled ?? false,
              },
          });

    await prisma.at_home_travel_zones.deleteMany({ where: { area_id: area.id } });
    if (zones.length > 0) {
        await prisma.at_home_travel_zones.createMany({
            data: zones.map((z, index) => ({
                id: crypto.randomUUID(),
                area_id: area.id,
                label: z.label,
                min_distance_km: z.min_distance_km,
                max_distance_km: z.max_distance_km,
                fee_amount: z.fee_amount,
                sort_order: z.sort_order ?? index,
            })),
        });
    }

    return loadAreaById(area.id);
}

export async function upsertShopAtHomeArea(shopId: string, input: AtHomeAreaInput) {
    const shop = await prisma.shops.findUnique({ where: { id: shopId } });
    if (!shop) throw new Error('Shop not found');
    if (!offersMobileService(shop)) {
        throw new Error('Enable at-home visits for your shop before configuring travel zones');
    }

    const radius = input.service_radius_km ?? 25;
    if (radius <= 0 || radius > 200) {
        throw new Error('Service radius must be between 1 and 200 km');
    }

    const zones = input.zones ?? DEFAULT_TRAVEL_ZONES;
    validateZones(zones, radius);

    let baseLat = input.base_latitude ?? null;
    let baseLng = input.base_longitude ?? null;
    let baseAddress = input.base_address?.trim() || null;

    if (baseAddress && (baseLat == null || baseLng == null)) {
        const geo = await geocodeAddress(baseAddress);
        baseLat = geo.latitude;
        baseLng = geo.longitude;
        baseAddress = geo.formatted_address;
    }

    const existing = await prisma.at_home_service_areas.findUnique({ where: { shop_id: shopId } });
    const areaId = existing?.id ?? crypto.randomUUID();

    const area = existing
        ? await prisma.at_home_service_areas.update({
              where: { id: areaId },
              data: {
                  base_address: baseAddress,
                  base_latitude: baseLat,
                  base_longitude: baseLng,
                  service_radius_km: radius,
                  travel_fees_enabled: input.travel_fees_enabled ?? existing.travel_fees_enabled,
                  updated_at: new Date().toISOString(),
              },
          })
        : await prisma.at_home_service_areas.create({
              data: {
                  id: areaId,
                  shop_id: shopId,
                  base_address: baseAddress,
                  base_latitude: baseLat,
                  base_longitude: baseLng,
                  service_radius_km: radius,
                  travel_fees_enabled: input.travel_fees_enabled ?? false,
              },
          });

    await prisma.at_home_travel_zones.deleteMany({ where: { area_id: area.id } });
    if (zones.length > 0) {
        await prisma.at_home_travel_zones.createMany({
            data: zones.map((z, index) => ({
                id: crypto.randomUUID(),
                area_id: area.id,
                label: z.label,
                min_distance_km: z.min_distance_km,
                max_distance_km: z.max_distance_km,
                fee_amount: z.fee_amount,
                sort_order: z.sort_order ?? index,
            })),
        });
    }

    return loadAreaById(area.id);
}

export function serializeAtHomeArea(
    area: NonNullable<AreaWithZones>,
    owner: { type: 'barber' | 'shop'; id: string; name: string }
) {
    return {
        id: area.id,
        owner_type: owner.type,
        owner_id: owner.id,
        owner_name: owner.name,
        base_address: area.base_address,
        base_latitude: area.base_latitude,
        base_longitude: area.base_longitude,
        service_radius_km: area.service_radius_km,
        travel_fees_enabled: area.travel_fees_enabled,
        zones: area.zones.map((z) => ({
            id: z.id,
            label: z.label,
            min_distance_km: z.min_distance_km,
            max_distance_km: z.max_distance_km,
            fee_amount: z.fee_amount,
            sort_order: z.sort_order,
        })),
    };
}

export async function getProviderAtHomeSettings(userId: string) {
    const barber = await prisma.barbers.findFirst({ where: { user_id: userId } });
    let shop = barber?.shop_id
        ? await prisma.shops.findUnique({
              where: { id: barber.shop_id },
              select: { id: true, name: true, offers_mobile_service: true, owner_id: true },
          })
        : null;
    if (!shop) {
        shop = await prisma.shops.findFirst({
            where: { owner_id: userId },
            select: { id: true, name: true, offers_mobile_service: true, owner_id: true },
        });
    }

    let barberArea = null;
    if (barber && offersMobileService(barber)) {
        const area = await prisma.at_home_service_areas.findUnique({
            where: { barber_id: barber.id },
            include: { zones: { orderBy: [{ sort_order: 'asc' }, { min_distance_km: 'asc' }] } },
        });
        if (area) {
            barberArea = serializeAtHomeArea(area, {
                type: 'barber',
                id: barber.id,
                name: barber.name,
            });
        }
    }

    let shopArea = null;
    if (shop && offersMobileService(shop)) {
        const area = await prisma.at_home_service_areas.findUnique({
            where: { shop_id: shop.id },
            include: { zones: { orderBy: [{ sort_order: 'asc' }, { min_distance_km: 'asc' }] } },
        });
        if (area) {
            shopArea = serializeAtHomeArea(area, {
                type: 'shop',
                id: shop.id,
                name: shop.name,
            });
        }
    }

    return {
        barber: barber
            ? {
                  id: barber.id,
                  name: barber.name,
                  offers_mobile_service: offersMobileService(barber),
                  area: barberArea,
              }
            : null,
        shop: shop
            ? {
                  id: shop.id,
                  name: shop.name,
                  offers_mobile_service: offersMobileService(shop),
                  area: shopArea,
              }
            : null,
        default_zones: DEFAULT_TRAVEL_ZONES,
    };
}

/** Validates at-home address against provider coverage; returns null if area not configured. */
export async function validateMobileBookingTravel(params: {
    barberId: string;
    shopId?: string | null;
    contextType?: string | null;
    address?: string;
    latitude?: number;
    longitude?: number;
}): Promise<AtHomeTravelQuote | null> {
    const resolved = await resolveAtHomeArea(params);
    if (!resolved) return null;

    const hasBase =
        resolved.area.base_latitude != null &&
        resolved.area.base_longitude != null &&
        Number.isFinite(resolved.area.base_latitude) &&
        Number.isFinite(resolved.area.base_longitude);

    if (!hasBase) return null;

    const quote = await quoteAtHomeTravel(params);
    if (!quote.in_service_area) {
        throw new Error(
            `This address is outside the service area (${quote.service_radius_km} km radius). Choose a closer location or contact the provider.`
        );
    }
    return quote;
}

export async function getPublicAtHomeArea(params: {
    barberId: string;
    shopId?: string | null;
    contextType?: string | null;
}) {
    const resolved = await resolveAtHomeArea(params);
    if (!resolved) return null;

    let ownerName = 'Provider';
    if (resolved.ownerType === 'shop' && resolved.area.shop_id) {
        const shop = await prisma.shops.findUnique({
            where: { id: resolved.area.shop_id },
            select: { name: true },
        });
        ownerName = shop?.name ?? ownerName;
    } else if (resolved.area.barber_id) {
        const barber = await prisma.barbers.findUnique({
            where: { id: resolved.area.barber_id },
            select: { name: true },
        });
        ownerName = barber?.name ?? ownerName;
    }

    return serializeAtHomeArea(resolved.area, {
        type: resolved.ownerType,
        id:
            resolved.ownerType === 'shop'
                ? resolved.area.shop_id!
                : resolved.area.barber_id!,
        name: ownerName,
    });
}
