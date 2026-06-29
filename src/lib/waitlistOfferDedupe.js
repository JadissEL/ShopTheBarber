const STORAGE_KEY = 'stb-seen-waitlist-offers';
const MAX_SEEN = 50;

const seen = new Set();
let loaded = false;

function loadSeen() {
    if (loaded || typeof sessionStorage === 'undefined') return;
    loaded = true;
    try {
        const raw = sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const ids = JSON.parse(raw);
        if (Array.isArray(ids)) {
            ids.forEach((id) => seen.add(String(id)));
        }
    } catch {
        /* private mode */
    }
}

function persistSeen() {
    if (typeof sessionStorage === 'undefined') return;
    try {
        const arr = [...seen].slice(-MAX_SEEN);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch {
        /* quota / private mode */
    }
}

export function hasSeenWaitlistOffer(offerId) {
    if (!offerId) return false;
    loadSeen();
    return seen.has(String(offerId));
}

/** Returns true if this offer was newly marked (caller should notify). */
export function markWaitlistOfferSeen(offerId) {
    if (!offerId) return true;
    loadSeen();
    const key = String(offerId);
    if (seen.has(key)) return false;
    seen.add(key);
    persistSeen();
    return true;
}
