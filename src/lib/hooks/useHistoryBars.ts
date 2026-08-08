'use client'
import { useQuery } from '@tanstack/react-query'

/**
 * Canonical stock-history hook shared by every component on the stock page.
 *
 * WHY THIS EXISTS: the page used to fire the SAME `/api/stocks/[symbol]/history`
 * request from two different hooks (the returns table and the growth-comparison
 * chart) under two different query keys, so React Query could not dedupe them and
 * the page's own symbol was downloaded twice. Routing both through this one
 * queryKey (`['stock-history', symbol, period]`) collapses that into a single
 * network fetch. Consumers that need a different shape use React Query `select`.
 */

export interface RawBar {
  date: string
  close: number // raw close
  adjClose: number // split + dividend adjusted close
}

/**
 * Fetch bars, THROWING on a bad/empty response so React Query retries it.
 * The stock page fires several history calls at once; the upstream (and our
 * 30 req/min limiter) throttles bursts and can return 429/502 or an empty list
 * for a few symbols. A plain fetch().json() swallows that; throwing lets the
 * `retry` backoff refill them once the burst clears.
 */
export async function fetchHistoryBars(symbol: string, period: string): Promise<RawBar[]> {
  const res = await fetch(`/api/stocks/${symbol}/history?period=${period}`)
  if (!res.ok) throw new Error(`history ${symbol}: HTTP ${res.status}`)
  const json = (await res.json()) as {
    bars?: Array<{ date: string; adj_close?: number | null; close?: number | null }>
  }
  const bars = (json.bars ?? [])
    .map((b) => ({
      date: b.date.split('T')[0],
      close: b.close ?? 0,
      adjClose: b.adj_close ?? b.close ?? 0,
    }))
    .filter((b) => b.close > 0)
  if (bars.length === 0) throw new Error(`history ${symbol}: empty`)
  return bars
}

export function useHistoryBars(symbol: string, period: string, enabled = true) {
  return useQuery<RawBar[]>({
    queryKey: ['stock-history', symbol, period],
    queryFn: () => fetchHistoryBars(symbol, period),
    enabled: enabled && !!symbol,
    staleTime: 5 * 60_000,
    retry: 2,
  })
}
