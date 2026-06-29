export const SUPPORTED_LANGUAGES = [
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
    { code: 'bg', label: 'Bulgarian', native: 'Български' },
    { code: 'uk', label: 'Ukrainian', native: 'Українська' },
    { code: 'nl', label: 'Dutch', native: 'Nederlands' },
    { code: 'pl', label: 'Polish', native: 'Polski' },
    { code: 'zh', label: 'Chinese', native: '中文' },
    { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
] as const;

export const SUPPORTED_LANGUAGE_CODES = new Set(SUPPORTED_LANGUAGES.map((l) => l.code));

export const MAX_LANGUAGES_PER_PROFILE = 8;
