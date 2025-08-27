const CACHE_NAME = "foody-now-v1"
const STATIC_CACHE = "foody-now-static-v1"
const DYNAMIC_CACHE = "foody-now-dynamic-v1"

// Assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/offline.html",
  // Add other critical assets
]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing...")
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching static assets")
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log("[SW] Skip waiting")
        return self.skipWaiting()
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating...")
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log("[SW] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("[SW] Claiming clients")
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== "GET") {
    return
  }

  // Skip external requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle API requests
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses for offline access
          if (response.ok && request.method === "GET") {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(request)
        }),
    )
    return
  }

  // Handle page requests
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log("[SW] Serving from cache:", request.url)
        return cachedResponse
      }

      return fetch(request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response.ok) {
            return response
          }

          const responseClone = response.clone()

          // Cache pages and assets
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone)
          })

          return response
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/offline.html")
          }

          // Return a basic offline response for other requests
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
          })
        })
    }),
  )
})

// Background sync for offline orders
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync-orders") {
    console.log("[SW] Background sync: orders")
    event.waitUntil(syncOfflineOrders())
  }
})

// Push notifications
self.addEventListener("push", (event) => {
  console.log("[SW] Push received")

  const options = {
    body: event.data ? event.data.text() : "Nuevo pedido recibido",
    icon: "/icon-192.png",
    badge: "/icon-72.png",
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "view",
        title: "Ver Pedido",
        icon: "/icon-192.png",
      },
      {
        action: "close",
        title: "Cerrar",
        icon: "/icon-192.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Foody Now", options))
})

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click received")

  event.notification.close()

  if (event.action === "view") {
    event.waitUntil(clients.openWindow("/admin/orders"))
  }
})

// Sync offline orders when connection is restored
async function syncOfflineOrders() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE)
    const requests = await cache.keys()

    const orderRequests = requests.filter((request) => request.url.includes("/api/orders") && request.method === "POST")

    for (const request of orderRequests) {
      try {
        const response = await fetch(request)
        if (response.ok) {
          await cache.delete(request)
          console.log("[SW] Synced offline order")
        }
      } catch (error) {
        console.log("[SW] Failed to sync order:", error)
      }
    }
  } catch (error) {
    console.log("[SW] Sync failed:", error)
  }
}
