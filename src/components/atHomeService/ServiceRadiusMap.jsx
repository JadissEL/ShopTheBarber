import { MapContainer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import MapTileLayer from '@/components/maps/MapTileLayer';

const MAP_PRIMARY = 'hsl(22 95% 52%)';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const clientIcon = new L.DivIcon({
    className: 'custom-marker',
    html: `<div style="background:${MAP_PRIMARY};width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 0 3px hsl(22 95% 52% / 0.35);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
});

export default function ServiceRadiusMap({
    baseLatitude,
    baseLongitude,
    serviceRadiusKm = 25,
    clientLatitude,
    clientLongitude,
    height = 280,
    className = '',
}) {
    if (baseLatitude == null || baseLongitude == null) {
        return (
            <div
                className={`rounded-lg border border-dashed border-border bg-muted/30 flex items-center justify-center text-sm text-muted-foreground ${className}`}
                style={{ height }}
            >
                Set a base address to preview your service radius on the map.
            </div>
        );
    }

    const center = [baseLatitude, baseLongitude];
    const radiusMeters = (serviceRadiusKm ?? 25) * 1000;

    return (
        <div className={`rounded-lg overflow-hidden border border-border ${className}`} style={{ height }}>
            <MapContainer center={center} zoom={11} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                <MapTileLayer />
                <Marker position={center} />
                <Circle
                    center={center}
                    radius={radiusMeters}
                    pathOptions={{ color: MAP_PRIMARY, fillColor: MAP_PRIMARY, fillOpacity: 0.12, weight: 2 }}
                />
                {clientLatitude != null && clientLongitude != null && (
                    <Marker position={[clientLatitude, clientLongitude]} icon={clientIcon} />
                )}
            </MapContainer>
        </div>
    );
}
