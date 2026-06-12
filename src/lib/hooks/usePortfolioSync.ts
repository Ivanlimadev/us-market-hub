'use client'
import { useEffect, useRef, useCallback } from 'react'
import { usePortfolioStore } from '@/lib/store/portfolio-store'
import { useAuth } from './useAuth'
import type { Transaction } from '@/types/portfolio'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`Portfolio API error: ${res.status}`)
  return res.json() as Promise<T>
}

export function usePortfolioSync() {
  const { user } = useAuth()
  const store = usePortfolioStore()
  const syncedUserId = useRef<string | null>(null)

  // On login / user change: sync from Supabase
  useEffect(() => {
    if (!user) {
      // Logged out — clear local data so it doesn't bleed into next session
      if (syncedUserId.current !== null) {
        store.clearAll()
        syncedUserId.current = null
      }
      return
    }

    // Already synced for this user
    if (syncedUserId.current === user.id) return

    const localTxs = store.transactions

    apiFetch<Transaction[]>('/api/portfolio/transactions')
      .then((remoteTxs) => {
        if (remoteTxs.length > 0) {
          // Remote is source of truth
          store.setTransactions(remoteTxs)
        } else if (localTxs.length > 0) {
          // Migrate localStorage data to Supabase
          apiFetch('/api/portfolio/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ transactions: localTxs }),
          }).catch(console.error)
        }
        syncedUserId.current = user.id
      })
      .catch(console.error)
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const addTransaction = useCallback(
    (tx: Omit<Transaction, 'id'>) => {
      const newTx = store.addTransaction(tx)
      if (user) {
        apiFetch('/api/portfolio/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transaction: newTx }),
        }).catch(console.error)
      }
    },
    [user, store]
  )

  const editTransaction = useCallback(
    (id: string, updates: Partial<Omit<Transaction, 'id'>>) => {
      store.editTransaction(id, updates)
      if (user) {
        apiFetch(`/api/portfolio/transactions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }).catch(console.error)
      }
    },
    [user, store]
  )

  const removeTransaction = useCallback(
    (id: string) => {
      store.removeTransaction(id)
      if (user) {
        apiFetch(`/api/portfolio/transactions/${id}`, {
          method: 'DELETE',
        }).catch(console.error)
      }
    },
    [user, store]
  )

  return { addTransaction, editTransaction, removeTransaction }
}
