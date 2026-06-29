import { SEO_CITIES } from './cities';

/** Infer canonical SEO city name from a free-text location string. */
export function inferSeoCityName(location: string | null | undefined): string | null {
    if (!location?.trim()) return null;
    const lower = location.toLowerCase();
    for (const city of SEO_CITIES) {
        if (lower.includes(city.name.toLowerCase())) return city.name;
    }
    if (lower.includes('nyc') || lower.includes('manhattan')) return 'New York';
    if (lower.includes('montréal') || lower.includes('montreal')) return 'Montreal';
    return null;
}

/** Best-effort city for barber SEO, prefers existing city, then SEO match, then first location segment. */
export function primaryCityFromLocation(
    location: string | null | undefined,
    existingCity?: string | null
): string | null {
    if (existingCity?.trim()) return existingCity.trim();
    const inferred = inferSeoCityName(location);
    if (inferred) return inferred;
    if (!location?.trim()) return null;
    return location.split(',')[0]?.trim() || location.trim();
}
