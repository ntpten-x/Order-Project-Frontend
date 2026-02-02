/**
 * Service Worker for Offline Support
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'pos-system-v1';
const RUNTIME_CACHE = 'pos-runtime-v1';

// Assets to cache on install
const PRECACHE_ASSETS = [
    '/',
    '/pos',
    '/offline',
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Precaching assets');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => {
                        return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
                    })
                    .map((cacheName) => {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        })
        .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    return cachedResponse;
                }

                // Otherwise fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response
                        const responseToCache = response.clone();

                        // Cache the response
                        caches.open(RUNTIME_CACHE)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // If network fails and it's a navigation request, return offline page
                        if (event.request.mode === 'navigate') {
                            return caches.match('/offline');
                        }
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'sync-orders') {
        event.waitUntil(syncOrders());
    }
});

async function syncOrders() {
    // This will be called when the app comes back online
    // The actual sync logic is handled by SyncManager component
    console.log('[SW] Syncing orders...');
}

// Push notifications (for future use)
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New notification',
        icon: '/icon-192x192.png',
        badge: '/icon-96x96.png',
        vibrate: [200, 100, 200],
    };

    event.waitUntil(
        self.registration.showNotification('POS System', options)
    );
});
