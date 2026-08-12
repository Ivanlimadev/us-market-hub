'use client'
import { useQuery } from '@tanstack/react-query'
import { getPollInterval } from '@/lib/market-hours'

interface QuoteData {
  symbol: string
  name: string
  price: number
  open: number
  high: number
  low: number
  volume: number
  prevClose: number
  change: number
  changePct: number
  date: string
  isIntraday: boolean
}

// Shape returned by /api/quotes (Yahoo Finance batch quotes).
interface ApiQuote {
  symbol: string
  name: string
  price: number
  prevClose: number
  changePct: number
  volume: number | null
}

async function fetchQuotes(symbols: string[]): Promise<QuoteData[]> {
  if (!symbols.length) return []

  const sym = symbols.join(',')
  const res = await fetch(`/api/quotes?symbols=${sym}`).then((r) => r.json())
  const quotes: ApiQuote[] = res?.data ?? []

  const bySymbol: Record<string, ApiQuote> = {}
  for (const q of quotes) bySymbol[q.symbol] = q

  const results: QuoteData[] = []
  for (const symbol of symbols) {
    const q = bySymbol[symbol]
    if (!q) continue

    const price = q.price ?? 0
    const prevClose = q.prevClose ?? 0
    const change = prevClose > 0 ? price - prevClose : 0
    const changePct = q.changePct ?? (prevClose > 0 ? (change / prevClose) * 100 : 0)

    results.push({
      symbol,
      name: q.name || symbol,
      price,
      // Yahoo batch quotes do not expose intraday OHLC; fall back to price.
      open: price,
      high: price,
      low: price,
      volume: q.volume ?? 0,
      prevClose,
      change,
      changePct,
      date: '',
      isIntraday: false,
    })
  }

  return results
}

export function useQuotes(symbols: string[]) {
  return useQuery({
    queryKey: ['quotes', symbols.slice().sort().join(',')],
    queryFn: () => fetchQuotes(symbols),
    refetchInterval: getPollInterval,
    staleTime: 55_000,
    enabled: symbols.length > 0,
  })
}

export type { QuoteData }
