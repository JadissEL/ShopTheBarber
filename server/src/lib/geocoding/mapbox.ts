import type { GeocodeResult, GeocodeSuggestion } from './types';

type MapboxFeature = {
    place_name?: string;
    center?: [number, number];
    geometry?: { coordinates?: [number, number] };
};

type MapboxGeocodeResponse = {
    features?: MapboxFeature[];
    message?: string;
};

function getMapboxToken(): string {
    const token = process.env.MAPBOX_ACCESS_TOKEN?.trim();
    if (!token) {
        throw new Error('MAPBOX_ACCESS_TOKEN is not configured');
    }
    return token;
}

function featureToResult(feature: MapboxFeature, fallback: string): GeocodeResult {
    const coords = feature.center ?? feature.geometry?.coordinates;
    if (!coords || coords.length < 2) {
        throw new Error('Invalid Mapbox geocoding response');
    }
    const [longitude, latitude] = coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
        throw new Error('Invalid Mapbox geocoding response');
    }
    return {
        latitude,
        longitude,
        formatted_address: feature.place_name ?? fallback,
        provider: 'mapbox',
    };
}

function buildForwardUrl(searchText: string, limit: number, autocomplete: boolean): string {
    const token = getMapboxToken();
    const encoded = encodeURIComponent(searchText);
    const url = new URL(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json`
    );
    url.searchParams.set('access_token', token);
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('language', 'en');
    url.searchParams.set('country', 'GR');
    url.searchParams.set('types', 'address,place,locality,neighborhood,postcode');
    if (autocomplete) {
        url.searchParams.set('autocomplete', 'true');
    }
    // Bias toward Athens, still works nationwide in Greece
    url.searchParams.set('proximity', '23.7275,37.9838');
    return url.toString();
}

async function fetchMapboxFeatures(url: string): Promise<MapboxFeature[]> {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
        throw new Error('Address lookup failed, please check the address and try again');
    }
    const body = (await response.json()) as MapboxGeocodeResponse;
    if (body.message && !body.features?.length) {
        throw new Error('Could not find that address, try adding city and postal code');
    }
    return body.features ?? [];
}

export async function geocodeAddressMapbox(address: string): Promise<GeocodeResult> {
    const trimmed = address.trim();
    if (trimmed.length < 5) {
        throw new Error('Please enter a complete street address');
    }

    const features = await fetchMapboxFeatures(buildForwardUrl(trimmed, 1, false));
    const hit = features[0];
    if (!hit) {
        throw new Error('Could not find that address, try adding city and postal code');
    }
    return featureToResult(hit, trimmed);
}

export async function reverseGeocodeMapbox(latitude: number, longitude: number): Promise<GeocodeResult> {
    const token = getMapboxToken();
    const url = new URL(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`
    );
    url.searchParams.set('access_token', token);
    url.searchParams.set('limit', '1');
    url.searchParams.set('language', 'en');
    url.searchParams.set('types', 'address,place,locality,neighborhood');

    const features = await fetchMapboxFeatures(url.toString());
    const hit = features[0];
    if (!hit) {
        throw new Error('Could not resolve coordinates to an address');
    }
    return featureToResult(hit, `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
}

export async function suggestAddressesMapbox(query: string): Promise<GeocodeSuggestion[]> {
    const trimmed = query.trim();
    if (trimmed.length < 3) return [];

    const features = await fetchMapboxFeatures(buildForwardUrl(trimmed, 5, true));
    return features
        .map((feature) => {
            try {
                const result = featureToResult(feature, trimmed);
                return {
                    label: result.formatted_address,
                    formatted_address: result.formatted_address,
                    latitude: result.latitude,
                    longitude: result.longitude,
                };
            } catch {
                return null;
            }
        })
        .filter((s): s is GeocodeSuggestion => s !== null);
}
