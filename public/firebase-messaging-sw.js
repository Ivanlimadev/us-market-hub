/* Firebase Cloud Messaging service worker — handles background web push.
   Runs in its own worker context (no access to the app bundle), so it loads
   Firebase from the CDN "compat" builds. Config values here are public. */
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyAHA4ahqpIPxIr0UDT8SwNAlozU7epzNXQ',
  authDomain: 'stock-market-roi-app.firebaseapp.com',
  projectId: 'stock-market-roi-app',
  storageBucket: 'stock-market-roi-app.firebasestorage.app',
  messagingSenderId: '19388238175',
  appId: '1:19388238175:web:39cd119c8206b563604eea',
})

const messaging = firebase.messaging()

// Background message → show a notification. Clicking it opens the article.
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Stock Market ROI'
  const body = payload.notification?.body || ''
  const slug = payload.data?.slug
  const url = slug ? `/blog/${slug}` : '/'

  self.registration.showNotification(title, {
    body,
    icon: '/ivan-lima.jpg',
    badge: '/ivan-lima.jpg',
    data: { url },
    tag: slug || 'smroi-post',
  })
})

// Focus an existing tab if open, otherwise open a new one at the article.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(url) && 'focus' in client) return client.focus()
      }
      return clients.openWindow(url)
    })
  )
})
