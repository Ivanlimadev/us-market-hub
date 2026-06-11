'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Transaction } from '@/types/portfolio'

interface PortfolioStore {
  transactions: Transaction[]
  addTransaction: (tx: Omit<Transaction, 'id'>) => void
  editTransaction: (id: string, tx: Partial<Omit<Transaction, 'id'>>) => void
  removeTransaction: (id: string) => void
  clearAll: () => void
  getSymbols: () => string[]
}

export const usePortfolioStore = create<PortfolioStore>()(
  persist(
    (set, get) => ({
      transactions: [],

      addTransaction: (tx) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            { ...tx, id: crypto.randomUUID() },
          ],
        })),

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

      clearAll: () => set({ transactions: [] }),

      getSymbols: () => {
        const symbols = new Set(get().transactions.map((t) => t.symbol))
        return Array.from(symbols)
      },
    }),
    { name: 'us-market-portfolio' }
  )
)
