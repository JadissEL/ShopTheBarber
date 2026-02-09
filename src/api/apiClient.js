/**
 * SOVEREIGN API CLIENT
 * 
 * This is a drop-in replacement for any legacy SDK in the ShopTheBarber project.
 * It redirects all entity and function calls to the new Fastify + SQLite backend.
 */

// In dev: relative /api so Vite proxy forwards to backend. In production: set VITE_API_URL (e.g. https://your-api.onrender.com)
const BASE_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
  : '/api';

class EntityClient {
    constructor(entityName) {
        this.entityName = entityName;

        // Convert CamelCase to snake_case (e.g., LoyaltyProfile -> loyalty_profile)
        const snakeCase = entityName.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, "");

        // Handle pluralization (e.g., entity -> entities, y -> ies)
        const plural = snakeCase.endsWith('y') && !snakeCase.endsWith('ey') ? snakeCase.slice(0, -1) + 'ies' : snakeCase + 's';
        this.resource = plural;
    }

    async list(order, limit, offset) {
        const headers = getAuthHeaders();
        const res = await fetch(`${BASE_URL}/${this.resource}`, { headers });
        if (!res.ok) throw new Error(`Failed to fetch ${this.entityName} (${this.resource})`);
        let data = await res.json();

        if (order) {
            const isDesc = order.startsWith('-');
            const field = isDesc ? order.substring(1) : order;
            data.sort((a, b) => {
                const aVal = a[field];
                const bVal = b[field];
                return isDesc ? (aVal > bVal ? -1 : 1) : (aVal > bVal ? 1 : -1);
            });
        }
        if (offset) data = data.slice(offset);
        if (limit) data = data.slice(0, limit);

        return data;
    }

    async filter(criteria, order, limit, offset) {
        const headers = getAuthHeaders();
        const res = await fetch(`${BASE_URL}/${this.resource}`, { headers });
        if (!res.ok) throw new Error(`Failed to fetch ${this.entityName}`);
        let data = await res.json();

        if (criteria) {
            data = data.filter(item => {
                return Object.entries(criteria).every(([key, value]) => {
                    if (typeof value === 'object' && value !== null) {
                        if (value.$nin) return !value.$nin.includes(item[key]);
                        if (value.$in) return value.$in.includes(item[key]);
                        if (value.$gt) return item[key] > value.$gt;
                        if (value.$lt) return item[key] < value.$lt;
                        if (value.$gte) return item[key] >= value.$gte;
                        if (value.$lte) return item[key] <= value.$lte;
                        if (value.$ne) return item[key] !== value.$ne;
                    }
                    return item[key] === value;
                });
            });
        }
        // Client-side sorting/limiting... same as list
        return data;
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
        const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
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
        const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
        const res = await fetch(`${BASE_URL}/${this.resource}/${id}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(`Failed to update ${this.entityName} ${id}`);
        return await res.json();
    }

    async delete(id) {
        const headers = getAuthHeaders();
        const res = await fetch(`${BASE_URL}/${this.resource}/${id}`, {
            method: 'DELETE',
            headers
        });
        if (!res.ok) throw new Error(`Failed to delete ${this.entityName} ${id}`);
        return await res.json();
    }

    subscribe(criteria, callback) { return () => { }; }
}

function getAuthHeaders() {
    const token = localStorage.getItem('sovereign_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
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
        me: async () => {
            const headers = getAuthHeaders();
            if (!headers.Authorization) return null;

            try {
                const res = await fetch(`${BASE_URL}/auth/me`, { headers });
                if (res.ok) {
                    return await res.json();
                } else if (res.status === 401) {
                    localStorage.removeItem('sovereign_token');
                    return null;
                }
            } catch (err) {
                console.warn('Auth check failed:', err);
                return null;
            }
        },
        login: async (email, password) => {
            const res = await fetch(`${BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                const text = await res.text();
                let err;
                try { err = JSON.parse(text); } catch { err = { error: text || `Server Error (${res.status})` }; }
                const msg = err.error || 'Login failed';
                throw new Error(err.hint ? `${msg} ${err.hint}` : msg);
            }

            const data = await res.json();
            if (data.token) {
                localStorage.setItem('sovereign_token', data.token);
            }
            return data;
        },
        signup: async (email, password, userData) => {
            const payload = {
                email,
                password,
                full_name: userData.full_name || 'New User',
                role: 'client',
                ...userData
            };

            const res = await fetch(`${BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const text = await res.text();
                let err;
                try { err = JSON.parse(text); } catch { err = { error: text || `Server Error (${res.status})` }; }
                const message = err.error || (err.details?.[0] ? `${err.details[0].path?.join('.') || 'field'}: ${err.details[0].message}` : null) || `Signup failed (${res.status})`;
                throw new Error(err.hint ? `${message} ${err.hint}` : message);
            }

            const data = await res.json();
            if (data.token) {
                localStorage.setItem('sovereign_token', data.token);
            }
            return data;
        },
        logout: async () => {
            localStorage.removeItem('sovereign_token');
            try {
                await fetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
            } catch (e) { }
            return { success: true };
        },
        redirectToLogin: (returnPath) => {
            const signInPath = '/SignIn';
            const query = returnPath ? `?return=${encodeURIComponent(returnPath)}` : '';
            window.location.href = signInPath + query;
        }
    },

    functions: {
        invoke: async (name, payload) => {
            const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
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
        list: async (params = {}) => {
            const q = new URLSearchParams(params).toString();
            const res = await fetch(`${BASE_URL}/jobs${q ? '?' + q : ''}`);
            if (!res.ok) throw new Error('Failed to fetch jobs');
            return res.json();
        },
        featured: async () => {
            const res = await fetch(`${BASE_URL}/jobs/featured`);
            if (!res.ok) throw new Error('Failed to fetch featured jobs');
            return res.json();
        },
        get: async (id) => {
            const res = await fetch(`${BASE_URL}/jobs/${encodeURIComponent(id)}`);
            if (res.status === 404) return null;
            if (!res.ok) throw new Error('Failed to fetch job');
            return res.json();
        },
        my: async () => {
            const headers = getAuthHeaders();
            const res = await fetch(`${BASE_URL}/jobs/my`, { headers });
            if (res.status === 401) return [];
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
        }
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
        }
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
    integrations: {
        googleCalendar: {
            getAuthorizeUrl: async () => {
                const headers = getAuthHeaders();
                const res = await fetch(`${BASE_URL}/integrations/google/authorize`, { headers });
                if (!res.ok) {
                    const d = await res.json().catch(() => ({}));
                    throw new Error(d.error || 'Failed to get Google Calendar link');
                }
                const data = await res.json();
                return data.url;
            },
            getStatus: async () => {
                const headers = getAuthHeaders();
                const res = await fetch(`${BASE_URL}/integrations/google/status`, { headers });
                if (!res.ok) return { connected: false, configured: false };
                return res.json();
            },
            disconnect: async () => {
                const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
                const res = await fetch(`${BASE_URL}/integrations/google/disconnect`, { method: 'POST', headers });
                if (!res.ok) throw new Error('Failed to disconnect');
                return res.json();
            }
        }
    },
    analytics: {
        track: (event) => {
            // console.log('[Analytics]', event);
        }
    },
    appLogs: {
        logUserInApp: async (pageName) => {
            // No-op shim for legacy in-app page logging
            return Promise.resolve();
        }
    }
};

export const User = {
    me: () => sovereign.auth.me()
};
