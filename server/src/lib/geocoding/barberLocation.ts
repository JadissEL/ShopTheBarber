import { geocodeAddress, isProductionGeocodingConfigured } from './index';
import { coordsForLocationText } from './locationCoords';

export type ResolvedCoords = { latitude: number; longitude: number };

/**
 * Resolve barber map coordinates from a location string.
 * Uses Mapbox/Google when configured, otherwise static city lookup.
 */
export async function resolveBarberCoordinates(
    location: string,
    barberId?: string,
    options?: { preferApi?: boolean }
): Promise<ResolvedCoords | null> {
    const trimmed = location?.trim();
    if (!trimmed) return null;

    if (options?.preferApi !== false && isProductionGeocodingConfigured()) {
        try {
            const geo = await geocodeAddress(trimmed);
            return { latitude: geo.latitude, longitude: geo.longitude };
        } catch {
            // fall through to static lookup
        }
    }

    return coordsForLocationText(trimmed, barberId);
}

/** Merge latitude/longitude into PATCH/POST body when location is set without coords. */
export async function enrichBarberLocationFields(
    data: Record<string, unknown>,
    barberId?: string
): Promise<Record<string, unknown>> {
    if (typeof data.location !== 'string' || !data.location.trim()) {
        return data;
    }
    if (data.latitude !== undefined || data.longitude !== undefined) {
        return data;
    }

    const coords = await resolveBarberCoordinates(data.location, barberId);
    if (!coords) return data;

    return {
        ...data,
        latitude: coords.latitude,
        longitude: coords.longitude,
    };
}
