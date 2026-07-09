/**
 * SOVEREIGN API CLIENT
 * 
 * This is a drop-in replacement for any legacy SDK in the ShopTheBarber project.
 * It redirects all entity and function calls to the new Fastify + SQLite backend.
 */

// In dev: relative /api so Vite proxy forwards to backend.
// In production: set VITE_API_URL to the backend origin (e.g. https://your-api.onrender.com)
const rawApiUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : '';
const BASE_URL = rawApiUrl ? `${rawApiUrl}/api` : '/api';

const ANALYTICS_SESSION_KEY = 'stb_analytics_session';
const ANALYTICS_ANONYMOUS_KEY = 'stb_analytics_anonymous_id';
const ANALYTICS_SCHEMA_VERSION = 1;
const analyticsQueue = [];
let analyticsFlushTimer = null;
let identifyPromise = null;

function getAnalyticsSessionId() {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(ANALYTICS_SESSION_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed?.id && parsed?.exp && parsed.exp > Date.now()) return parsed.id;
        }
        const id = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
        localStorage.setItem(ANALYTICS_SESSION_KEY, JSON.stringify({ id, exp: Date.now() + 30 * 86400000 }));
        return id;
    } catch {
        return null;
    }
}

function getAnonymousId() {
    if (typeof window === 'undefined') return null;
    try {
        let id = localStorage.getItem(ANALYTICS_ANONYMOUS_KEY);
        if (!id) {
            id = typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `anon_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
            localStorage.setItem(ANALYTICS_ANONYMOUS_KEY, id);
        }
        return id;
    } catch {
        return null;
    }
}

function getGlobalAnalyticsContext() {
    const utm = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search)
        : null;
    return {
        schema_version: ANALYTICS_SCHEMA_VERSION,
        platform: 'web',
        anonymous_id: getAnonymousId(),
        referrer: typeof document !== 'undefined' ? (document.referrer || undefined) : undefined,
        utm_source: utm?.get('utm_source') || undefined,
        utm_medium: utm?.get('utm_medium') || undefined,
        utm_campaign: utm?.get('utm_campaign') || undefined,
    };
}

function flushAnalyticsQueue() {
    analyticsFlushTimer = null;
    if (analyticsQueue.length === 0) return;
    const batch = analyticsQueue.splice(0, 25);
    const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
    const body = batch.length === 1
        ? JSON.stringify(batch[0])
        : JSON.stringify({ events: batch });
    const url = batch.length === 1 ? `${BASE_URL}/analytics/track` : `${BASE_URL}/analytics/track/batch`;
    fetch(url, { method: 'POST', headers, body, keepalive: true }).catch(() => {});
}

function scheduleAnalyticsFlush() {
    if (analyticsFlushTimer) return;
    analyticsFlushTimer = setTimeout(flushAnalyticsQueue, 1500);
}

function enqueueAnalyticsEvent(event) {
    const event_name = event?.eventName || event?.event_name;
    if (!event_name) return;
    analyticsQueue.push({
        event_name,
        session_id: getAnalyticsSessionId(),
        properties: {
            ...getGlobalAnalyticsContext(),
            ...(event.properties ?? {}),
        },
        page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });
    scheduleAnalyticsFlush();
}

class EntityClient {
    constructor(entityName) {
        this.entityName = entityName;

        // Convert CamelCase to snake_case (e.g., LoyaltyProfile -> loyalty_profile)
        const snakeCase = entityName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, "");

        // Handle pluralization (e.g., entity -> entities, y -> ies)
        const plural = snakeCase.endsWith('y') && !snakeCase.endsWith('ey') ? `${snakeCase.slice(0, -1)  }ies` : `${snakeCase  }s`;
        this.resource = plural;
    }

    async list(order, limit, offset) {
        const headers = getAuthHeaders();
        const params = new URLSearchParams();
        params.set('limit', String(limit != null ? limit : 200));
        params.set('offset', String(offset != null ? offset : 0));
        if (order) params.set('order', order);
        const res = await fetch(`${BASE_URL}/${this.resource}?${params}`, { headers });
        if (!res.ok) throw new Error(`Failed to fetch ${this.entityName} (${this.resource})`);
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    }

    async filter(criteria, order, limit, offset) {
        const headers = { ...(await resolveAuthHeaders()), 'Content-Type': 'application/json' };
        const payload = {
            query: criteria && typeof criteria === 'object' ? criteria : {},
            order: order || undefined,
            limit: limit != null ? limit : 200,
            offset: offset != null ? offset : 0,
        };
        const res = await fetch(`${BASE_URL}/${this.resource}/filter`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Failed to filter ${this.entityName} (${res.status}): ${text || res.statusText}`);
        }
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    }

    async get(id) {
        const headers = getAuthHeaders();
        const res = await fetch(`${BASE_URL}/${this.resource}/${id}`, { headers });
        if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error(`Failed to get ${this.entityName} ${id}`);
        }
        return await res.json();
    }

    async read(id) {
        return this.get(id);
    }

    async create(data) {
        const headers = { ...(await resolveAuthHeaders()), 'Content-Type': 'application/json' };
        const res = await fetch(`${BASE_URL}/${this.resource}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const text = await res.text();
            let err;
            try { err = JSON.parse(text); } catch { err = { error: text || `Server Error (${res.status})` }; }
            const msg = err.error || `Failed to create ${this.entityName}`;
            throw new Error(err.hint ? `${msg}. ${err.hint}` : msg);
        }
        return await res.json();
    }

    async update(id, data) {
        const headers = { ...(await resolveAuthHeaders()), 'Content-Type': 'application/json' };
        const res = await fetch(`${BASE_URL}/${this.resource}/${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`Failed to update ${this.entityName} ${id}`);
        return await res.json();
    }

    async delete(id) {
        const headers = await resolveAuthHeaders();
        const res = await fetch(`${BASE_URL}/${this.resource}/${id}`, {
            method: 'DELETE',
            headers
        });
        if (!res.ok) throw new Error(`Failed to delete ${this.entityName} ${id}`);
        return await res.json();
    }

    subscribe(_criteria, _callback) { return () => { }; }
}

const AUTH_ME_TIMEOUT_MS = 15_000;

/** Registered by AuthProvider — fetches a fresh Clerk JWT before API calls. */
let clerkGetTokenFn = null;

export function registerClerkGetToken(fn) {
    clerkGetTokenFn = fn;
}

function getAuthHeaders() {
    // Check for Clerk token first, fallback to legacy sovereign token
    const clerkToken = localStorage.getItem('clerk_token');
    const sovereignToken = localStorage.getItem('sovereign_token');
    const token = clerkToken || sovereignToken;
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/** Prefer a fresh Clerk token; fall back to cached localStorage token. */
async function resolveAuthHeaders() {
    if (clerkGetTokenFn) {
        try {
            const token = await clerkGetTokenFn();
            if (token) {
                localStorage.setItem('clerk_token', token);
                return { Authorization: `Bearer ${token}` };
            }
        } catch (err) {
            console.warn('Could not refresh Clerk token:', err);
        }
    }
    return getAuthHeaders();
}

export const sovereign = {
    entities: new Proxy({}, {
        get: (target, prop) => {
            if (!target[prop]) {
                target[prop] = new EntityClient(prop);
            }
            return target[prop];
        }
    }),

    auth: {
        /** Full auth/me result for sync flows (includes server hints on misconfiguration). */
        meResult: async () => {
            const headers = await resolveAuthHeaders();
            if (!headers.Authorization) {
                return { user: null, error: null };
            }

            try {
                const res = await fetch(`${BASE_URL}/auth/me`, {
                    headers,
                    signal: AbortSignal.timeout(AUTH_ME_TIMEOUT_MS),
                });
                const body = await res.json().catch(() => ({}));
                if (res.ok) {
                    if (body.needsProvision) {
                        return { user: null, needsProvision: true, profile: body, error: null };
                    }
                    return { user: body, needsProvision: false, error: null };
                }
                if (res.status === 401) {
                    localStorage.removeItem('sovereign_token');
                    localStorage.removeItem('clerk_token');
                    return {
                        user: null,
                        error: {
                            status: 401,
                            message: body.error || 'Unauthorized',
                            hint: body.hint,
                        },
                    };
                }
                return {
                    user: null,
                    error: {
                        status: res.status,
                        message: body.error || `Auth check failed (${res.status})`,
                        hint: body.hint,
                    },
                };
            } catch (err) {
                console.warn('Auth check failed:', err);
                return {
                    user: null,
                    error: {
                        status: 0,
                        message: err instanceof Error ? err.message : 'Network error',
                    },
                };
            }
        },
        me: async () => {
            const { user } = await sovereign.auth.meResult();
            return user;
        },
        // Interactive sign-in/up is handled by Clerk (see lib/AuthContext.jsx).
        logout: async () => {
            localStorage.removeItem('sovereign_token');
            try {
                await fetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
            } catch { void 0; }
            return { success: true };
        },
        provision: async (accountType, signupIntentToken) => {
            const headers = await resolveAuthHeaders();
            if (!headers.Authorization) {
                throw new Error('Sign in required');
            }
            const res = await fetch(`${BASE_URL}/auth/provision`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountType, signupIntentToken }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) {
                return {
                    ok: false,
                    code: body.code || 'PROVISION_FAILED',
                    message: body.error || 'Could not create account',
                };
            }
            return { ok: true, user: body, accountType: body.account_type || accountType };
        },
        redirectToLogin: (returnPath) => {
            const signInPath = '/login';
            const query = returnPath ? `?return=${encodeURIComponent(returnPath)}` : '';
            window.location.href = signInPath + query;
        }
    },

    onboarding: {
        getSellerProfile: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/onboarding/seller-profile`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load seller profile');
            }
            return res.json();
        },
        updateSellerProfile: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/onboarding/seller-profile`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to save seller profile');
            }
            return res.json();
        },
        getCompanyProfile: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/onboarding/company-profile`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load company profile');
            }
            return res.json();
        },
        updateCompanyProfile: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/onboarding/company-profile`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to save company profile');
            }
            return res.json();
        },
        getAuthorProfile: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/onboarding/author-profile`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load author profile');
            }
            return res.json();
        },
        updateAuthorProfile: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/onboarding/author-profile`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to save author profile');
            }
            return res.json();
        },
    },

    /** Anonymous endpoints; use BASE_URL so production calls VITE_API_URL (same as entities/functions). */
    public: {
        getActivePromotions: async (barberId) => {
            const qs =
                barberId != null && barberId !== ''
                    ? `?barber_id=${encodeURIComponent(String(barberId))}`
                    : '';
            const res = await fetch(`${BASE_URL}/public/active-promotions${qs}`);
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `Promotions unavailable (${res.status})`);
            }
            return res.json();
        },
        getHomepage: async () => {
            const res = await fetch(`${BASE_URL}/public/home`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load homepage');
            }
            return res.json();
        },
    },

    explore: {
        searchBarbers: async (params = {}) => {
            const qs = new URLSearchParams();
            if (params.q) qs.set('q', params.q);
            if (params.city) qs.set('city', params.city);
            if (params.service) qs.set('service', params.service);
            if (params.language) qs.set('language', params.language);
            if (params.kids) qs.set('kids', '1');
            if (params.mobile) qs.set('mobile', '1');
            if (params.shop) qs.set('shop', '1');
            if (params.group) qs.set('group', '1');
            if (params.highlight) qs.set('highlight', params.highlight);
            if (params.limit != null) qs.set('limit', String(params.limit));
            if (params.offset != null) qs.set('offset', String(params.offset));
            const query = qs.toString();
            const res = await fetch(`${BASE_URL}/explore/barbers${query ? `?${query}` : ''}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Explore search failed');
            }
            return res.json();
        },
        searchShops: async (params = {}) => {
            const qs = new URLSearchParams();
            if (params.q) qs.set('q', params.q);
            if (params.city) qs.set('city', params.city);
            if (params.language) qs.set('language', params.language);
            if (params.kids) qs.set('kids', '1');
            if (params.limit != null) qs.set('limit', String(params.limit));
            if (params.offset != null) qs.set('offset', String(params.offset));
            const query = qs.toString();
            const res = await fetch(`${BASE_URL}/explore/shops${query ? `?${query}` : ''}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Explore shop search failed');
            }
            return res.json();
        },
    },

    functions: {
        invoke: async (name, payload) => {
            const headers = { ...(await resolveAuthHeaders()), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/functions/${name}`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `Function ${name} failed`);
            }
            return await res.json();
        }
    },

    cart: {
        get: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/cart`, { headers });
            if (res.status === 401) return [];
            if (!res.ok) throw new Error('Failed to fetch cart');
            return res.json();
        },
        add: async (productId, quantity = 1) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/cart`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ product_id: productId, quantity })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to add to cart');
            }
            return res.json();
        },
        updateQuantity: async (productId, quantity) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/cart/${encodeURIComponent(productId)}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ quantity })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update cart');
            }
            return res.json();
        },
        remove: async (productId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/cart/${encodeURIComponent(productId)}`, { method: 'DELETE', headers });
            if (!res.ok) throw new Error('Failed to remove from cart');
            return res.json();
        },
        clear: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/cart`, { method: 'DELETE', headers });
            if (!res.ok) throw new Error('Failed to clear cart');
            return res.json();
        }
    },
    vault: {
        getSummary: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/vault/summary`, { headers });
            if (res.status === 401) return null;
            if (!res.ok) throw new Error('Failed to fetch vault summary');
            return res.json();
        }
    },
    orders: {
        list: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/orders`, { headers });
            if (res.status === 401) return [];
            if (!res.ok) throw new Error('Failed to fetch orders');
            return res.json();
        },
        listAdmin: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/orders`, { headers });
            if (res.status === 401) return [];
            if (res.status === 403) return [];
            if (!res.ok) throw new Error('Failed to fetch admin orders');
            return res.json();
        },
        get: async (orderId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/orders/${encodeURIComponent(orderId)}`, { headers });
            if (!res.ok) {
                if (res.status === 404) return null;
                throw new Error('Failed to fetch order');
            }
            return res.json();
        },
        update: async (orderId, data) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/orders/${encodeURIComponent(orderId)}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update order');
            }
            return res.json();
        }
    },
    jobs: {
        listPublic: async (params = {}) => {
            const q = new URLSearchParams(params).toString();
            const res = await fetch(`${BASE_URL}/jobs/public${q ? `?${  q}` : ''}`);
            if (!res.ok) throw new Error('Failed to fetch jobs');
            return res.json();
        },
        featuredPublic: async () => {
            const res = await fetch(`${BASE_URL}/jobs/public/featured`);
            if (!res.ok) throw new Error('Failed to fetch featured jobs');
            return res.json();
        },
        getPublic: async (id) => {
            const res = await fetch(`${BASE_URL}/jobs/public/${encodeURIComponent(id)}`);
            if (res.status === 404) return null;
            if (!res.ok) throw new Error('Failed to fetch job');
            return res.json();
        },
        /** @deprecated use listPublic */
        list: async (params = {}) => {
            const q = new URLSearchParams(params).toString();
            const res = await fetch(`${BASE_URL}/jobs/public${q ? `?${  q}` : ''}`);
            if (!res.ok) throw new Error('Failed to fetch jobs');
            return res.json();
        },
        /** @deprecated use featuredPublic */
        featured: async () => {
            const res = await fetch(`${BASE_URL}/jobs/public/featured`);
            if (!res.ok) throw new Error('Failed to fetch featured jobs');
            return res.json();
        },
        get: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/jobs/${encodeURIComponent(id)}`, { headers });
            if (res.status === 404) return null;
            if (!res.ok) throw new Error('Failed to fetch job');
            return res.json();
        },
        employerProfiles: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/jobs/employer-profiles`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load employer profiles');
            }
            return res.json();
        },
        my: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/jobs/my`, { headers });
            if (res.status === 401 || res.status === 403) return [];
            if (!res.ok) throw new Error('Failed to fetch my jobs');
            return res.json();
        },
        create: async (data) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/jobs`, { method: 'POST', headers, body: JSON.stringify(data) });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to create job'); }
            return res.json();
        },
        update: async (id, data) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/jobs/${encodeURIComponent(id)}`, { method: 'PATCH', headers, body: JSON.stringify(data) });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to update job'); }
            return res.json();
        },
        submit: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/jobs/${encodeURIComponent(id)}/submit`, { method: 'POST', headers });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to submit job'); }
            return res.json();
        },
        close: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/jobs/${encodeURIComponent(id)}/close`, { method: 'POST', headers });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to close job'); }
            return res.json();
        },
        delete: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/jobs/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to delete job'); }
            return res.json();
        },
        listAdmin: async (status = 'pending_review') => {
            const headers = getAuthHeaders();
            const q = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
            const res = await fetch(`${BASE_URL}/admin/jobs${q}`, { headers });
            if (res.status === 401 || res.status === 403) return [];
            if (!res.ok) throw new Error('Failed to fetch admin jobs');
            return res.json();
        },
        approve: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/jobs/${encodeURIComponent(id)}/approve`, { method: 'POST', headers });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to approve job'); }
            return res.json();
        },
        reject: async (id, reason) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/admin/jobs/${encodeURIComponent(id)}/reject`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ reason }),
            });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to reject job'); }
            return res.json();
        },
        unpublish: async (id, reason) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/admin/jobs/${encodeURIComponent(id)}/unpublish`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ reason }),
            });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to unpublish job'); }
            return res.json();
        },
    },
    companies: {
        list: async () => {
            const res = await fetch(`${BASE_URL}/companies`);
            if (!res.ok) throw new Error('Failed to fetch companies');
            return res.json();
        }
    },
    shops: {
        list: async () => {
            const res = await fetch(`${BASE_URL}/shops`);
            if (!res.ok) throw new Error('Failed to fetch shops');
            return res.json();
        },
        getMyPermissions: async (shopId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/shops/${encodeURIComponent(shopId)}/my-permissions`, { headers });
            if (!res.ok) throw new Error('Failed to load shop permissions');
            return res.json();
        },
    },
    applicant: {
        getProfile: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/applicant/profile`, { headers });
            if (res.status === 401) return null;
            if (!res.ok) throw new Error('Failed to fetch profile');
            return res.json();
        },
        saveProfile: async (data) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/applicant/profile`, { method: 'PUT', headers, body: JSON.stringify(data) });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to save profile'); }
            return res.json();
        },
        getCredentials: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/applicant/credentials`, { headers });
            if (res.status === 401) return [];
            if (!res.ok) throw new Error('Failed to fetch credentials');
            return res.json();
        },
        addCredential: async (data) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/applicant/credentials`, { method: 'POST', headers, body: JSON.stringify(data) });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to add credential'); }
            return res.json();
        },
        uploadCredential: async ({ type, file }) => {
            const base64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result;
                    if (typeof result !== 'string') {
                        reject(new Error('Failed to read file'));
                        return;
                    }
                    resolve(result.split(',')[1] || result);
                };
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsDataURL(file);
            });
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/applicant/credentials/upload`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    type,
                    file_name: file.name,
                    file_base64: base64,
                    mime_type: file.type || 'application/octet-stream',
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to upload credential');
            }
            return res.json();
        },
        deleteCredential: async (credentialId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/applicant/credentials/${encodeURIComponent(credentialId)}`, {
                method: 'DELETE',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to delete credential');
            }
            return res.json();
        },
        getCredentialBlobUrl: async (credentialId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/applicant/credentials/${encodeURIComponent(credentialId)}/file`, { headers });
            if (!res.ok) throw new Error('Failed to load file');
            const blob = await res.blob();
            return URL.createObjectURL(blob);
        },
        downloadCredential: async (credentialId, fileName) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/applicant/credentials/${encodeURIComponent(credentialId)}/file`, { headers });
            if (!res.ok) throw new Error('Failed to download file');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName || 'document';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        },
        getApplications: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/applicant/applications`, { headers });
            if (res.status === 401) return [];
            if (!res.ok) throw new Error('Failed to fetch applications');
            return res.json();
        },
        apply: async (jobId, data = {}) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/applicant/applications`, { method: 'POST', headers, body: JSON.stringify({ job_id: jobId, ...data }) });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to apply'); }
            return res.json();
        },
        getSaved: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/applicant/saved`, { headers });
            if (res.status === 401) return [];
            if (!res.ok) throw new Error('Failed to fetch saved jobs');
            return res.json();
        },
        saveJob: async (jobId) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/applicant/saved`, { method: 'POST', headers, body: JSON.stringify({ job_id: jobId }) });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to save job'); }
            return res.json();
        },
        unsaveJob: async (jobId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/applicant/saved/${encodeURIComponent(jobId)}`, { method: 'DELETE', headers });
            if (!res.ok) throw new Error('Failed to unsave job');
            return res.json();
        }
    },
    applications: {
        listForJob: async (jobId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/jobs/${encodeURIComponent(jobId)}/applications`, { headers });
            if (!res.ok) throw new Error('Failed to fetch applicants');
            return res.json();
        },
        updateStatus: async (applicationId, status) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/applications/${encodeURIComponent(applicationId)}`, { method: 'PATCH', headers, body: JSON.stringify({ status }) });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to update status'); }
            return res.json();
        },
        scheduleInterview: async (applicationId, data) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/applications/${encodeURIComponent(applicationId)}/interview`, { method: 'POST', headers, body: JSON.stringify(data) });
            if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Failed to schedule interview'); }
            return res.json();
        },
        getInterviews: async (applicationId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/applications/${encodeURIComponent(applicationId)}/interviews`, { headers });
            if (!res.ok) throw new Error('Failed to fetch interviews');
            return res.json();
        }
    },
    analytics: {
        track: (event) => {
            enqueueAnalyticsEvent(event);
        },
        flush: () => {
            flushAnalyticsQueue();
        },
        identify: () => {
            if (identifyPromise) return identifyPromise;
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            identifyPromise = fetch(`${BASE_URL}/analytics/identify`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    anonymous_id: getAnonymousId(),
                    session_id: getAnalyticsSessionId(),
                }),
            })
                .catch(() => {})
                .finally(() => {
                    identifyPromise = null;
                });
            return identifyPromise;
        },
    },
    productAnalytics: {
        getDashboard: async (days = 30) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/analytics/dashboard?days=${encodeURIComponent(days)}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load analytics dashboard');
            }
            return res.json();
        },
        getNorthStar: async (days = 30) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/analytics/north-star?days=${encodeURIComponent(days)}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load north-star metrics');
            }
            return res.json();
        },
    },
    privacy: {
        exportData: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/privacy/export`, { headers });
            if (!res.ok) throw new Error('Failed to export data');
            return res.json();
        },
        deleteAccount: async () => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/privacy/delete-account`, { method: 'POST', headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to delete account');
            }
            return res.json();
        },
    },
    status: {
        getPublic: async () => {
            const res = await fetch(`${BASE_URL}/status/public`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load status');
            }
            return res.json();
        },
    },
    admin: {
        getConfigReadiness: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/config-readiness`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load config readiness');
            }
            return res.json();
        },
        listLedger: async (params = {}) => {
            const q = new URLSearchParams();
            if (params.limit) q.set('limit', String(params.limit));
            if (params.offset) q.set('offset', String(params.offset));
            if (params.event_type) q.set('event_type', params.event_type);
            if (params.entity_type) q.set('entity_type', params.entity_type);
            if (params.search) q.set('search', params.search);
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/ledger?${q.toString()}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load ledger');
            }
            return res.json();
        },
        getFinancialTrustLive: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/financial-trust/live`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load live metrics');
            }
            return res.json();
        },
        listFraudAlerts: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/fraud-alerts`, { headers });
            if (!res.ok) throw new Error('Failed to load fraud alerts');
            return res.json();
        },
        resolveFraudAlert: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/fraud-alerts/${encodeURIComponent(id)}/resolve`, {
                method: 'POST',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to resolve alert');
            }
            return res.json();
        },
        listDisputeAppeals: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/dispute-appeals`, { headers });
            if (!res.ok) throw new Error('Failed to load dispute appeals');
            return res.json();
        },
        resolveDisputeAppeal: async (id, status) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/admin/dispute-appeals/${encodeURIComponent(id)}/resolve`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ status }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to resolve appeal');
            }
            return res.json();
        },
        searchUsers: async (query) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/users/search?q=${encodeURIComponent(query)}`, { headers });
            if (!res.ok) throw new Error('User search failed');
            return res.json();
        },
        listPartnerKeys: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/partner-keys`, { headers });
            if (!res.ok) throw new Error('Failed to load partner keys');
            return res.json();
        },
        createPartnerKey: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/admin/partner-keys`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to create partner key');
            }
            return res.json();
        },
        revokePartnerKey: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/partner-keys/${encodeURIComponent(id)}/revoke`, {
                method: 'POST',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to revoke key');
            }
            return res.json();
        },
        listFinancingApplications: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/financing-applications`, { headers });
            if (!res.ok) throw new Error('Failed to load financing applications');
            return res.json();
        },
        listWalletReconciliation: async (params = {}) => {
            const q = new URLSearchParams();
            if (params.limit) q.set('limit', String(params.limit));
            if (params.mismatches_only) q.set('mismatches_only', 'true');
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/wallet-reconciliation?${q.toString()}`, { headers });
            if (!res.ok) throw new Error('Failed to load wallet reconciliation');
            return res.json();
        },
        grantAdCredits: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/admin/ad-credits/grant`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Grant failed');
            }
            return res.json();
        },
    },
    trust: {
        getMyReputation: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/me/reputation`, { headers });
            if (!res.ok) throw new Error('Failed to load reputation');
            return res.json();
        },
        getMyDashboard: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/me/dashboard/trust`, { headers });
            if (!res.ok) throw new Error('Failed to load trust dashboard');
            return res.json();
        },
        getBarberTrust: async (barberId) => {
            const res = await fetch(`${BASE_URL}/barbers/${encodeURIComponent(barberId)}/trust`);
            if (!res.ok) throw new Error('Failed to load barber trust');
            return res.json();
        },
        getChampionshipLeaderboard: async (params = {}) => {
            const q = new URLSearchParams();
            if (params.season_id) q.set('season_id', params.season_id);
            if (params.limit) q.set('limit', String(params.limit));
            const res = await fetch(`${BASE_URL}/championships/leaderboard?${q.toString()}`);
            if (!res.ok) throw new Error('Failed to load leaderboard');
            return res.json();
        },
        getHallOfFame: async (barberId) => {
            const q = barberId ? `?barber_id=${encodeURIComponent(barberId)}` : '';
            const res = await fetch(`${BASE_URL}/championships/hall-of-fame${q}`);
            if (!res.ok) throw new Error('Failed to load hall of fame');
            return res.json();
        },
    },
    giftCards: {
        purchase: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/gift-cards/purchase`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Purchase failed');
            }
            return res.json();
        },
        redeem: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/gift-cards/redeem`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Redeem failed');
            }
            return res.json();
        },
        listMine: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/gift-cards/mine`, { headers });
            if (!res.ok) throw new Error('Failed to load gift cards');
            return res.json();
        },
    },
    network: {
        getRollup: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/network/rollup`, { headers });
            if (!res.ok) throw new Error('Failed to load network rollup');
            return res.json();
        },
    },
    providerFinancials: {
        getDashboard: async (shopId) => {
            const q = shopId ? `?shop_id=${encodeURIComponent(shopId)}` : '';
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/provider/financial-dashboard${q}`, { headers });
            if (!res.ok) throw new Error('Failed to load provider financial dashboard');
            return res.json();
        },
        getTaxReport: async (params) => {
            const q = new URLSearchParams(params);
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/provider/tax-report?${q.toString()}`, { headers });
            if (!res.ok) throw new Error('Failed to load tax report');
            return res.json();
        },
        downloadTaxCsv: async (params) => {
            const q = new URLSearchParams({ ...params, format: 'csv' });
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/provider/tax-report?${q.toString()}`, { headers });
            if (!res.ok) throw new Error('Failed to export tax report');
            return res.text();
        },
    },
    wallet: {
        updateAutoRecharge: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/me/wallet/auto-recharge`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update auto-recharge');
            }
            return res.json();
        },
        getMe: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/wallet/me`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load wallet');
            }
            return res.json();
        },
    },
    disputes: {
        listMine: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/me/disputes`, { headers });
            if (!res.ok) throw new Error('Failed to load disputes');
            return res.json();
        },
        submitAppeal: async (disputeId, reason) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/disputes/${encodeURIComponent(disputeId)}/appeal`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ reason }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to submit appeal');
            }
            return res.json();
        },
    },
    adCredits: {
        getWallet: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/ad-credits/wallet`, { headers });
            if (!res.ok) throw new Error('Failed to load ad credits');
            return res.json();
        },
        spend: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/ad-credits/spend`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Spend failed');
            }
            return res.json();
        },
    },
    financing: {
        apply: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/financing/apply`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Application failed');
            }
            return res.json();
        },
        listMine: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/me/financing-applications`, { headers });
            if (!res.ok) throw new Error('Failed to load applications');
            return res.json();
        },
    },
    articles: {
        listPublic: async (params = {}) => {
            const q = new URLSearchParams(params).toString();
            const res = await fetch(`${BASE_URL}/articles/public${q ? `?${  q}` : ''}`);
            if (!res.ok) throw new Error('Failed to fetch blog articles');
            return res.json();
        },
        getPublic: async (id) => {
            const res = await fetch(`${BASE_URL}/articles/public/${encodeURIComponent(id)}`);
            if (res.status === 404) return null;
            if (!res.ok) throw new Error('Failed to fetch article');
            return res.json();
        },
        recordView: async (id) => {
            const res = await fetch(`${BASE_URL}/articles/public/${encodeURIComponent(id)}/view`, { method: 'POST' });
            if (!res.ok) return null;
            return res.json();
        },
        mine: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/articles/mine`, { headers });
            if (res.status === 401) return [];
            if (res.status === 403) return [];
            if (!res.ok) throw new Error('Failed to fetch your articles');
            return res.json();
        },
        get: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/articles/${encodeURIComponent(id)}`, { headers });
            if (res.status === 404) return null;
            if (!res.ok) throw new Error('Failed to fetch article');
            return res.json();
        },
        create: async (data) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/articles`, { method: 'POST', headers, body: JSON.stringify(data) });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to create article');
            }
            return res.json();
        },
        update: async (id, data) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/articles/${encodeURIComponent(id)}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update article');
            }
            return res.json();
        },
        submit: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/articles/${encodeURIComponent(id)}/submit`, {
                method: 'POST',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to submit article');
            }
            return res.json();
        },
        uploadImage: async ({ file_name, file_base64, mime_type }) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/articles/upload-image`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ file_name, file_base64, mime_type }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to upload image');
            }
            return res.json();
        },
        delete: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/articles/${encodeURIComponent(id)}`, {
                method: 'DELETE',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to delete article');
            }
            return res.json();
        },
        listAdmin: async (status = 'all') => {
            const headers = getAuthHeaders();
            const q = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
            const res = await fetch(`${BASE_URL}/admin/articles${q}`, { headers });
            if (res.status === 401 || res.status === 403) return [];
            if (!res.ok) throw new Error('Failed to fetch admin articles');
            return res.json();
        },
        approve: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/articles/${encodeURIComponent(id)}/approve`, {
                method: 'POST',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to approve article');
            }
            return res.json();
        },
        reject: async (id, reason) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/admin/articles/${encodeURIComponent(id)}/reject`, {
                method: 'POST',
                headers,
                body: JSON.stringify(reason ? { reason } : {}),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to reject article');
            }
            return res.json();
        },
        unpublish: async (id, reason) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/admin/articles/${encodeURIComponent(id)}/unpublish`, {
                method: 'POST',
                headers,
                body: JSON.stringify(reason ? { reason } : {}),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to unpublish article');
            }
            return res.json();
        },
    },
    pricing: {
        getPolicy: async () => {
            const res = await fetch(`${BASE_URL}/pricing/policy`);
            if (!res.ok) throw new Error('Failed to load pricing policy');
            return res.json();
        },
        getOffers: async (params = {}) => {
            const q = new URLSearchParams();
            if (params.shop_id) q.set('shop_id', params.shop_id);
            if (params.barber_id) q.set('barber_id', params.barber_id);
            if (params.shop_member_id) q.set('shop_member_id', params.shop_member_id);
            if (Array.isArray(params.service_ids) && params.service_ids.length > 0) {
                q.set('service_ids', params.service_ids.join(','));
            }
            const res = await fetch(`${BASE_URL}/pricing/offers?${q.toString()}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load offers');
            }
            return res.json();
        },
        quote: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/pricing/quote`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to calculate price');
            }
            return res.json();
        },
        listBundles: async (params = {}) => {
            const q = new URLSearchParams(params).toString();
            const res = await fetch(`${BASE_URL}/pricing/bundles${q ? `?${  q}` : ''}`);
            if (!res.ok) throw new Error('Failed to load combos');
            return res.json();
        },
        myBundles: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/pricing/bundles/mine`, { headers });
            if (res.status === 401 || res.status === 403) return [];
            if (!res.ok) throw new Error('Failed to load your combos');
            return res.json();
        },
        createBundle: async (data) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/pricing/bundles`, { method: 'POST', headers, body: JSON.stringify(data) });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to create combo');
            }
            return res.json();
        },
        updateBundle: async (id, data) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/pricing/bundles/${encodeURIComponent(id)}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update combo');
            }
            return res.json();
        },
        deleteBundle: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/pricing/bundles/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to delete combo');
            }
            return res.json();
        },
    },
    shop: {
        getTeam: async (shopId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/shop/${encodeURIComponent(shopId)}/team`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load team');
            }
            return res.json();
        },
        getTeamMember: async (shopId, memberId) => {
            const headers = getAuthHeaders();
            const res = await fetch(
                `${BASE_URL}/shop/${encodeURIComponent(shopId)}/team/${encodeURIComponent(memberId)}`,
                { headers }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load team member');
            }
            return res.json();
        },
        addMember: async (shopId, data) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/shop/${encodeURIComponent(shopId)}/team`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to add team member');
            }
            return res.json();
        },
        updateMember: async (shopId, memberId, data) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(
                `${BASE_URL}/shop/${encodeURIComponent(shopId)}/team/${encodeURIComponent(memberId)}`,
                { method: 'PATCH', headers, body: JSON.stringify(data) }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update team member');
            }
            return res.json();
        },
        removeMember: async (shopId, memberId) => {
            const headers = getAuthHeaders();
            const res = await fetch(
                `${BASE_URL}/shop/${encodeURIComponent(shopId)}/team/${encodeURIComponent(memberId)}`,
                { method: 'DELETE', headers }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to remove team member');
            }
            return res.json();
        },
        updateMemberServices: async (shopId, memberId, configs) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(
                `${BASE_URL}/shop/${encodeURIComponent(shopId)}/team/${encodeURIComponent(memberId)}/services`,
                { method: 'PUT', headers, body: JSON.stringify({ configs }) }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to save service settings');
            }
            return res.json();
        },
        getClients: async (shopId, limit = 100) => {
            const headers = getAuthHeaders();
            const res = await fetch(
                `${BASE_URL}/shop/${encodeURIComponent(shopId)}/clients?limit=${limit}`,
                { headers }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load clients');
            }
            return res.json();
        },
        getSchedule: async (shopId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/shop/${encodeURIComponent(shopId)}/schedule`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load schedule');
            }
            return res.json();
        },
    },
    loyalty: {
        getProgram: async () => {
            const res = await fetch(`${BASE_URL}/loyalty/program`);
            if (!res.ok) throw new Error('Failed to load loyalty program');
            return res.json();
        },
        getMe: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/loyalty/me`, { headers });
            if (!res.ok) throw new Error('Failed to load loyalty profile');
            return res.json();
        },
        getMyCodes: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/loyalty/my-codes`, { headers });
            if (!res.ok) throw new Error('Failed to load reward codes');
            return res.json();
        },
        previewEarn: async (amount, tier = 'Bronze') => {
            const q = new URLSearchParams({ amount: String(amount), tier });
            const res = await fetch(`${BASE_URL}/loyalty/preview?${q}`);
            if (!res.ok) throw new Error('Failed to preview points');
            return res.json();
        },
        redeem: async (rewardId) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/loyalty/redeem`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ reward_id: rewardId }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to redeem reward');
            }
            return res.json();
        },
    },
    referral: {
        getPrograms: async (role = 'client') => {
            const q = new URLSearchParams({ role });
            const res = await fetch(`${BASE_URL}/referral/programs?${q}`);
            if (!res.ok) throw new Error('Failed to load referral programs');
            return res.json();
        },
        validateCode: async (code) => {
            const res = await fetch(`${BASE_URL}/referral/validate/${encodeURIComponent(code)}`);
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Invalid referral code');
            return data;
        },
        getMe: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/referral/me`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load referral dashboard');
            }
            return res.json();
        },
        claim: async (code) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/referral/claim`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ code }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to apply referral code');
            }
            return res.json();
        },
        getSummary: async () => {
            const res = await fetch(`${BASE_URL}/referral/summary`);
            if (!res.ok) throw new Error('Failed to load referral summary');
            return res.json();
        },
    },
    seo: {
        listCities: async () => {
            const res = await fetch(`${BASE_URL}/public/cities`);
            if (!res.ok) throw new Error('Failed to load cities');
            return res.json();
        },
        getCity: async (slug) => {
            const res = await fetch(`${BASE_URL}/public/cities/${encodeURIComponent(slug)}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'City not found');
            }
            return res.json();
        },
    },
        reminders: {
        getPreferences: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/reminders/preferences`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load reminder preferences');
            }
            return res.json();
        },
        getStatus: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/reminders/status`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load reminder status');
            }
            return res.json();
        },
        updatePreferences: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/reminders/preferences`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update reminder preferences');
            }
            return res.json();
        },
        sendTestSms: async () => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/reminders/test-sms`, {
                method: 'POST',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to send test SMS');
            }
            return res.json();
        },
        getHabit: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/reminders/habit`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load booking habit');
            }
            return res.json();
        },
    },
    messages: {
        getThreads: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/messages/threads`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load conversations');
            }
            return res.json();
        },
        getThread: async (contactUserId, bookingId) => {
            const headers = getAuthHeaders();
            const q = new URLSearchParams({ contact_user_id: contactUserId });
            if (bookingId) q.set('booking_id', bookingId);
            const res = await fetch(`${BASE_URL}/messages/thread?${q}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load messages');
            }
            return res.json();
        },
        send: async ({ receiver_id, content, booking_id, message_type, metadata }) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/messages/send`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ receiver_id, content, booking_id, message_type, metadata }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to send message');
            }
            return res.json();
        },
        resolveContact: async (params) => {
            const headers = getAuthHeaders();
            const q = new URLSearchParams(
                Object.fromEntries(Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)]))
            );
            const res = await fetch(`${BASE_URL}/messages/resolve-contact?${q}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Contact not found');
            }
            return res.json();
        },
        getBookingContext: async (bookingId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/messages/booking/${encodeURIComponent(bookingId)}/context`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load booking');
            }
            return res.json();
        },
        proposeReschedule: async (booking_id, proposed_start_time, note) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/messages/reschedule/propose`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ booking_id, proposed_start_time, note }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to propose new time');
            }
            return res.json();
        },
        respondReschedule: async (messageId, accept) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/messages/reschedule/${encodeURIComponent(messageId)}/respond`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ accept }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to respond');
            }
            return res.json();
        },
        streamUrl: () => {
            const token = localStorage.getItem('clerk_token') || localStorage.getItem('sovereign_token');
            const base = rawApiUrl ? `${rawApiUrl}/api` : '/api';
            return token ? `${base}/messages/stream?token=${encodeURIComponent(token)}` : null;
        },
    },
    tips: {
        getBookingStatus: async (bookingId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/tips/booking/${encodeURIComponent(bookingId)}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load tip status');
            }
            return res.json();
        },
        createCheckout: async ({ booking_id, amount, percent, message, return_path }) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/tips/create-checkout`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ booking_id, amount, percent, message, return_path }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to create tip checkout');
            }
            return res.json();
        },
        getProviderSummary: async (params = {}) => {
            const headers = getAuthHeaders();
            const q = new URLSearchParams(
                Object.fromEntries(
                    Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
                )
            );
            const res = await fetch(`${BASE_URL}/tips/provider/summary?${q}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load tips summary');
            }
            return res.json();
        },
    },
    shipping: {
        listAddresses: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/shipping/addresses`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load addresses');
            }
            return res.json();
        },
        createAddress: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/shipping/addresses`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to save address');
            }
            return res.json();
        },
        updateAddress: async (id, payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/shipping/addresses/${encodeURIComponent(id)}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update address');
            }
            return res.json();
        },
        deleteAddress: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/shipping/addresses/${encodeURIComponent(id)}`, {
                method: 'DELETE',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to delete address');
            }
            return res.json();
        },
        setDefaultAddress: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/shipping/addresses/${encodeURIComponent(id)}/default`, {
                method: 'POST',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to set default address');
            }
            return res.json();
        },
        getSellerProfile: async ({ barber_id, shop_id } = {}) => {
            const headers = getAuthHeaders();
            const q = new URLSearchParams(
                Object.fromEntries(
                    Object.entries({ barber_id, shop_id }).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
                )
            );
            const res = await fetch(`${BASE_URL}/shipping/seller-profile?${q}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load seller shipping profile');
            }
            return res.json();
        },
        upsertSellerProfile: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/shipping/seller-profile`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to save seller shipping profile');
            }
            return res.json();
        },
        listSellerOrders: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/shipping/seller/orders`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load seller orders');
            }
            return res.json();
        },
        updateFulfillment: async (fulfillmentId, data) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/shipping/fulfillments/${encodeURIComponent(fulfillmentId)}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update shipment');
            }
            return res.json();
        },
        updateOrderShipping: async (orderId, data) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/shipping/orders/${encodeURIComponent(orderId)}/shipping`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update order shipping');
            }
            return res.json();
        },
    },
    support: {
        getDesk: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/support/desk`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Support unavailable');
            }
            return res.json();
        },
        getUnread: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/support/unread`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load support unread count');
            }
            return res.json();
        },
        listTickets: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/support/tickets`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load support tickets');
            }
            return res.json();
        },
        createTicket: async ({ subject, category, content, order_id, booking_id }) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/support/tickets`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ subject, category, content, order_id, booking_id }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to create support ticket');
            }
            return res.json();
        },
        getTicketMessages: async (ticketId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/support/tickets/${encodeURIComponent(ticketId)}/messages`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load support messages');
            }
            return res.json();
        },
        sendMessage: async (ticketId, content) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/support/tickets/${encodeURIComponent(ticketId)}/messages`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ content }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to send message');
            }
            return res.json();
        },
        updateTicket: async (ticketId, data) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/support/tickets/${encodeURIComponent(ticketId)}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update ticket');
            }
            return res.json();
        },
        adminListTickets: async ({ status, assigned_to } = {}) => {
            const headers = getAuthHeaders();
            const q = new URLSearchParams(
                Object.fromEntries(
                    Object.entries({ status, assigned_to }).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
                )
            );
            const res = await fetch(`${BASE_URL}/support/admin/tickets?${q}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load admin tickets');
            }
            return res.json();
        },
        adminStats: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/support/admin/stats`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load support stats');
            }
            return res.json();
        },
    },
    languages: {
        getOptions: async () => {
            const res = await fetch(`${BASE_URL}/languages/options`);
            if (!res.ok) throw new Error('Failed to load languages');
            return res.json();
        },
        getMyLanguages: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/provider/languages`, { headers });
            if (res.status === 401) return null;
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load languages');
            }
            return res.json();
        },
        updateBarberLanguages: async (languages) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider/barber/languages`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ languages }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update barber languages');
            }
            return res.json();
        },
        updateShopLanguages: async (shopId, languages) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider/shop/${encodeURIComponent(shopId)}/languages`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ languages }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update shop languages');
            }
            return res.json();
        },
        getBarberLanguages: async (barberId) => {
            const res = await fetch(`${BASE_URL}/barbers/${encodeURIComponent(barberId)}/languages`);
            if (!res.ok) throw new Error('Failed to load barber languages');
            return res.json();
        },
        getShopLanguages: async (shopId) => {
            const res = await fetch(`${BASE_URL}/shops/${encodeURIComponent(shopId)}/languages`);
            if (!res.ok) throw new Error('Failed to load shop languages');
            return res.json();
        },
    },
    languagePrograms: {
        getConfig: async () => {
            const res = await fetch(`${BASE_URL}/language-programs/config`);
            if (!res.ok) throw new Error('Failed to load language programs config');
            return res.json();
        },
        listProvider: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/language-programs/provider`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load language programs');
            }
            return res.json();
        },
        listMine: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/language-programs/provider/mine`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load your waitlist');
            }
            return res.json();
        },
        getProgram: async (programId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/language-programs/${encodeURIComponent(programId)}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Program not found');
            }
            return res.json();
        },
        joinWaitlist: async (programId, termsAccepted) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/language-programs/${encodeURIComponent(programId)}/join`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ terms_accepted: termsAccepted }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to join waitlist');
            }
            return res.json();
        },
        cancelWaitlist: async (programId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/language-programs/${encodeURIComponent(programId)}/cancel`, {
                method: 'POST',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to cancel waitlist');
            }
            return res.json();
        },
        adminList: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/language-programs/admin/list`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load admin programs');
            }
            return res.json();
        },
        adminCreate: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/language-programs/admin`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to create program');
            }
            return res.json();
        },
        adminUpdate: async (programId, payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/language-programs/admin/${encodeURIComponent(programId)}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update program');
            }
            return res.json();
        },
        adminWaitlist: async (programId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/language-programs/admin/${encodeURIComponent(programId)}/waitlist`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load waitlist');
            }
            return res.json();
        },
        adminEnroll: async (waitlistId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/language-programs/admin/waitlist/${encodeURIComponent(waitlistId)}/enroll`, {
                method: 'PATCH',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to enroll barber');
            }
            return res.json();
        },
    },
    childrenFriendly: {
        getConfig: async () => {
            const res = await fetch(`${BASE_URL}/children-friendly/config`);
            if (!res.ok) throw new Error('Failed to load children-friendly config');
            return res.json();
        },
        getMySettings: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/provider/children-friendly`, { headers });
            if (res.status === 401) return null;
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load settings');
            }
            return res.json();
        },
        updateBarber: async (children_friendly) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider/barber/children-friendly`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ children_friendly }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update barber setting');
            }
            return res.json();
        },
        updateShop: async (shopId, children_friendly) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider/shop/${encodeURIComponent(shopId)}/children-friendly`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ children_friendly }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update shop setting');
            }
            return res.json();
        },
        getBarberEffective: async (barberId) => {
            const res = await fetch(`${BASE_URL}/barbers/${encodeURIComponent(barberId)}/children-friendly`);
            if (!res.ok) throw new Error('Failed to load barber children-friendly info');
            return res.json();
        },
        getShop: async (shopId) => {
            const res = await fetch(`${BASE_URL}/shops/${encodeURIComponent(shopId)}/children-friendly`);
            if (!res.ok) throw new Error('Failed to load shop children-friendly info');
            return res.json();
        },
    },
    providerAttestation: {
        getConfig: async () => {
            const res = await fetch(`${BASE_URL}/provider-attestation/config`);
            if (!res.ok) throw new Error('Failed to load attestation config');
            return res.json();
        },
        getMySettings: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/provider/attestation`, { headers });
            if (res.status === 401) return null;
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load attestation settings');
            }
            return res.json();
        },
        updateBarber: async ({ licensed, insured }) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider/barber/attestation`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ licensed, insured }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update barber attestation');
            }
            return res.json();
        },
        updateShop: async (shopId, { licensed, insured }) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider/shop/${encodeURIComponent(shopId)}/attestation`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ licensed, insured }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update shop attestation');
            }
            return res.json();
        },
        getBarberEffective: async (barberId) => {
            const res = await fetch(`${BASE_URL}/barbers/${encodeURIComponent(barberId)}/attestation`);
            if (!res.ok) throw new Error('Failed to load barber attestation info');
            return res.json();
        },
        getShop: async (shopId) => {
            const res = await fetch(`${BASE_URL}/shops/${encodeURIComponent(shopId)}/attestation`);
            if (!res.ok) throw new Error('Failed to load shop attestation info');
            return res.json();
        },
    },
    serviceLocation: {
        getConfig: async () => {
            const res = await fetch(`${BASE_URL}/service-location/config`);
            if (!res.ok) throw new Error('Failed to load service location config');
            return res.json();
        },
        getMySettings: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/provider/service-locations`, { headers });
            if (res.status === 401) return null;
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load service location settings');
            }
            return res.json();
        },
        updateBarber: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider/barber/service-locations`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update service location settings');
            }
            return res.json();
        },
        getBarber: async (barberId) => {
            const res = await fetch(`${BASE_URL}/barbers/${encodeURIComponent(barberId)}/service-locations`);
            if (!res.ok) throw new Error('Failed to load barber service locations');
            return res.json();
        },
        getShop: async (shopId) => {
            const res = await fetch(`${BASE_URL}/shops/${encodeURIComponent(shopId)}/service-locations`);
            if (!res.ok) throw new Error('Failed to load shop service locations');
            return res.json();
        },
        updateShop: async (shopId, payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider/shop/${encodeURIComponent(shopId)}/service-locations`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update shop service location settings');
            }
            return res.json();
        },
    },
    geocoding: {
        getConfig: async () => {
            const res = await fetch(`${BASE_URL}/geocoding/config`);
            if (!res.ok) throw new Error('Failed to load geocoding config');
            return res.json();
        },
    },
    atHomeService: {
        getConfig: async () => {
            const res = await fetch(`${BASE_URL}/at-home-service/config`);
            if (!res.ok) throw new Error('Failed to load at-home service config');
            return res.json();
        },
        getMySettings: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/provider/at-home-service`, { headers });
            if (res.status === 401) return null;
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load at-home settings');
            }
            return res.json();
        },
        updateBarber: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider/barber/at-home-service`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to save at-home settings');
            }
            return res.json();
        },
        updateShop: async (shopId, payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider/shop/${encodeURIComponent(shopId)}/at-home-service`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to save shop at-home settings');
            }
            return res.json();
        },
        geocode: async (address) => {
            const res = await fetch(`${BASE_URL}/at-home-service/geocode`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Could not find that address');
            }
            return res.json();
        },
        suggest: async (query) => {
            const params = new URLSearchParams({ q: query });
            const res = await fetch(`${BASE_URL}/at-home-service/suggest?${params.toString()}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Address suggestions unavailable');
            }
            return res.json();
        },
        reverseGeocode: async (latitude, longitude) => {
            const res = await fetch(`${BASE_URL}/at-home-service/reverse-geocode`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude, longitude }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Could not resolve location');
            }
            return res.json();
        },
        quote: async (payload) => {
            const res = await fetch(`${BASE_URL}/at-home-service/quote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Travel quote failed');
            }
            return res.json();
        },
        getBarberArea: async (barberId, shopId, contextType) => {
            const qs = new URLSearchParams();
            if (shopId) qs.set('shop_id', shopId);
            if (contextType) qs.set('context_type', contextType);
            const suffix = qs.toString() ? `?${qs}` : '';
            const res = await fetch(`${BASE_URL}/barbers/${encodeURIComponent(barberId)}/at-home-service${suffix}`);
            if (!res.ok) throw new Error('Failed to load at-home coverage');
            return res.json();
        },
    },
    mobileService: {
        getConfig: async () => {
            const res = await fetch(`${BASE_URL}/mobile-service/config`);
            if (!res.ok) throw new Error('Failed to load mobile service config');
            return res.json();
        },
        getMySettings: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/provider/mobile-service`, { headers });
            if (res.status === 401) return null;
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load mobile service settings');
            }
            return res.json();
        },
        updateBarber: async (offers_mobile_service) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider/barber/mobile-service`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ offers_mobile_service }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update mobile service setting');
            }
            return res.json();
        },
        getBarber: async (barberId) => {
            const res = await fetch(`${BASE_URL}/barbers/${encodeURIComponent(barberId)}/mobile-service`);
            if (!res.ok) throw new Error('Failed to load barber mobile service info');
            return res.json();
        },
    },
    bookings: {
        getDetails: async (bookingId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/bookings/${encodeURIComponent(bookingId)}/details`, { headers });
            if (res.status === 404) return null;
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load booking details');
            }
            return res.json();
        },
        getRebookPayload: async (bookingId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/bookings/${encodeURIComponent(bookingId)}/rebook`, { headers });
            if (res.status === 404) return null;
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load rebook data');
            }
            return res.json();
        },
        getCheckInQr: async (bookingId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/bookings/${encodeURIComponent(bookingId)}/check-in/qr`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load check-in QR');
            }
            return res.json();
        },
        checkIn: async (bookingId, body = {}) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/bookings/${encodeURIComponent(bookingId)}/check-in`, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Check-in failed');
            }
            return res.json();
        },
        getBarberDaySlots: async (barberId, { date, duration, shop_id, context_type } = {}) => {
            const params = new URLSearchParams({ date: String(date) });
            if (duration) params.set('duration', String(duration));
            if (shop_id) params.set('shop_id', shop_id);
            if (context_type) params.set('context_type', context_type);
            const res = await fetch(
                `${BASE_URL}/barbers/${encodeURIComponent(barberId)}/day-slots?${params.toString()}`
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load time slots');
            }
            return res.json();
        },
        createGuest: async (payload) => {
            const headers = { 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/bookings/guest`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Guest booking failed');
            }
            return res.json();
        },
        getGuestByToken: async (token) => {
            const res = await fetch(`${BASE_URL}/bookings/guest/${encodeURIComponent(token)}`);
            if (res.status === 404) return null;
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load booking');
            }
            return res.json();
        },
        getGuestCancelPreview: async (token) => {
            const res = await fetch(`${BASE_URL}/bookings/guest/${encodeURIComponent(token)}/cancel-preview`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load cancellation preview');
            }
            return res.json();
        },
        cancelGuest: async (token) => {
            const res = await fetch(`${BASE_URL}/bookings/guest/${encodeURIComponent(token)}/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to cancel booking');
            }
            return res.json();
        },
        claimGuestBookings: async (tokens = []) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/bookings/guest/claim-pending`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ tokens }),
            });
            if (res.status === 401) return { linked_count: 0, booking_ids: [] };
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to link guest bookings');
            }
            return res.json();
        },
        claimGuestByToken: async (token) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/bookings/guest/${encodeURIComponent(token)}/claim`, {
                method: 'POST',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to link booking');
            }
            return res.json();
        },
    },
    capacity: {
        listChairs: async (shopId) => {
            const res = await fetch(`${BASE_URL}/shops/${encodeURIComponent(shopId)}/chairs`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load chairs');
            }
            return res.json();
        },
        saveChair: async (shopId, payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/shops/${encodeURIComponent(shopId)}/chairs`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to save chair');
            }
            return res.json();
        },
        assignBarber: async (chairId, payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/chairs/${encodeURIComponent(chairId)}/assignments`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to assign barber');
            }
            return res.json();
        },
        setBufferMinutes: async (barberId, minutes) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/barbers/${encodeURIComponent(barberId)}/capacity-settings`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ default_buffer_minutes: minutes }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update buffer');
            }
            return res.json();
        },
    },
    bookingWaitlist: {
        join: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/waitlist/join`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to join waitlist');
            }
            return res.json();
        },
        acceptOffer: async (offerId, bookingPayload = {}) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/waitlist/offers/${encodeURIComponent(offerId)}/accept`, {
                method: 'POST',
                headers,
                body: JSON.stringify(bookingPayload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to accept waitlist offer');
            }
            return res.json();
        },
        getMyOffers: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/waitlist/my-offers`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load waitlist offers');
            }
            return res.json();
        },
        getMyEntries: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/waitlist/my-entries`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load waitlist entries');
            }
            return res.json();
        },
        leave: async (entryId) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/waitlist/entries/${encodeURIComponent(entryId)}/leave`, {
                method: 'POST',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to leave waitlist');
            }
            return res.json();
        },
        getBarberQueue: async (barberId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/barbers/${encodeURIComponent(barberId)}/waitlist`, {
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load waitlist queue');
            }
            const data = await res.json();
            return data.entries ?? data;
        },
    },
    groupBooking: {
        getConfig: async () => {
            const res = await fetch(`${BASE_URL}/group-booking/config`);
            if (!res.ok) throw new Error('Failed to load group booking config');
            return res.json();
        },
        getVipGroupBarbers: async () => {
            const res = await fetch(`${BASE_URL}/public/vip-group-barbers`);
            if (!res.ok) throw new Error('Failed to load group barbers');
            return res.json();
        },
        getGroupBookingBarbers: async () => {
            const res = await fetch(`${BASE_URL}/public/group-booking-barbers`);
            if (!res.ok) throw new Error('Failed to load group barbers');
            return res.json();
        },
        getMySettings: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/provider/group-booking`, { headers });
            if (res.status === 401) return null;
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load group booking settings');
            }
            return res.json();
        },
        updateBarber: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider/barber/group-booking`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update group booking settings');
            }
            return res.json();
        },
        getBarber: async (barberId) => {
            const res = await fetch(`${BASE_URL}/barbers/${encodeURIComponent(barberId)}/group-booking`);
            if (!res.ok) throw new Error('Failed to load barber group booking info');
            return res.json();
        },
        quote: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/group-booking/quote`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to calculate group quote');
            }
            return res.json();
        },
        adminListBarbers: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/vip-barbers`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load VIP barbers');
            }
            return res.json();
        },
        adminSetVip: async (barberId, is_vip) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/admin/barbers/${encodeURIComponent(barberId)}/vip`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ is_vip }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update VIP status');
            }
            return res.json();
        },
    },
    promotions: {
        getAdminConfig: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/promotions/admin/config`, { headers });
            if (!res.ok) throw new Error('Failed to load promo admin config');
            return res.json();
        },
        adminList: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/promotions/admin/list`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load promotions');
            }
            return res.json();
        },
        adminCreate: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/promotions/admin`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to create promotion');
            }
            return res.json();
        },
        adminUpdate: async (id, payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/promotions/admin/${encodeURIComponent(id)}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update promotion');
            }
            return res.json();
        },
        adminDeactivate: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/promotions/admin/${encodeURIComponent(id)}/deactivate`, {
                method: 'POST',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to deactivate promotion');
            }
            return res.json();
        },
    },
    fixedFee: {
        getConfig: async () => {
            const res = await fetch(`${BASE_URL}/fixed-fee/config`);
            if (!res.ok) throw new Error('Failed to load fixed-fee config');
            return res.json();
        },
        getMe: async (shopId) => {
            const headers = getAuthHeaders();
            const q = shopId ? `?shop_id=${encodeURIComponent(shopId)}` : '';
            const res = await fetch(`${BASE_URL}/fixed-fee/me${q}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load fixed-fee status');
            }
            return res.json();
        },
        getQuote: async (scope, billingCycle) => {
            const params = new URLSearchParams({ scope, billing_cycle: billingCycle });
            const res = await fetch(`${BASE_URL}/fixed-fee/quote?${params}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load quote');
            }
            return res.json();
        },
        subscribe: async ({ scope, billing_cycle, shop_id }) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/fixed-fee/subscribe`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ scope, billing_cycle, shop_id }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to start subscription');
            }
            return res.json();
        },
        renewMonthly: async (scope) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/fixed-fee/renew-monthly`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ scope }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to renew plan');
            }
            return res.json();
        },
        adminListPlans: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/fixed-fee/admin/plans`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load fixed-fee plans');
            }
            return res.json();
        },
        adminCancelPlan: async (planId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/fixed-fee/admin/plans/${encodeURIComponent(planId)}/cancel`, {
                method: 'POST',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to cancel plan');
            }
            return res.json();
        },
        adminRunMaintenance: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/fixed-fee/admin/maintenance`, { method: 'POST', headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Maintenance failed');
            }
            return res.json();
        },
    },
    providerWallet: {
        getCashAvailability: async (barberId, shopId) => {
            const params = new URLSearchParams({ barber_id: barberId });
            if (shopId) params.set('shop_id', shopId);
            const res = await fetch(`${BASE_URL}/provider-wallet/cash-availability?${params}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to check cash availability');
            }
            return res.json();
        },
        getMe: async (shopId) => {
            const headers = getAuthHeaders();
            const q = shopId ? `?shop_id=${encodeURIComponent(shopId)}` : '';
            const res = await fetch(`${BASE_URL}/provider-wallet/me${q}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load provider wallet');
            }
            return res.json();
        },
        updateSettings: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider-wallet/settings`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update settings');
            }
            return res.json();
        },
        topUp: async (amount, scope = 'barber', shopId) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider-wallet/top-up`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ amount, scope, shop_id: shopId }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Top-up failed');
            }
            return res.json();
        },
        grantPromotionalCredit: async (walletId, amount, reason) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(
                `${BASE_URL}/admin/provider-wallets/${encodeURIComponent(walletId)}/promotional-credit`,
                {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ amount, reason }),
                }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to grant promotional credit');
            }
            return res.json();
        },
        searchWallets: async (query) => {
            const headers = getAuthHeaders();
            const res = await fetch(
                `${BASE_URL}/admin/provider-wallets/search?q=${encodeURIComponent(query)}`,
                { headers }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Wallet search failed');
            }
            return res.json();
        },
        confirmBooking: async (bookingId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/provider-wallet/bookings/${encodeURIComponent(bookingId)}/confirm`, {
                method: 'POST',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to confirm booking');
            }
            return res.json();
        },
        cancelBooking: async (bookingId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/provider-wallet/bookings/${encodeURIComponent(bookingId)}/cancel`, {
                method: 'POST',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to cancel booking');
            }
            return res.json();
        },
    },
    paymentProtection: {
        getPreview: async ({ barberId, shopId, totalPrice, paymentMethod }) => {
            const params = new URLSearchParams({
                barber_id: barberId,
                total_price: String(totalPrice),
            });
            if (shopId) params.set('shop_id', shopId);
            if (paymentMethod) params.set('payment_method', paymentMethod);
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/payment-protection/preview?${params}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load payment preview');
            }
            return res.json();
        },
        getSettings: async (shopId) => {
            const headers = getAuthHeaders();
            const q = shopId ? `?shop_id=${encodeURIComponent(shopId)}` : '';
            const res = await fetch(`${BASE_URL}/payment-protection/settings${q}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load settings');
            }
            return res.json();
        },
        updateSettings: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/payment-protection/settings`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to save settings');
            }
            return res.json();
        },
        listPaymentMethods: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/payment-methods`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load cards');
            }
            return res.json();
        },
        startSaveCardCheckout: async () => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/payment-methods/setup-checkout`, {
                method: 'POST',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to start card setup');
            }
            return res.json();
        },
        removePaymentMethod: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/payment-methods/${encodeURIComponent(id)}`, {
                method: 'DELETE',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to remove card');
            }
            return res.json();
        },
        bookingCheckout: async (bookingId) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/payment-protection/booking-checkout`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ bookingId }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Payment checkout failed');
            }
            return res.json();
        },
        markNoShow: async (bookingId) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(
                `${BASE_URL}/payment-protection/bookings/${encodeURIComponent(bookingId)}/no-show`,
                { method: 'POST', headers }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to mark no-show');
            }
            return res.json();
        },
        retryNoShowFee: async (bookingId) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(
                `${BASE_URL}/payment-protection/bookings/${encodeURIComponent(bookingId)}/retry-no-show-fee`,
                { method: 'POST', headers }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Retry failed');
            }
            return res.json();
        },
        captureAuthorization: async (bookingId) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(
                `${BASE_URL}/payment-protection/bookings/${encodeURIComponent(bookingId)}/capture`,
                { method: 'POST', headers }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Capture failed');
            }
            return res.json();
        },
        releaseAuthorization: async (bookingId) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(
                `${BASE_URL}/payment-protection/bookings/${encodeURIComponent(bookingId)}/release-auth`,
                { method: 'POST', headers }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Release failed');
            }
            return res.json();
        },
        getBookingPaymentStatus: async (bookingId) => {
            const headers = getAuthHeaders();
            const res = await fetch(
                `${BASE_URL}/payment-protection/bookings/${encodeURIComponent(bookingId)}/payment-status`,
                { headers }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load payment status');
            }
            return res.json();
        },
        cancelBooking: async (bookingId) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(
                `${BASE_URL}/payment-protection/bookings/${encodeURIComponent(bookingId)}/cancel`,
                { method: 'POST', headers }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Cancel failed');
            }
            return res.json();
        },
        getCancelPreview: async (bookingId) => {
            const headers = getAuthHeaders();
            const res = await fetch(
                `${BASE_URL}/payment-protection/bookings/${encodeURIComponent(bookingId)}/cancel-preview`,
                { headers }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load cancellation preview');
            }
            return res.json();
        },
    },
    events: {
        getConfig: async () => {
            const res = await fetch(`${BASE_URL}/events/config`);
            if (!res.ok) throw new Error('Failed to load events config');
            return res.json();
        },
        listProvider: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/events/provider`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load events');
            }
            return res.json();
        },
        listMine: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/events/provider/mine`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load registrations');
            }
            return res.json();
        },
        getEvent: async (eventId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/events/${encodeURIComponent(eventId)}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Event not found');
            }
            return res.json();
        },
        register: async (eventId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/events/${encodeURIComponent(eventId)}/register`, {
                method: 'POST',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Registration failed');
            }
            return res.json();
        },
        cancelRegistration: async (eventId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/events/${encodeURIComponent(eventId)}/cancel`, {
                method: 'POST',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Cancel failed');
            }
            return res.json();
        },
        adminList: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/events/admin/list`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load admin events');
            }
            return res.json();
        },
        adminCreate: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/events/admin`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to create event');
            }
            return res.json();
        },
        adminUpdate: async (eventId, payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/events/admin/${encodeURIComponent(eventId)}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update event');
            }
            return res.json();
        },
        adminRegistrations: async (eventId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/events/admin/${encodeURIComponent(eventId)}/registrations`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load registrations');
            }
            return res.json();
        },
        adminMarkAttended: async (registrationId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/events/admin/registrations/${encodeURIComponent(registrationId)}/attended`, {
                method: 'PATCH',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to mark attended');
            }
            return res.json();
        },
    },
    tombola: {
        getCurrent: async () => {
            const res = await fetch(`${BASE_URL}/tombola/current`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load tombola');
            }
            return res.json();
        },
        getMe: async (role) => {
            const headers = getAuthHeaders();
            const q = role ? `?role=${encodeURIComponent(role)}` : '';
            const res = await fetch(`${BASE_URL}/tombola/me${q}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load your tombola status');
            }
            return res.json();
        },
        syncEntry: async (role) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/tombola/sync`, {
                method: 'POST',
                headers,
                body: JSON.stringify(role ? { role } : {}),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to sync entry');
            }
            return res.json();
        },
        claimFreeEntry: async () => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/tombola/free-entry`, {
                method: 'POST',
                headers,
                body: JSON.stringify({}),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to claim free entry');
            }
            return res.json();
        },
        claimPrize: async (drawId, answer) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/tombola/claim-prize`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ draw_id: drawId, answer }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to claim prize');
            }
            return res.json();
        },
        liveStreamUrl: () => {
            const base = rawApiUrl ? `${rawApiUrl}/api` : '/api';
            return `${base}/tombola/live/stream`;
        },
        adminListDraws: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/tombola/admin/draws`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load draws');
            }
            return res.json();
        },
        adminSyncDraw: async (drawId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/tombola/admin/draws/${encodeURIComponent(drawId)}/sync`, {
                method: 'POST',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to sync draw');
            }
            return res.json();
        },
        adminRunDraw: async (drawId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/tombola/admin/draws/${encodeURIComponent(drawId)}/run`, {
                method: 'POST',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to run draw');
            }
            return res.json();
        },
    },
    reviews: {
        listPublic: async (targetType, targetId, params = {}) => {
            const q = new URLSearchParams({
                target_type: targetType,
                target_id: targetId,
                ...Object.fromEntries(
                    Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
                ),
            });
            const res = await fetch(`${BASE_URL}/reviews/public?${q}`);
            if (!res.ok) throw new Error('Failed to load reviews');
            const data = await res.json();
            return data.reviews ?? [];
        },
        listProvider: async (params = {}) => {
            const headers = getAuthHeaders();
            const q = new URLSearchParams(
                Object.fromEntries(
                    Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
                )
            );
            const res = await fetch(`${BASE_URL}/reviews/provider?${q}`, { headers });
            if (!res.ok) throw new Error('Failed to load provider reviews');
            const data = await res.json();
            return data.reviews ?? [];
        },
        getBookingStatus: async (bookingId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/reviews/status/${encodeURIComponent(bookingId)}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load review status');
            }
            return res.json();
        },
        getRequestByToken: async (token) => {
            const res = await fetch(`${BASE_URL}/reviews/request/${encodeURIComponent(token)}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Review link not found');
            }
            return res.json();
        },
        listPending: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/reviews/pending`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load pending reviews');
            }
            return res.json();
        },
        submitGuest: async ({ token, target_type = 'barber', rating, content }) => {
            const res = await fetch(`${BASE_URL}/reviews/guest`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, target_type, rating, content }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to submit review');
            }
            return res.json();
        },
        submit: async ({ booking_id, target_type = 'barber', rating, content }) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/reviews`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ booking_id, target_type, rating, content }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to submit review');
            }
            return res.json();
        },
    },
    providerStats: {
        getBarberPublic: async (barberId) => {
            const res = await fetch(`${BASE_URL}/barbers/${encodeURIComponent(barberId)}/stats`);
            if (!res.ok) throw new Error('Failed to load barber stats');
            return res.json();
        },
        getShopPublic: async (shopId) => {
            const res = await fetch(`${BASE_URL}/shops/${encodeURIComponent(shopId)}/stats`);
            if (!res.ok) throw new Error('Failed to load shop stats');
            return res.json();
        },
        getBarberPublicBatch: async (barberIds) => {
            const res = await fetch(`${BASE_URL}/barbers/stats/batch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ barber_ids: barberIds }),
            });
            if (!res.ok) throw new Error('Failed to load barber stats batch');
            const data = await res.json();
            return data.stats ?? {};
        },
        getMyStats: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/provider/my-stats`, { headers });
            if (res.status === 404) return null;
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load provider stats');
            }
            return res.json();
        },
        getBenchmarks: async (params = {}) => {
            const headers = getAuthHeaders();
            const q = new URLSearchParams(
                Object.fromEntries(
                    Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
                )
            );
            const res = await fetch(`${BASE_URL}/provider/benchmarks?${q}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load benchmarks');
            }
            return res.json();
        },
        getAdminOverview: async (params = {}) => {
            const headers = getAuthHeaders();
            const q = new URLSearchParams(
                Object.fromEntries(
                    Object.entries(params).filter(([, v]) => v != null).map(([k, v]) => [k, String(v)])
                )
            );
            const res = await fetch(`${BASE_URL}/admin/providers/overview?${q}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load provider overview');
            }
            return res.json();
        },
        getAdminBarber: async (barberId) => {
            const headers = getAuthHeaders();
            const res = await fetch(
                `${BASE_URL}/admin/providers/barber/${encodeURIComponent(barberId)}/stats`,
                { headers }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load barber admin stats');
            }
            return res.json();
        },
        getAdminShop: async (shopId) => {
            const headers = getAuthHeaders();
            const res = await fetch(
                `${BASE_URL}/admin/providers/shop/${encodeURIComponent(shopId)}/stats`,
                { headers }
            );
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load shop admin stats');
            }
            return res.json();
        },
        resolveDispute: async (disputeId, payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/admin/disputes/${encodeURIComponent(disputeId)}/resolve`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to resolve dispute');
            }
            return res.json();
        },
        listAdminDisputes: async (limit = 100) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/disputes?limit=${limit}`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load disputes');
            }
            return res.json();
        },
        getAdminDispute: async (disputeId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/disputes/${encodeURIComponent(disputeId)}`, { headers });
            if (res.status === 404) return null;
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load dispute');
            }
            return res.json();
        },
    },
    showcase: {
        getConfig: async () => {
            const res = await fetch(`${BASE_URL}/showcase/config`);
            if (!res.ok) throw new Error('Failed to load showcase config');
            return res.json();
        },
        getBarberPublic: async (barberId) => {
            const res = await fetch(`${BASE_URL}/barbers/${encodeURIComponent(barberId)}/showcase`);
            if (res.status === 404) return null;
            if (!res.ok) throw new Error('Failed to load barber showcase');
            return res.json();
        },
        getShopPublic: async (shopId) => {
            const res = await fetch(`${BASE_URL}/shops/${encodeURIComponent(shopId)}/showcase`);
            if (res.status === 404) return null;
            if (!res.ok) throw new Error('Failed to load shop showcase');
            return res.json();
        },
        getMy: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/provider/showcase`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load your showcase');
            }
            return res.json();
        },
        updateBarber: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider/showcase/barber`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update barber showcase');
            }
            return res.json();
        },
        updateShop: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider/showcase/shop`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update shop showcase');
            }
            return res.json();
        },
        createCareerEntry: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider/career-entries`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to create career entry');
            }
            return res.json();
        },
        deleteCareerEntry: async (entryId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/provider/career-entries/${encodeURIComponent(entryId)}`, {
                method: 'DELETE',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to delete career entry');
            }
            return res.json();
        },
        updateCareerEntry: async (entryId, payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider/career-entries/${encodeURIComponent(entryId)}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update career entry');
            }
            return res.json();
        },
        createPortfolioItem: async (payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider/portfolio`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to add portfolio item');
            }
            return res.json();
        },
        updatePortfolioItem: async (videoId, payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/provider/portfolio/${encodeURIComponent(videoId)}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update portfolio item');
            }
            return res.json();
        },
        deletePortfolioItem: async (videoId) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/provider/portfolio/${encodeURIComponent(videoId)}`, {
                method: 'DELETE',
                headers,
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to delete portfolio item');
            }
            return res.json();
        },
        getCompleteness: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/provider/showcase/completeness`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load showcase completeness');
            }
            return res.json();
        },
        getDiscoveryPreviews: async (barberIds) => {
            const ids = (barberIds ?? []).filter(Boolean);
            if (!ids.length) return {};
            const q = encodeURIComponent(ids.join(','));
            const res = await fetch(`${BASE_URL}/showcase/discovery-previews?barber_ids=${q}`);
            if (!res.ok) throw new Error('Failed to load discovery previews');
            return res.json();
        },
    },
    products: {
        listPublic: async (params = {}) => {
            const q = new URLSearchParams(params).toString();
            const res = await fetch(`${BASE_URL}/products/public${q ? `?${  q}` : ''}`);
            if (!res.ok) throw new Error('Failed to fetch marketplace products');
            return res.json();
        },
        getPublic: async (id) => {
            const res = await fetch(`${BASE_URL}/products/public/${encodeURIComponent(id)}`);
            if (res.status === 404) return null;
            if (!res.ok) throw new Error('Failed to fetch product');
            return res.json();
        },
        sellerProfiles: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/products/seller-profiles`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load seller profiles');
            }
            return res.json();
        },
        mine: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/products/mine`, { headers });
            if (res.status === 401 || res.status === 403) return [];
            if (!res.ok) throw new Error('Failed to fetch your products');
            return res.json();
        },
        get: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/products/${encodeURIComponent(id)}`, { headers });
            if (res.status === 404) return null;
            if (!res.ok) throw new Error('Failed to fetch product');
            return res.json();
        },
        create: async (data) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/products`, { method: 'POST', headers, body: JSON.stringify(data) });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to create product');
            }
            return res.json();
        },
        update: async (id, data) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/products/${encodeURIComponent(id)}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update product');
            }
            return res.json();
        },
        submit: async (id, options = {}) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/products/${encodeURIComponent(id)}/submit`, {
                method: 'POST',
                headers,
                body: JSON.stringify(options),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to submit product');
            }
            return res.json();
        },
        delete: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/products/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to delete product');
            }
            return res.json();
        },
        listAdmin: async (status = 'pending_review') => {
            const headers = getAuthHeaders();
            const q = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
            const res = await fetch(`${BASE_URL}/admin/products${q}`, { headers });
            if (res.status === 401 || res.status === 403) return [];
            if (!res.ok) throw new Error('Failed to fetch admin products');
            return res.json();
        },
        approve: async (id) => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/products/${encodeURIComponent(id)}/approve`, { method: 'POST', headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to approve product');
            }
            return res.json();
        },
        reject: async (id, reason) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/admin/products/${encodeURIComponent(id)}/reject`, {
                method: 'POST',
                headers,
                body: JSON.stringify(reason ? { reason } : {}),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to reject product');
            }
            return res.json();
        },
        unpublish: async (id, reason) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/admin/products/${encodeURIComponent(id)}/unpublish`, {
                method: 'POST',
                headers,
                body: JSON.stringify(reason ? { reason } : {}),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to unpublish product');
            }
            return res.json();
        },
    },
    appLogs: {
        logUserInApp: async (_pageName) => {
            // No-op shim for legacy in-app page logging
            return Promise.resolve();
        }
    },

    backup: {
        verify: async () => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const me = await sovereign.auth.me();
            const res = await fetch(`${BASE_URL}/admin/backup/verify`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ admin_user_id: me?.id }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Backup verification failed');
            }
            return res.json();
        },
    },

    featureFlags: {
        getPublic: async () => {
            const res = await fetch(`${BASE_URL}/feature-flags`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load feature flags');
            }
            return res.json();
        },
        adminList: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/admin/feature-flags`, { headers });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to load admin feature flags');
            }
            return res.json();
        },
        adminSet: async (key, enabled) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
            const res = await fetch(`${BASE_URL}/admin/feature-flags/${encodeURIComponent(key)}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ enabled }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to update feature flag');
            }
            return res.json();
        },
    },
};

export const User = {
    me: () => sovereign.auth.me()
};
