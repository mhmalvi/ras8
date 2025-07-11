
const CACHE_NAME = 'returns-automation-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/assets/css/index.css'
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Cache configuration for different resource types
const CACHE_CONFIG = {
  '/assets/js/': { strategy: CACHE_STRATEGIES.CACHE_FIRST, maxAge: 31536000 }, // 1 year
  '/assets/css/': { strategy: CACHE_STRATEGIES.CACHE_FIRST, maxAge: 31536000 }, // 1 year
  '/assets/fonts/': { strategy: CACHE_STRATEGIES.CACHE_FIRST, maxAge: 31536000 }, // 1 year
  '/assets/images/': { strategy: CACHE_STRATEGIES.CACHE_FIRST, maxAge: 2592000 }, // 30 days
  '/api/': { strategy: CACHE_STRATEGIES.NETWORK_FIRST, maxAge: 300 }, // 5 minutes
  '/': { strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE, maxAge: 86400 } // 1 day
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle requests with appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) return;
  
  // Skip POST requests and other mutations
  if (request.method !== 'GET') return;
  
  // Determine caching strategy
  const cacheConfig = getCacheConfig(url.pathname);
  
  if (cacheConfig) {
    event.respondWith(
      handleRequest(request, cacheConfig)
    );
  }
});

// Get cache configuration for a given URL path
function getCacheConfig(pathname) {
  for (const [pattern, config] of Object.entries(CACHE_CONFIG)) {
    if (pathname.startsWith(pattern)) {
      return config;
    }
  }
  return null;
}

// Handle requests based on caching strategy
async function handleRequest(request, config) {
  const { strategy, maxAge } = config;
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, maxAge);
    
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, maxAge);
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, maxAge);
    
    default:
      return fetch(request);
  }
}

// Cache first strategy - serve from cache, fallback to network
async function cacheFirst(request, maxAge) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    const cache = await caches.open(CACHE_NAME);
    return cache.match(request) || new Response('Offline', { status: 503 });
  }
}

// Network first strategy - try network, fallback to cache
async function networkFirst(request, maxAge) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Network first fallback to cache:', error);
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale while revalidate - serve from cache, update in background
async function staleWhileRevalidate(request, maxAge) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Always try to update from network in background
  const networkPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => null);
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If no cached response, wait for network
  return networkPromise || new Response('Offline', { status: 503 });
}

// Check if cached response is expired
function isExpired(response, maxAge) {
  if (!maxAge) return false;
  
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const responseTime = new Date(dateHeader).getTime();
  const now = Date.now();
  
  return (now - responseTime) > (maxAge * 1000);
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync tasks
      handleBackgroundSync()
    );
  }
});

async function handleBackgroundSync() {
  // Handle offline actions when connection is restored
  console.log('Service Worker: Handling background sync');
  
  // This is where you'd replay offline actions
  // For now, just notify the client
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'BACKGROUND_SYNC',
      message: 'Connection restored'
    });
  });
}
