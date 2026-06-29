/**
 * Map tile configuration, Mapbox when VITE_MAPBOX_ACCESS_TOKEN is set, else OpenStreetMap.
 */

export function getMapboxAccessToken() {
    return (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || '').trim();
}

export function useMapboxTiles() {
    return getMapboxAccessToken().length > 0;
}

export function getTileLayerConfig() {
    const token = getMapboxAccessToken();
    if (token) {
        return {
            provider: 'mapbox',
            url: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${token}`,
            attribution:
                '&copy; <a href="https://www.mapbox.com/">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        };
    }
    return {
        provider: 'osm',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    };
}

/** Default map center, Athens, Greece */
export const DEFAULT_MAP_CENTER = [37.9838, 23.7275];
