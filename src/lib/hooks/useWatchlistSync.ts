'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useWatchlistStore } from '@/lib/store/watchlist-store'
import { useAuth } from './useAuth'
import type { WatchlistItem, PriceAlert } from '@/types/watchlist'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`Watchlist API error: ${res.status}`)
  return res.json() as Promise<T>
}

export function useWatchlistSync() {
  const { user } = useAuth()
  const store = useWatchlistStore()
  const syncedUserId = useRef<string | null>(null)

  // On login / user change: sync from Supabase
  useEffect(() => {
    if (!user) {
      if (syncedUserId.current !== null) {
        store.clearAll()
        syncedUserId.current = null
      }
      return
    }

    if (syncedUserId.current === user.id) return

    const localItems  = store.items
    const localAlerts = store.alerts

    Promise.all([
      apiFetch<WatchlistItem[]>('/api/watchlist'),
      apiFetch<PriceAlert[]>('/api/alerts'),
    ])
      .then(([remoteItems, remoteAlerts]) => {
        // Items
        if (remoteItems.length > 0) {
          store.setItems(remoteItems)
        } else if (localItems.length > 0) {
          apiFetch('/api/watchlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: localItems }),
          }).catch(console.error)
        }

        // Alerts
        if (remoteAlerts.length > 0) {
          store.setAlerts(remoteAlerts)
        } else if (localAlerts.length > 0) {
          apiFetch('/api/alerts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alerts: localAlerts }),
          }).catch(console.error)
        }

        syncedUserId.current = user.id
      })
      .catch(console.error)
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const addToWatchlist = useCallback(
    (item: Omit<WatchlistItem, 'id' | 'addedAt'>) => {
      const newItem = store.addItem(item)
      if (user) {
        apiFetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ item: newItem }),
        }).catch(console.error)
      }
      return newItem
    },
    [user, store]
  )

  const removeFromWatchlist = useCallback(
    (id: string) => {
      store.removeItem(id)
      if (user) {
        apiFetch(`/api/watchlist/${id}`, { method: 'DELETE' }).catch(console.error)
      }
    },
    [user, store]
  )

  const addAlert = useCallback(
    (alert: Omit<PriceAlert, 'id' | 'triggered' | 'triggeredAt' | 'createdAt'>) => {
      const newAlert = store.addAlert(alert)
      if (user) {
        apiFetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alert: newAlert }),
        }).catch(console.error)
      }
      return newAlert
    },
    [user, store]
  )

  const removeAlert = useCallback(
    (id: string) => {
      store.removeAlert(id)
      if (user) {
        apiFetch(`/api/alerts/${id}`, { method: 'DELETE' }).catch(console.error)
      }
    },
    [user, store]
  )

  return { addToWatchlist, removeFromWatchlist, addAlert, removeAlert }
}
