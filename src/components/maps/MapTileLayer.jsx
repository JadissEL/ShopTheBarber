import { TileLayer } from 'react-leaflet';
import { getTileLayerConfig } from '@/lib/mapConfig';

/**
 * Shared Leaflet tile layer, Mapbox streets when token is configured, OSM fallback otherwise.
 */
export default function MapTileLayer() {
    const { url, attribution } = getTileLayerConfig();
    return <TileLayer attribution={attribution} url={url} />;
}
