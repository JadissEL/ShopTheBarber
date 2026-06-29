import type { GeocodeResult, GeocodeSuggestion, GeocodingConfig, GeocodingProviderName } from './types';
import * as mapbox from './mapbox';
import * as google from './google';
import * as nominatim from './nominatim';

export type { GeocodeResult, GeocodeSuggestion, GeocodingConfig, GeocodingProviderName } from './types';
export { coordsForLocationText } from './locationCoords';

export function isProductionGeocodingConfigured(): boolean {
    return !!(process.env.MAPBOX_ACCESS_TOKEN?.trim() || process.env.GOOGLE_MAPS_API_KEY?.trim());
}

/**
 * Resolve active geocoding backend.
 * `GEOCODING_PROVIDER=mapbox|google|nominatim` overrides auto-detection.
 */
export function resolveGeocodingProvider(): Exclude<GeocodingProviderName, 'coordinates'> {
    const forced = process.env.GEOCODING_PROVIDER?.trim().toLowerCase();
    if (forced === 'mapbox' || forced === 'google' || forced === 'nominatim') {
        return forced;
    }
    if (process.env.MAPBOX_ACCESS_TOKEN?.trim()) return 'mapbox';
    if (process.env.GOOGLE_MAPS_API_KEY?.trim()) return 'google';
    return 'nominatim';
}

export function getGeocodingConfig(): GeocodingConfig {
    const provider = resolveGeocodingProvider();
    return {
        provider,
        supports_autocomplete: true,
        supports_production: provider !== 'nominatim',
    };
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
    switch (resolveGeocodingProvider()) {
        case 'mapbox':
            return mapbox.geocodeAddressMapbox(address);
        case 'google':
            return google.geocodeAddressGoogle(address);
        default:
            return nominatim.geocodeAddressNominatim(address);
    }
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
    switch (resolveGeocodingProvider()) {
        case 'mapbox':
            return mapbox.reverseGeocodeMapbox(latitude, longitude);
        case 'google':
            return google.reverseGeocodeGoogle(latitude, longitude);
        default:
            return nominatim.reverseGeocodeNominatim(latitude, longitude);
    }
}

export async function suggestAddresses(query: string): Promise<GeocodeSuggestion[]> {
    switch (resolveGeocodingProvider()) {
        case 'mapbox':
            return mapbox.suggestAddressesMapbox(query);
        case 'google':
            return google.suggestAddressesGoogle(query);
        default:
            return nominatim.suggestAddressesNominatim(query);
    }
}
