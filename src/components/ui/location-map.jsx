import { MapContainer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MapTileLayer from '@/components/maps/MapTileLayer';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for Leaflet icons in React
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function LocationMap({ center = [33.15, -96.96], zoom = 13, popupText, className }) {
  return (
    <div className={`h-48 w-full rounded-2xl overflow-hidden bg-muted border border-border relative z-0 ${className}`}>
         <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <MapTileLayer />
            <Marker position={center}>
                {popupText && <Popup>{popupText}</Popup>}
            </Marker>
        </MapContainer>
    </div>
  );
}