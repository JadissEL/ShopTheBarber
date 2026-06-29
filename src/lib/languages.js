/** Fallback when API options are unavailable */
export const FALLBACK_LANGUAGE_OPTIONS = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'el', label: 'Greek', native: 'Ελληνικά' },
    { code: 'fr', label: 'French', native: 'Français' },
    { code: 'ar', label: 'Arabic', native: 'العربية' },
    { code: 'de', label: 'German', native: 'Deutsch' },
    { code: 'es', label: 'Spanish', native: 'Español' },
    { code: 'it', label: 'Italian', native: 'Italiano' },
    { code: 'pt', label: 'Portuguese', native: 'Português' },
    { code: 'tr', label: 'Turkish', native: 'Türkçe' },
    { code: 'ru', label: 'Russian', native: 'Русский' },
    { code: 'sq', label: 'Albanian', native: 'Shqip' },
    { code: 'ro', label: 'Romanian', native: 'Română' },
];

export function parseSpokenLanguages(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw !== 'string') return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
        return raw.split(',').map((s) => s.trim()).filter(Boolean);
    }
}

export function mergeSpokenLanguages(...groups) {
    const set = new Set();
    for (const group of groups) {
        for (const code of group || []) set.add(code);
    }
    return [...set];
}

export function getLanguageLabel(code, options = FALLBACK_LANGUAGE_OPTIONS) {
    const found = options.find((o) => o.code === code);
    return found ? found.label : code.toUpperCase();
}

export function getLanguageDisplay(code, options = FALLBACK_LANGUAGE_OPTIONS) {
    const found = options.find((o) => o.code === code);
    if (!found) return code.toUpperCase();
    return found.native !== found.label ? `${found.label} (${found.native})` : found.label;
}

export function matchesLanguageFilter(barberLanguages, shopLanguages, filterCodes) {
    if (!filterCodes?.length) return true;
    const effective = mergeSpokenLanguages(barberLanguages, shopLanguages);
    return filterCodes.some((code) => effective.includes(code));
}

export function effectiveBarberLanguages(barber, shopById = {}) {
    const barberLangs = parseSpokenLanguages(barber?.spoken_languages);
    const shop = barber?.shop_id ? shopById[barber.shop_id] : null;
    const shopLangs = parseSpokenLanguages(shop?.spoken_languages);
    return mergeSpokenLanguages(barberLangs, shopLangs);
}
