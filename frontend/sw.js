/* =====================================================================
 * RWANDA EXPORT EXPLORER - SERVICE WORKER
 * PWA capabilities for offline functionality and performance
 * ===================================================================== */

// Service Worker version
const CACHE_NAME = 'rwanda-export-explorer-v1';
const STATIC_CACHE = 'static-v1';

// Files to cache for offline functionality
const CACHE_FILES = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/dashboard.css',
    '/css/index.css',
    '/css/exports.css',
    '/css/imports.css',
    '/css/predictions.css',
    '/css/analytics.css',
    '/css/commodities.css',
    '/css/regional.css',
    '/js/main.js',
    '/js/charts.js',
    '/js/api.js',
    '/js/dashboard.js',
    '/js/exports.js',
    '/js/imports.js',
    '/js/predictions.js',
    '/js/analytics.js',
    '/js/commodities.js',
    '/js/regional.js',
    '/assets/images/favicon.ico',
    '/assets/images/NISR.png'
];

// Install event - cache static files
self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(CACHE_FILES);
            })
            .then(() => {
                console.log('Service Worker: Installation complete');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('Service Worker: Installation failed', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activation complete');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip API requests - let them fail naturally when offline
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version if available
                if (response) {
                    console.log('Service Worker: Serving from cache', event.request.url);
                    return response;
                }

                // Otherwise fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response before caching
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(error => {
                        console.log('Service Worker: Fetch failed, serving offline content', error);

                        // Serve offline page for navigation requests
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }

                        // For other requests, just fail gracefully
                        return new Response('Offline content not available', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Background sync for form submissions when offline
self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
        console.log('Service Worker: Background sync triggered');
        event.waitUntil(doBackgroundSync());
    }
});

function doBackgroundSync() {
    // Handle background sync operations
    return Promise.resolve();
}

// Push notification handling
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/assets/images/favicon.ico',
            badge: '/assets/images/favicon.ico',
            data: data.url,
            actions: [
                {
                    action: 'open',
                    title: 'View Details'
                },
                {
                    action: 'close',
                    title: 'Dismiss'
                }
            ]
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// Notification click handling
self.addEventListener('notificationclick', event => {
    event.notification.close();

    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow(event.notification.data || '/')
        );
    }
});