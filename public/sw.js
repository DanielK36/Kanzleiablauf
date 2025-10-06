// Service Worker for Push Notifications
const CACHE_NAME = 'speaker-dashboard-v1';
const urlsToCache = [
  '/',
  '/speaker-dashboard',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push event
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  let notificationData = {
    title: 'Neue Veranstaltung verfügbar!',
    body: 'Es gibt neue Termine zum Buchen.',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'speaker-notification',
    data: {
      url: '/speaker-dashboard'
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || notificationData.tag,
        data: {
          url: data.url || notificationData.data.url,
          eventId: data.eventId,
          eventDate: data.eventDate
        }
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    actions: [
      {
        action: 'book',
        title: 'Jetzt buchen',
        icon: '/action-book.png'
      },
      {
        action: 'view',
        title: 'Anzeigen',
        icon: '/action-view.png'
      }
    ],
    requireInteraction: true,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/speaker-dashboard';

  if (event.action === 'book') {
    // Open booking page
    event.waitUntil(
      clients.openWindow(urlToOpen + '?action=book')
    );
  } else if (event.action === 'view') {
    // Open dashboard
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  } else {
    // Default action - open dashboard
    event.waitUntil(
      clients.openWindow(urlToOpen)
    );
  }
});

// Background sync for offline booking
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-booking') {
    event.waitUntil(
      // Handle offline booking sync
      handleOfflineBookingSync()
    );
  }
});

async function handleOfflineBookingSync() {
  try {
    // Get pending bookings from IndexedDB
    const pendingBookings = await getPendingBookings();
    
    for (const booking of pendingBookings) {
      try {
        const response = await fetch('/api/speaker-bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(booking)
        });

        if (response.ok) {
          // Remove from pending bookings
          await removePendingBooking(booking.id);
        }
      } catch (error) {
        console.error('Error syncing booking:', error);
      }
    }
  } catch (error) {
    console.error('Error in background sync:', error);
  }
}

// Helper functions for IndexedDB
async function getPendingBookings() {
  // Implementation for getting pending bookings from IndexedDB
  return [];
}

async function removePendingBooking(bookingId) {
  // Implementation for removing pending booking from IndexedDB
}
