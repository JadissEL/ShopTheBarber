import {
    MAX_LANGUAGES_PER_PROFILE,
    SUPPORTED_LANGUAGE_CODES,
    SUPPORTED_LANGUAGES,
} from './config';

export function parseSpokenLanguages(raw: string | null | undefined): string[] {
    if (!raw) return [];
    if (typeof raw !== 'string') return [];
    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((x) => String(x).trim().toLowerCase())
            .filter((code) => SUPPORTED_LANGUAGE_CODES.has(code));
    } catch {
        return raw
            .split(',')
            .map((x) => x.trim().toLowerCase())
            .filter((code) => SUPPORTED_LANGUAGE_CODES.has(code));
    }
}

export function normalizeLanguageInput(input: unknown): string[] {
    const raw = Array.isArray(input) ? input : typeof input === 'string' ? [input] : [];
    const unique = [...new Set(raw.map((x) => String(x).trim().toLowerCase()))];
    const valid = unique.filter((code) => SUPPORTED_LANGUAGE_CODES.has(code));
    if (valid.length > MAX_LANGUAGES_PER_PROFILE) {
        throw new Error(`Maximum ${MAX_LANGUAGES_PER_PROFILE} languages allowed`);
    }
    return valid;
}

export function stringifySpokenLanguages(codes: string[]): string | null {
    if (codes.length === 0) return null;
    return JSON.stringify(codes);
}

export function mergeSpokenLanguages(...groups: string[][]): string[] {
    const set = new Set<string>();
    for (const group of groups) {
        for (const code of group) set.add(code);
    }
    return [...set];
}

export function matchesLanguageFilter(
    barberLanguages: string[],
    shopLanguages: string[],
    filterCodes: string[]
): boolean {
    if (filterCodes.length === 0) return true;
    const effective = mergeSpokenLanguages(barberLanguages, shopLanguages);
    return filterCodes.some((code) => effective.includes(code));
}

export function serializeLanguageOptions() {
    return SUPPORTED_LANGUAGES.map(({ code, label, native }) => ({ code, label, native }));
}

export function enrichWithParsedLanguages<T extends { spoken_languages?: string | null }>(row: T) {
    const spoken_languages = parseSpokenLanguages(row.spoken_languages);
    return { ...row, spoken_languages };
}
