const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in kilometers (Haversine). */
export function distanceKm(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}

export function roundKm(value) {
    return Math.round(value * 100) / 100;
}

export function formatDistanceKm(km) {
    if (km == null || !Number.isFinite(km)) return null;
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${roundKm(km)} km`;
}

/** Distance from user coords to a barber record, or null when unavailable. */
export function barberDistanceKm(userCoords, barber) {
    if (!userCoords || barber?.latitude == null || barber?.longitude == null) return null;
    return roundKm(
        distanceKm(userCoords.latitude, userCoords.longitude, barber.latitude, barber.longitude)
    );
}
