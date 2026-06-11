'use client'
import { useQuery } from '@tanstack/react-query'
import { getPollInterval } from '@/lib/market-hours'
import type { MSEod, MSIntraday } from '@/types/marketstack'

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

async function fetchQuotes(symbols: string[]): Promise<QuoteData[]> {
  if (!symbols.length) return []

  const sym = symbols.join(',')

  // Fetch today's intraday + yesterday's EOD in parallel for change calculation
  const [intradayRes, eodRes] = await Promise.all([
    fetch(`/api/quotes?symbols=${sym}&type=intraday&interval=5min`).then((r) => r.json()),
    fetch(`/api/quotes?symbols=${sym}&type=eod`).then((r) => r.json()),
  ])

  const eodMap: Record<string, MSEod> = {}
  for (const bar of eodRes?.data ?? []) {
    if (!eodMap[bar.symbol]) eodMap[bar.symbol] = bar
  }

  // Build a prev-close map: second EOD entry per symbol
  const prevCloseMap: Record<string, number> = {}
  const seenEod: Record<string, boolean> = {}
  for (const bar of eodRes?.data ?? []) {
    if (seenEod[bar.symbol]) {
      prevCloseMap[bar.symbol] = bar.adj_close ?? bar.close ?? 0
    }
    seenEod[bar.symbol] = true
  }

  const results: QuoteData[] = []
  const intradayMap: Record<string, MSIntraday> = {}
  for (const bar of intradayRes?.data ?? []) {
    if (!intradayMap[bar.symbol]) intradayMap[bar.symbol] = bar
  }

  for (const symbol of symbols) {
    const intra = intradayMap[symbol]
    const eod = eodMap[symbol]

    if (!intra && !eod) continue

    const price =
      intra?.last ??
      intra?.open ??
      eod?.adj_close ??
      eod?.close ??
      eod?.open ??
      0

    const open = intra?.open ?? eod?.open ?? 0
    const high = intra?.high ?? eod?.high ?? 0
    const low = intra?.low ?? eod?.low ?? 0
    const volume = intra?.volume ?? eod?.volume ?? 0
    const prevClose = prevCloseMap[symbol] ?? eod?.adj_close ?? eod?.close ?? 0
    const change = prevClose > 0 ? price - prevClose : 0
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0

    results.push({
      symbol,
      name: (eod as MSEod & { name?: string })?.name ?? symbol,
      price,
      open,
      high,
      low,
      volume,
      prevClose,
      change,
      changePct,
      date: intra?.date ?? eod?.date ?? '',
      isIntraday: !!intra,
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
