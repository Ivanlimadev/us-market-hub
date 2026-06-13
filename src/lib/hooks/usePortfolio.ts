'use client'
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePortfolioStore } from '@/lib/store/portfolio-store'
import { computeHoldings, computeSummary } from '@/lib/portfolio-calc'
import type { PortfolioSummary } from '@/types/portfolio'
import type { YFBatchQuote } from '@/lib/yahoo-finance'
import type { CryptoMarket } from '@/types/crypto'
import type { TickerMeta } from '@/lib/portfolio-calc'

export function usePortfolio(): {
  summary: PortfolioSummary | null
  isLoading: boolean
  symbols: string[]
} {
  const transactions = usePortfolioStore((s) => s.transactions)

  const stockSymbols = useMemo(
    () => [...new Set(
      transactions
        .filter((t) => (t.asset_type ?? 'stock') === 'stock')
        .map((t) => t.symbol)
    )],
    [transactions]
  )

  const hasCrypto = useMemo(
    () => transactions.some((t) => t.asset_type === 'crypto'),
    [transactions]
  )

  const stockKey = stockSymbols.slice().sort().join(',')

  const { data: stockQuotes, isLoading: stockLoading, isFetched: stockFetched } = useQuery<YFBatchQuote[]>({
    queryKey: ['batch-quotes', stockKey],
    queryFn: () => fetch(`/api/batch-quotes?symbols=${stockKey}`).then((r) => r.json()),
    staleTime: 60_000,
    enabled: stockSymbols.length > 0,
  })

  const { data: cryptoMarkets, isLoading: cryptoLoading, isFetched: cryptoFetched } = useQuery<CryptoMarket[]>({
    queryKey: ['crypto-markets'],
    queryFn: () => fetch('/api/crypto/markets?limit=250').then((r) => r.json()),
    staleTime: 55_000,
    refetchInterval: 60_000,
    enabled: hasCrypto,
  })

  const isLoading = stockLoading || cryptoLoading

  const summary = useMemo(() => {
    if (!transactions.length) return null
    // Wait until the fetch completes (success or error) — don't block on empty results
    if (stockSymbols.length > 0 && !stockFetched) return null
    if (hasCrypto && !cryptoFetched) return null

    const quoteMap: Record<string, TickerMeta> = {}

    for (const q of stockQuotes ?? []) {
      quoteMap[q.symbol] = {
        name: q.name,
        prevClose: q.prevClose,
        currentPrice: q.price,
        asset_type: 'stock',
      }
    }

    for (const coin of cryptoMarkets ?? []) {
      quoteMap[coin.symbol.toUpperCase()] = {
        name: coin.name,
        prevClose: coin.current_price - (coin.price_change_24h ?? 0),
        currentPrice: coin.current_price,
        asset_type: 'crypto',
        coingeckoId: coin.id,
        image: coin.image,
      }
    }

    const holdings = computeHoldings(transactions, quoteMap)
    return computeSummary(holdings)
  }, [stockQuotes, cryptoMarkets, transactions, stockSymbols.length, hasCrypto])

  const symbols = useMemo(
    () => [...new Set(transactions.map((t) => t.symbol))],
    [transactions]
  )

  return { summary, isLoading, symbols }
}
