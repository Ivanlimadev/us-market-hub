'use client'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePortfolioStore } from '@/lib/store/portfolio-store'
import { computeHoldings, computeSummary } from '@/lib/portfolio-calc'
import type { PortfolioSummary } from '@/types/portfolio'
import type { YFBatchQuote } from '@/lib/yahoo-finance'

export function usePortfolio(): {
  summary: PortfolioSummary | null
  isLoading: boolean
  symbols: string[]
} {
  const transactions = usePortfolioStore((s) => s.transactions)
  const symbols = useMemo(
    () => [...new Set(transactions.map((t) => t.symbol))],
    [transactions]
  )

  const symbolKey = symbols.slice().sort().join(',')

  const { data: quotes, isLoading } = useQuery<YFBatchQuote[]>({
    queryKey: ['batch-quotes', symbolKey],
    queryFn: () => fetch(`/api/batch-quotes?symbols=${symbolKey}`).then(r => r.json()),
    staleTime: 60_000,
    enabled: symbols.length > 0,
  })

  const summary = useMemo(() => {
    if (!quotes?.length || !transactions.length) return null

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
