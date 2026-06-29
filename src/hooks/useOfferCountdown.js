import { useEffect, useState } from 'react';

function parseExpiry(iso) {
    if (!iso) return null;
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? null : t;
}

/** Live countdown to an ISO expiry timestamp. */
export function useOfferCountdown(expiresAtIso, totalWindowMs = 15 * 60 * 1000) {
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const id = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(id);
    }, []);

    const expiresAt = parseExpiry(expiresAtIso);
    if (!expiresAt) {
        return { remainingMs: 0, expired: true, progress: 0, label: '0:00' };
    }

    const remainingMs = Math.max(0, expiresAt - now);
    const expired = remainingMs <= 0;
    const elapsed = totalWindowMs - remainingMs;
    const progress = Math.min(1, Math.max(0, elapsed / totalWindowMs));

    const totalSec = Math.ceil(remainingMs / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    const label = `${min}:${sec.toString().padStart(2, '0')}`;

    return { remainingMs, expired, progress, label };
}
