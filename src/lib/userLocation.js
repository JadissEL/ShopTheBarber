const STORAGE_KEY = 'stb_preferred_location';

/** @returns {{ address: string, latitude: number, longitude: number } | null} */
export function loadPreferredLocation() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (
            typeof parsed?.address === 'string' &&
            parsed.address.trim() &&
            Number.isFinite(parsed.latitude) &&
            Number.isFinite(parsed.longitude)
        ) {
            return {
                address: parsed.address.trim(),
                latitude: parsed.latitude,
                longitude: parsed.longitude,
            };
        }
        return null;
    } catch {
        return null;
    }
}

export function savePreferredLocation({ address, latitude, longitude }) {
    const trimmed = address?.trim();
    if (!trimmed || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return;
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ address: trimmed, latitude, longitude })
    );
}

export function clearPreferredLocation() {
    localStorage.removeItem(STORAGE_KEY);
}
