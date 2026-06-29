/* Lightweight consumer PWA — network-first for HTML/JS/CSS/API; cache images/fonts only.
   Bump CACHE_VERSION when shell or caching rules change. */
const CACHE_VERSION = 'stb-shell-v5';
const SW_SCRIPT_VERSION = '5';

const SHELL_ASSETS = [
    '/manifest.json',
    '/icons/icon-144x144.svg',
    '/icons/icon-512x512.svg',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL_ASSETS)).catch(() => undefined)
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
            .then(() => self.clients.matchAll({ type: 'window', includeUncontrolled: true }))
            .then((clients) => {
                clients.forEach((client) => {
                    try {
                        client.navigate(client.url);
                    } catch {
                        client.postMessage({ type: 'STB_SW_UPDATED' });
                    }
                });
            })
    );
});

function isApiRequest(url) {
    return url.pathname.startsWith('/api/');
}

function isNavigationRequest(request) {
    return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
}

/** Vite dev + built JS/CSS must always prefer network so UI updates are visible immediately. */
function isMutableAppAsset(url) {
    const p = url.pathname;
    return (
        p.endsWith('.js') ||
        p.endsWith('.css') ||
        p.endsWith('.jsx') ||
        p.endsWith('.tsx') ||
        p.startsWith('/src/') ||
        p.startsWith('/@') ||
        p.startsWith('/node_modules/') ||
        p === '/' ||
        p === '/index.html'
    );
}

function isImmutableAsset(url) {
    return url.pathname.startsWith('/assets/') && /\.[a-f0-9]{8,}\./i.test(url.pathname);
}

async function networkFirst(request) {
    try {
        return await fetch(request);
    } catch {
        if (isNavigationRequest(request)) {
            const cached = await caches.match('/index.html');
            if (cached) return cached;
        }
        return Response.error();
    }
}

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok && request.url.startsWith(self.location.origin)) {
            const cache = await caches.open(CACHE_VERSION);
            await cache.put(request, response.clone());
        }
        return response;
    } catch {
        return Response.error();
    }
}

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    if (isApiRequest(url) || isNavigationRequest(event.request) || isMutableAppAsset(url)) {
        event.respondWith(networkFirst(event.request));
        return;
    }

    if (isImmutableAsset(url)) {
        event.respondWith(cacheFirst(event.request));
        return;
    }

    event.respondWith(networkFirst(event.request));
});

self.addEventListener('message', (event) => {
    if (event.data?.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
