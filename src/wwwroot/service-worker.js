// Development service worker - always fetch from the network.
// Caches are cleaned on activation to prevent stale published SW caches from
// interfering with development (e.g., SRI hash mismatches after rebuilds).

const CACHE_PREFIX = 'vvg-cache-';

self.addEventListener('install', () => {
    // Immediately clean up old caches and take control
    self.skipWaiting();
    // Clean old caches immediately (not just on activate)
    self.addEventListener('activate', (event) => {
        event.waitUntil((async () => {
            const cacheKeys = await caches.keys();
            await Promise.all(
                cacheKeys
                    .filter(key => key.startsWith(CACHE_PREFIX) || key.startsWith('offline-cache-'))
                    .map(key => caches.delete(key))
            );
            // Take control of all open tabs immediately
            await clients.claim();
        })());
    });
});

// In development, always fetch from the network and do not enable offline support.
// This is because caching would make development more difficult (changes would not
// be reflected on the first load after each change).
self.addEventListener('fetch', () => { });
