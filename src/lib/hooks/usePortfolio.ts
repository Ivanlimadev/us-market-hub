'use client'
import { useMemo } from 'react'
import { usePortfolioStore } from '@/lib/store/portfolio-store'
import { useQuotes } from '@/lib/hooks/useQuotes'
import { computeHoldings, computeSummary } from '@/lib/portfolio-calc'
import type { PortfolioSummary } from '@/types/portfolio'

export function usePortfolio(): {
  summary: PortfolioSummary | null
  isLoading: boolean
  symbols: string[]
} {
  const transactions = usePortfolioStore((s) => s.transactions)
  const symbols = usePortfolioStore((s) => s.getSymbols())

  const { data: quotes, isLoading } = useQuotes(symbols)

  const summary = useMemo(() => {
    if (!quotes || !transactions.length) return null

    const quoteMap: Record<string, { name: string; prevClose: number; currentPrice: number }> = {}
    for (const q of quotes) {
      quoteMap[q.symbol] = {
        name: q.name,
        prevClose: q.prevClose,
        currentPrice: q.price,
      }
    }

    const holdings = computeHoldings(transactions, quoteMap)
    return computeSummary(holdings)
  }, [quotes, transactions])

  return { summary, isLoading, symbols }
}
