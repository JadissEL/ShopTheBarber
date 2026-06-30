import { useState, useEffect } from 'react';
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import MapTileLayer from '@/components/maps/MapTileLayer';
import { DEFAULT_MAP_CENTER } from '@/lib/mapConfig';

const MAP_PRIMARY = 'hsl(22 95% 52%)';
const MAP_NAVY = 'hsl(0 0% 5%)';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom barber marker icon
const barberIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background: ${MAP_PRIMARY}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>
    </svg>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

// User location marker
const userIcon = new L.DivIcon({
  className: 'custom-marker',
  html: `<div style="background: ${MAP_NAVY}; width: 20px; height: 20px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 0 4px hsl(0 0% 5% / 0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

function LocationMarker({ position }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.flyTo(position, 13);
    }
  }, [position, map]);

  return position ? <Marker position={position} icon={userIcon} /> : null;
}

function FitBounds({ barbers, userPosition }) {
  const map = useMap();
  
  useEffect(() => {
    const positions = barbers
      .filter(b => b.latitude && b.longitude)
      .map(b => [b.latitude, b.longitude]);
    
    if (userPosition) {
      positions.push(userPosition);
    }
    
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [barbers, userPosition, map]);

  return null;
}

export default function BarberMap({ barbers, onBarberSelect: _onBarberSelect, userPosition: externalUserPosition }) {
  const [internalUserPosition, setInternalUserPosition] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const userPosition =
    externalUserPosition?.latitude != null && externalUserPosition?.longitude != null
      ? [externalUserPosition.latitude, externalUserPosition.longitude]
      : internalUserPosition;

  // Default center: Athens, Greece
  const defaultCenter = DEFAULT_MAP_CENTER;

  const handleGetLocation = () => {
    if (externalUserPosition) return;
    setLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setInternalUserPosition([position.coords.latitude, position.coords.longitude]);
          setLoadingLocation(false);
        },
        (error) => {
          console.error('Geolocation error:', error);
          setLoadingLocation(false);
        }
      );
    }
  };

  const barbersWithCoords = barbers.filter((barber) => barber.latitude && barber.longitude);

  return (
    <div className="relative h-[400px] rounded-lg overflow-hidden border-2 border-border">
      {barbersWithCoords.length === 0 ? (
        <div className="h-full flex items-center justify-center text-sm text-muted-foreground bg-muted/30 px-6 text-center">
          Map view requires barber locations. Browse the list or check back when locations are available.
        </div>
      ) : (
      <MapContainer
        center={defaultCenter}
        zoom={12}
        className="h-full w-full z-0"
        scrollWheelZoom={true}
      >
        <MapTileLayer />
        
        <LocationMarker position={userPosition} />
        <FitBounds barbers={barbersWithCoords} userPosition={userPosition} />

        {barbersWithCoords.map((barber) => (
          <Marker
            key={barber.id}
            position={[barber.latitude, barber.longitude]}
            icon={barberIcon}
          >
            <Popup className="barber-popup">
              <div className="p-2 min-w-[200px]">
                <div className="flex items-start gap-3 mb-3">
                  {barber.portfolio_images?.[0] ? (
                    <img
                      src={barber.portfolio_images[0]}
                      alt={barber.shop_name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-primary text-2xl font-bold">
                        {barber.shop_name?.[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground text-sm">{barber.shop_name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-primary fill-current" />
                      <span className="text-xs font-semibold">{barber.rating?.toFixed(1) || '5.0'}</span>
                      <span className="text-xs text-muted-foreground">({barber.total_reviews || 0} avis)</span>
                    </div>
                  </div>
                </div>
                
                {barber.specialties?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {barber.specialties.slice(0, 2).map((s, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] py-0 px-1 border-primary text-primary">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}

                <Link to={createPageUrl(`BarberProfile?id=${barber.id}`)}>
                  <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white text-xs h-8">
                    View Profile
                  </Button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      )}

      {/* Locate Me Button */}
      {barbersWithCoords.length > 0 && (
      <Button
        onClick={handleGetLocation}
        disabled={loadingLocation}
        className="absolute bottom-4 right-4 z-[1000] bg-card hover:bg-muted/50 text-foreground shadow-elevation-md rounded-lg min-h-[44px]"
      >
        <Navigation className={`w-4 h-4 mr-2 ${loadingLocation ? 'animate-pulse' : ''}`} />
        {loadingLocation ? 'Localisation...' : 'Me localiser'}
      </Button>
      )}

      {/* Legend */}
      {barbersWithCoords.length > 0 && (
      <div className="absolute top-4 left-4 z-[1000] bg-card/95 backdrop-blur-sm p-3 rounded-lg shadow-elevation-md border border-border">
        <p className="text-xs font-semibold text-foreground mb-2">Légende</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-4 h-4 rounded-full bg-primary"></div>
          <span>Barbier</span>
        </div>
        {userPosition && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <div className="w-4 h-4 rounded-full bg-[hsl(var(--navy))]"></div>
            <span>Your location</span>
          </div>
        )}
      </div>
      )}
    </div>
  );
}