import type { GeocodeResult, GeocodeSuggestion } from './types';

type GoogleGeocodeResponse = {
    status: string;
    error_message?: string;
    results?: Array<{
        formatted_address?: string;
        geometry?: { location?: { lat?: number; lng?: number } };
    }>;
};

function getGoogleMapsKey(): string {
    const key = process.env.GOOGLE_MAPS_API_KEY?.trim();
    if (!key) {
        throw new Error('GOOGLE_MAPS_API_KEY is not configured');
    }
    return key;
}

function parseGoogleResult(
    result: NonNullable<GoogleGeocodeResponse['results']>[number],
    fallback: string
): GeocodeResult {
    const lat = result.geometry?.location?.lat;
    const lng = result.geometry?.location?.lng;
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error('Invalid Google geocoding response');
    }
    return {
        latitude: lat,
        longitude: lng,
        formatted_address: result.formatted_address ?? fallback,
        provider: 'google',
    };
}

async function fetchGoogleGeocode(params: Record<string, string>): Promise<GoogleGeocodeResponse> {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('key', getGoogleMapsKey());
    for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
    }

    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) {
        throw new Error('Address lookup failed, please check the address and try again');
    }

    const body = (await response.json()) as GoogleGeocodeResponse;
    if (body.status === 'ZERO_RESULTS') {
        throw new Error('Could not find that address, try adding city and postal code');
    }
    if (body.status !== 'OK') {
        throw new Error(body.error_message || 'Address lookup failed');
    }
    return body;
}

export async function geocodeAddressGoogle(address: string): Promise<GeocodeResult> {
    const trimmed = address.trim();
    if (trimmed.length < 5) {
        throw new Error('Please enter a complete street address');
    }

    const body = await fetchGoogleGeocode({
        address: trimmed,
        region: 'gr',
        components: 'country:GR',
    });

    const hit = body.results?.[0];
    if (!hit) {
        throw new Error('Could not find that address, try adding city and postal code');
    }
    return parseGoogleResult(hit, trimmed);
}

export async function reverseGeocodeGoogle(latitude: number, longitude: number): Promise<GeocodeResult> {
    const body = await fetchGoogleGeocode({
        latlng: `${latitude},${longitude}`,
        result_type: 'street_address|route|locality|postal_code',
    });

    const hit = body.results?.[0];
    if (!hit) {
        throw new Error('Could not resolve coordinates to an address');
    }
    return parseGoogleResult(hit, `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
}

export async function suggestAddressesGoogle(query: string): Promise<GeocodeSuggestion[]> {
    const trimmed = query.trim();
    if (trimmed.length < 3) return [];

    try {
        const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
        url.searchParams.set('key', getGoogleMapsKey());
        url.searchParams.set('address', trimmed);
        url.searchParams.set('region', 'gr');
        url.searchParams.set('components', 'country:GR');

        const response = await fetch(url.toString());
        if (!response.ok) return [];

        const body = (await response.json()) as GoogleGeocodeResponse;
        if (body.status !== 'OK' || !body.results?.length) return [];

        return body.results.slice(0, 5).map((result) => {
            const parsed = parseGoogleResult(result, trimmed);
            return {
                label: parsed.formatted_address,
                formatted_address: parsed.formatted_address,
                latitude: parsed.latitude,
                longitude: parsed.longitude,
            };
        });
    } catch {
        return [];
    }
}
