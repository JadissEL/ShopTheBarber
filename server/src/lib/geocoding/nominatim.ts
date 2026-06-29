import type { GeocodeResult, GeocodeSuggestion } from './types';

type NominatimResult = {
    lat: string;
    lon: string;
    display_name?: string;
};

const USER_AGENT = 'ShopTheBarber/1.0 (at-home service geocoding)';

function parseHit(hit: NominatimResult, fallback: string): GeocodeResult {
    const latitude = Number.parseFloat(hit.lat);
    const longitude = Number.parseFloat(hit.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error('Invalid geocoding response');
    }
    return {
        latitude,
        longitude,
        formatted_address: hit.display_name ?? fallback,
        provider: 'nominatim',
    };
}

export async function geocodeAddressNominatim(address: string): Promise<GeocodeResult> {
    const trimmed = address.trim();
    if (trimmed.length < 5) {
        throw new Error('Please enter a complete street address');
    }

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', trimmed);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('addressdetails', '0');

    const response = await fetch(url.toString(), {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error('Address lookup failed, please check the address and try again');
    }

    const rows = (await response.json()) as NominatimResult[];
    const hit = rows[0];
    if (!hit) {
        throw new Error('Could not find that address, try adding city and postal code');
    }

    return parseHit(hit, trimmed);
}

export async function reverseGeocodeNominatim(latitude: number, longitude: number): Promise<GeocodeResult> {
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('format', 'json');

    const response = await fetch(url.toString(), {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error('Could not resolve coordinates to an address');
    }

    const hit = (await response.json()) as NominatimResult;
    return {
        latitude,
        longitude,
        formatted_address: hit.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        provider: 'nominatim',
    };
}

export async function suggestAddressesNominatim(query: string): Promise<GeocodeSuggestion[]> {
    const trimmed = query.trim();
    if (trimmed.length < 3) return [];

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', trimmed);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '5');
    url.searchParams.set('addressdetails', '0');

    const response = await fetch(url.toString(), {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    });

    if (!response.ok) return [];

    const rows = (await response.json()) as NominatimResult[];
    return rows
        .map((row) => {
            const latitude = Number.parseFloat(row.lat);
            const longitude = Number.parseFloat(row.lon);
            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
            const label = row.display_name ?? trimmed;
            return {
                label,
                formatted_address: label,
                latitude,
                longitude,
            };
        })
        .filter((s): s is GeocodeSuggestion => s !== null);
}
