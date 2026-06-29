const SW_VERSION = '5';
const SW_URL = `/sw.js?v=${SW_VERSION}`;

async function clearPwaCaches() {
  if (typeof caches === 'undefined') return;
  const keys = await caches.keys();
  await Promise.all(keys.map((k) => caches.delete(k)));
}

async function unregisterAllServiceWorkers() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(regs.map((reg) => reg.unregister()));
}

function listenForServiceWorkerUpdates(registration) {
  registration.addEventListener('updatefound', () => {
    const worker = registration.installing;
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        worker.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  });

  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });

  window.setInterval(() => {
    void registration.update();
  }, 60 * 60 * 1000);
}

/**
 * In dev: strip SW + Cache Storage so Chrome never serves a stale shell.
 * In prod: register SW with versioned URL and auto-reload on updates.
 */
export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  if (import.meta.env.DEV) {
    await unregisterAllServiceWorkers();
    await clearPwaCaches();
    return;
  }

  await navigator.serviceWorker.register(SW_URL).then((registration) => {
    listenForServiceWorkerUpdates(registration);
    void registration.update();
  }).catch((err) => {
    console.warn('[pwa] Service worker registration failed', err);
  });
}

export {
  isStandalonePwa,
  canInstallPwa,
  promptPwaInstall,
  subscribePwaInstall,
} from './pwaInstall';
