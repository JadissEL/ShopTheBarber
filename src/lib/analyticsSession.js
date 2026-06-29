const SESSION_KEY = 'stb_analytics_session';

const ANONYMOUS_KEY = 'stb_analytics_anonymous_id';



function randomId() {

    if (typeof crypto !== 'undefined' && crypto.randomUUID) {

        return crypto.randomUUID();

    }

    return `id_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

}



/** Persistent device-level ID, survives sessions (Amplitude distinct_id / anonymous_id pattern). */

export function getAnonymousId() {

    if (typeof window === 'undefined') return null;

    try {

        let id = localStorage.getItem(ANONYMOUS_KEY);

        if (!id) {

            id = randomId();

            localStorage.setItem(ANONYMOUS_KEY, id);

        }

        return id;

    } catch {

        return randomId();

    }

}



/** Rolling session for funnel analytics (30-day). */

export function getAnalyticsSessionId() {

    if (typeof window === 'undefined') return null;

    try {

        const raw = localStorage.getItem(SESSION_KEY);

        if (raw) {

            const parsed = JSON.parse(raw);

            if (parsed?.id && parsed?.exp && parsed.exp > Date.now()) {

                return parsed.id;

            }

        }

        const id = randomId();

        const exp = Date.now() + 30 * 24 * 60 * 60 * 1000;

        localStorage.setItem(SESSION_KEY, JSON.stringify({ id, exp }));

        return id;

    } catch {

        return randomId();

    }

}



export function getUtmParams() {

    if (typeof window === 'undefined') return {};

    const params = new URLSearchParams(window.location.search);

    return {

        utm_source: params.get('utm_source') || undefined,

        utm_medium: params.get('utm_medium') || undefined,

        utm_campaign: params.get('utm_campaign') || undefined,

    };

}



export const FUNNEL_PAGE_EVENTS = {

    Home: 'view_home',

    Explore: 'view_explore',

    BarberProfile: 'view_barber_profile',

    ShopProfile: 'view_shop_profile',

    BookingFlow: 'booking_started',

};


