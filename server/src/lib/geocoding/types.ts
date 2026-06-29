export type GeocodingProviderName = 'mapbox' | 'google' | 'nominatim' | 'coordinates';

export type GeocodeResult = {
    latitude: number;
    longitude: number;
    formatted_address: string;
    provider: GeocodingProviderName;
};

export type GeocodeSuggestion = {
    label: string;
    formatted_address: string;
    latitude: number;
    longitude: number;
};

export type GeocodingConfig = {
    provider: GeocodingProviderName;
    supports_autocomplete: boolean;
    supports_production: boolean;
};
