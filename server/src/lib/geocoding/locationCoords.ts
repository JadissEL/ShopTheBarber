/**
 * Static coordinates for known seed/demo locations when API geocoding is unavailable.
 * Applies a small deterministic jitter per id so map markers do not stack.
 */

type CoordPair = { latitude: number; longitude: number };

/** Longest / most specific patterns first */
const LOCATION_PATTERNS: Array<{ pattern: RegExp; coords: CoordPair }> = [
    { pattern: /syntagma|athens,\s*syntagma/i, coords: { latitude: 37.9755, longitude: 23.7348 } },
    { pattern: /kolonaki/i, coords: { latitude: 37.9779, longitude: 23.741 } },
    { pattern: /exarcheia|exarchia/i, coords: { latitude: 37.988, longitude: 23.732 } },
    { pattern: /aristotelous|thessaloniki/i, coords: { latitude: 40.6329, longitude: 22.9445 } },
    { pattern: /ladadika/i, coords: { latitude: 40.634, longitude: 22.935 } },
    { pattern: /patras/i, coords: { latitude: 38.2466, longitude: 21.7346 } },
    { pattern: /heraklion|crete/i, coords: { latitude: 35.3387, longitude: 25.1442 } },
    { pattern: /larissa/i, coords: { latitude: 39.639, longitude: 22.4194 } },
    { pattern: /volos|pagasitikos/i, coords: { latitude: 39.3619, longitude: 22.9425 } },
    { pattern: /ioannina|lake/i, coords: { latitude: 39.665, longitude: 20.8537 } },
    { pattern: /manhattan|new york,\s*manhattan/i, coords: { latitude: 40.758, longitude: -73.9855 } },
    { pattern: /brooklyn|new york,\s*brooklyn/i, coords: { latitude: 40.6782, longitude: -73.9442 } },
    { pattern: /downtown(?!.*athens)/i, coords: { latitude: 40.7128, longitude: -74.006 } },
    { pattern: /le marais|bastille|paris/i, coords: { latitude: 48.8566, longitude: 2.3522 } },
    { pattern: /lyon|presqu/i, coords: { latitude: 45.764, longitude: 4.8357 } },
    { pattern: /marseille|vieux-port/i, coords: { latitude: 43.2965, longitude: 5.3698 } },
    { pattern: /brussels|ixelles/i, coords: { latitude: 50.8503, longitude: 4.3517 } },
    { pattern: /shoreditch|camden|london/i, coords: { latitude: 51.5255, longitude: -0.072 } },
    { pattern: /montreal|plateau/i, coords: { latitude: 45.5017, longitude: -73.5673 } },
    { pattern: /athens/i, coords: { latitude: 37.9838, longitude: 23.7275 } },
    { pattern: /new york/i, coords: { latitude: 40.7128, longitude: -74.006 } },
];

function jitterFromId(id: string | undefined): CoordPair {
    if (!id) return { latitude: 0, longitude: 0 };
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash * 31 + id.charCodeAt(i)) | 0;
    }
    const latJ = ((hash % 200) - 100) / 10000;
    const lngJ = (((hash >> 8) % 200) - 100) / 10000;
    return { latitude: latJ, longitude: lngJ };
}

export function coordsForLocationText(location: string, id?: string): CoordPair | null {
    const text = location?.trim();
    if (!text) return null;

    for (const { pattern, coords } of LOCATION_PATTERNS) {
        if (pattern.test(text)) {
            const jitter = jitterFromId(id);
            return {
                latitude: coords.latitude + jitter.latitude,
                longitude: coords.longitude + jitter.longitude,
            };
        }
    }
    return null;
}
