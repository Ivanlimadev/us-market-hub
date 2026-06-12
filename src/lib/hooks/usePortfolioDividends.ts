'use client'
import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { usePortfolioStore } from '@/lib/store/portfolio-store'
import type { Transaction } from '@/types/portfolio'

interface DivEntry   { date: string; dividend: number }
interface SplitEntry { date: string; split_factor: number }
interface StockSnap  { dividends?: DivEntry[]; splits?: SplitEntry[] }

export interface DividendBar {
  label:  string
  period: string
  value:  number
}

export interface SymbolDividends {
  thisMonth: number
  allTime:   number
}

export interface DividendPayment {
  symbol: string
  date:   string
  amount: number
}

export interface PortfolioDividends {
  monthly:        DividendBar[]
  annual:         DividendBar[]
  thisMonthTotal: number
  allTimeTotal:   number
  bySymbol:       Record<string, SymbolDividends>
  recentPayments: DividendPayment[]
  isLoading:      boolean
}

// Shares held at (and including) isoDate, based on raw transaction entries
function sharesAtDate(txs: Transaction[], symbol: string, isoDate: string): number {
  const cutoff = new Date(isoDate).getTime()
  let n = 0
  for (const tx of txs) {
    if (tx.symbol !== symbol) continue
    if (new Date(tx.date).getTime() > cutoff) continue
    n += tx.type === 'buy' ? tx.quantity : -tx.quantity
  }
  return Math.max(0, n)
}

export function usePortfolioDividends(): PortfolioDividends {
  const transactions = usePortfolioStore(s => s.transactions)
  const symbols = useMemo(
    () => [...new Set(transactions.map(t => t.symbol))],
    [transactions]
  )

  const results = useQueries({
    queries: symbols.map(sym => ({
      queryKey: ['portfolio-div', sym],
      queryFn:  (): Promise<StockSnap> => fetch(`/api/stocks/${sym}`).then(r => r.json()),
      staleTime: 5 * 60_000,
    })),
  })

  const isLoading = results.some(r => r.isLoading)

  const incomeByMonth: Record<string, number> = {}
  const bySymbol: Record<string, SymbolDividends> = {}
  const allPayments: DividendPayment[] = []

  const now = new Date()
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  symbols.forEach((sym, i) => {
    const snap = results[i]?.data
    if (!snap?.dividends?.length) return

    let symThisMonth = 0
    let symAllTime   = 0

    for (const div of snap.dividends) {
      const shares = sharesAtDate(transactions, sym, div.date)
      if (shares <= 0) continue

      const income = shares * div.dividend
      const key    = div.date.slice(0, 7)
      incomeByMonth[key] = (incomeByMonth[key] ?? 0) + income
      allPayments.push({ symbol: sym, date: div.date, amount: income })

      symAllTime += income
      if (key === thisMonthKey) symThisMonth += income
    }

    bySymbol[sym] = { thisMonth: symThisMonth, allTime: symAllTime }
  })

  const recentPayments = allPayments
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 50)

  // Last 24 months
  const monthly: DividendBar[] = []
  for (let i = 23; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthly.push({
      label:  d.toLocaleString('en-US', { month: 'short' }) + " '" + String(d.getFullYear()).slice(2),
      period: key,
      value:  incomeByMonth[key] ?? 0,
    })
  }

  // Annual grouping
  const byYear: Record<string, number> = {}
  for (const [k, v] of Object.entries(incomeByMonth)) {
    const yr = k.slice(0, 4)
    byYear[yr] = (byYear[yr] ?? 0) + v
  }
  const annual: DividendBar[] = Object.entries(byYear)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, value]) => ({ label: year, period: year, value }))

  const thisMonthTotal = incomeByMonth[thisMonthKey] ?? 0
  const allTimeTotal   = Object.values(incomeByMonth).reduce((s, v) => s + v, 0)

  return { monthly, annual, thisMonthTotal, allTimeTotal, bySymbol, recentPayments, isLoading }
}
