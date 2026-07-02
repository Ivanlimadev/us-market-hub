'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Transaction } from '@/types/portfolio'

interface PortfolioStore {
  transactions: Transaction[]
  // user id that owns the persisted data (null = guest-built portfolio).
  // Persisted so we can tell, on a fresh load, whether leftover local data
  // belonged to a signed-in user and must be cleared for a guest visitor.
  ownerId: string | null
  setTransactions: (transactions: Transaction[]) => void
  setOwnerId: (id: string | null) => void
  addTransaction: (tx: Omit<Transaction, 'id'>) => Transaction
  editTransaction: (id: string, tx: Partial<Omit<Transaction, 'id'>>) => void
  removeTransaction: (id: string) => void
  clearAll: () => void
  getSymbols: () => string[]
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      transactions: [],
      ownerId: null,

      setTransactions: (transactions) => set({ transactions }),

      setOwnerId: (ownerId) => set({ ownerId }),

      addTransaction: (tx) => {
        const newTx = { ...tx, id: crypto.randomUUID() }
        set((state) => ({ transactions: [...state.transactions, newTx] }))
        return newTx
      },

      editTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),

      clearAll: () => set({ transactions: [], ownerId: null }),

      getSymbols: () => {
        const symbols = new Set(get().transactions.map((t) => t.symbol))
        return Array.from(symbols)
      },
    }),
    { name: 'us-market-portfolio' }
  )
)
