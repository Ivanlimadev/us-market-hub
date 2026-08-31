'use client'
// Web push (Firebase Cloud Messaging) — browser side.
// Reuses the same Firebase project as the iOS app (stock-market-roi-app) so the
// existing notify-blog-posts edge function delivers to browsers too.
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getMessaging, getToken, isSupported } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: 'AIzaSyAHA4ahqpIPxIr0UDT8SwNAlozU7epzNXQ',
  authDomain: 'stock-market-roi-app.firebaseapp.com',
  projectId: 'stock-market-roi-app',
  storageBucket: 'stock-market-roi-app.firebasestorage.app',
  messagingSenderId: '19388238175',
  appId: '1:19388238175:web:39cd119c8206b563604eea',
}

const VAPID_KEY =
  'BAhpbvcwjfm3KvdDJXg1BkcJKQC83Pbzlgi6C6WMTwlbVKzkADzt52evetMobOxxBWHkaob09j1wdCcd-oUvy2k'

function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
}

/** True when this browser can do web push at all (rules out iOS Safari < 16.4,
 *  private windows, unsupported browsers). Safe to call anywhere. */
export async function pushSupported(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false
    if (!('serviceWorker' in navigator) || !('Notification' in window)) return false
    return await isSupported()
  } catch {
    return false
  }
}

/** Current permission without prompting. */
export function pushPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

/** Prompts for permission, registers the SW, gets the FCM token and stores it.
 *  Returns the token on success, or null if denied/unsupported/failed. */
export async function subscribeToPush(): Promise<string | null> {
  try {
    if (!(await pushSupported())) return null

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js',
    )

    const messaging = getMessaging(getFirebaseApp())
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })
    if (!token) return null

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    return token
  } catch (e) {
    console.error('[push] subscribe failed:', e)
    return null
  }
}
