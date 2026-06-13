'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WatchlistItem, PriceAlert } from '@/types/watchlist'

interface WatchlistStore {
  items: WatchlistItem[]
  alerts: PriceAlert[]
  // items
  setItems: (items: WatchlistItem[]) => void
  addItem: (item: Omit<WatchlistItem, 'id' | 'addedAt'>) => WatchlistItem
  removeItem: (id: string) => void
  isWatched: (symbol: string, asset_type: string) => boolean
  getWatchId: (symbol: string, asset_type: string) => string | undefined
  // alerts
  setAlerts: (alerts: PriceAlert[]) => void
  addAlert: (alert: Omit<PriceAlert, 'id' | 'triggered' | 'triggeredAt' | 'createdAt'>) => PriceAlert
  removeAlert: (id: string) => void
  triggerAlert: (id: string) => void
  dismissTriggered: () => void
  getAlertsForSymbol: (symbol: string, asset_type?: string) => PriceAlert[]
  clearAll: () => void
}

export const useWatchlistStore = create<WatchlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      alerts: [],

      // ── items ──────────────────────────────────────────────────────────────
      setItems: (items) => set({ items }),

      addItem: (item) => {
        const newItem: WatchlistItem = {
          ...item,
          id: crypto.randomUUID(),
          addedAt: new Date().toISOString(),
        }
        set((state) => ({ items: [...state.items, newItem] }))
        return newItem
      },

      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      isWatched: (symbol, asset_type) =>
        get().items.some(
          (i) => i.symbol === symbol && i.asset_type === asset_type
        ),

      getWatchId: (symbol, asset_type) =>
        get().items.find(
          (i) => i.symbol === symbol && i.asset_type === asset_type
        )?.id,

      // ── alerts ─────────────────────────────────────────────────────────────
      setAlerts: (alerts) => set({ alerts }),

      addAlert: (alert) => {
        const newAlert: PriceAlert = {
          ...alert,
          id: crypto.randomUUID(),
          triggered: false,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ alerts: [...state.alerts, newAlert] }))
        return newAlert
      },

      removeAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== id),
        })),

      triggerAlert: (id) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id
              ? { ...a, triggered: true, triggeredAt: new Date().toISOString() }
              : a
          ),
        })),

      dismissTriggered: () =>
        set((state) => ({
          alerts: state.alerts.filter((a) => !a.triggered),
        })),

      getAlertsForSymbol: (symbol, asset_type) =>
        get().alerts.filter(
          (a) => a.symbol === symbol && (!asset_type || a.asset_type === asset_type)
        ),

      clearAll: () => set({ items: [], alerts: [] }),
    }),
    { name: 'us-market-watchlist' }
  )
)
