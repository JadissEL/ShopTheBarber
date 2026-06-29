import { hasSeenWaitlistOffer, markWaitlistOfferSeen } from './waitlistOfferDedupe';

const WAITLIST_TAG = 'waitlist-offer';
const BROWSER_WAITLIST_PREF_KEY = 'stb-browser-waitlist-alerts';

export function browserWaitlistAlertsEnabled() {
    if (typeof localStorage === 'undefined') return true;
    try {
        const v = localStorage.getItem(BROWSER_WAITLIST_PREF_KEY);
        return v !== 'false';
    } catch {
        return true;
    }
}

export function setBrowserWaitlistAlertsEnabled(enabled) {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(BROWSER_WAITLIST_PREF_KEY, enabled ? 'true' : 'false');
    } catch {
        /* private mode */
    }
}

export async function ensureNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    try {
        return await Notification.requestPermission();
    } catch {
        return 'denied';
    }
}

export function showBrowserNotification({ title, body, tag, onClick }) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
        const notification = new Notification(title, {
            body,
            tag: tag || 'stb-notification',
            icon: '/favicon.ico',
        });
        notification.onclick = () => {
            window.focus();
            onClick?.();
            notification.close();
        };
    } catch {
        /* Safari private mode, etc. */
    }
}

export function playWaitlistAlertSound() {
    if (typeof window === 'undefined') return;
    try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const beep = (freq, at, dur) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = freq;
            gain.gain.value = 0.08;
            osc.start(at);
            osc.stop(at + dur);
        };
        beep(880, ctx.currentTime, 0.12);
        beep(1174, ctx.currentTime + 0.18, 0.15);
    } catch {
        /* blocked until user gesture */
    }
}

export function notifyWaitlistOffer({ offerId, title, body, navigate }) {
    if (!browserWaitlistAlertsEnabled()) return;
    if (offerId && hasSeenWaitlistOffer(offerId)) return;
    if (offerId && !markWaitlistOfferSeen(offerId)) return;

    showBrowserNotification({
        title,
        body,
        tag: offerId ? `${WAITLIST_TAG}-${offerId}` : WAITLIST_TAG,
        onClick: () => navigate?.('/UserBookings?tab=waitlist'),
    });
    playWaitlistAlertSound();
}

export { WAITLIST_TAG };
