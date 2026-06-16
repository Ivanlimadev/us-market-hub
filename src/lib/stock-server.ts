// Server-only: fetches stock data for SSR/ISR in page.tsx
// Same logic as /api/stocks/[symbol]/route.ts — kept in sync manually.
import { getLatestIntraday } from '@/lib/marketstack'
import { getYFSummary, getYFDividends } from '@/lib/yahoo-finance'
import type { StockDetailData } from '@/lib/hooks/useStockDetail'

const MS_KEY = process.env.MARKETSTACK_API_KEY!
const BASE   = 'https://api.marketstack.com/v1'

async function msGet(path: string, params: Record<string, string | number> = {}) {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('access_key', MS_KEY)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  const res = await fetch(url.toString(), { next: { revalidate: 60 } })
  if (!res.ok) throw new Error(`MS ${res.status}`)
  return res.json()
}

export async function fetchStockData(symbol: string): Promise<StockDetailData | null> {
  const sym = symbol.toUpperCase()
  try {
    const [intraday, tickerEod, dividends, splits, yfInfo] = await Promise.allSettled([
      msGet(`/tickers/${sym}/intraday/latest`),
      msGet(`/tickers/${sym}/eod`, { limit: 365 }),
      getYFDividends(sym),
      msGet(`/tickers/${sym}/splits`, { limit: 20 }),
      getYFSummary(sym),
    ])

    const eodData =
      tickerEod.status === 'fulfilled'
        ? (tickerEod.value as { data?: { eod?: unknown[]; name?: string; stock_exchange?: { acronym?: string } } })?.data
        : null

    const latestEod = eodData?.eod?.[0] ?? null
    const prevEod   = eodData?.eod?.[1] ?? null
    const intradayBar = intraday.status === 'fulfilled' ? intraday.value : null
    const yfPrice     = yfInfo.status === 'fulfilled' ? yfInfo.value : null

    const currentPrice =
      yfPrice?.regularMarketPrice ??
      (intradayBar as { last?: number; close?: number } | null)?.last ??
      (intradayBar as { last?: number; close?: number } | null)?.close ??
      (latestEod as { close?: number } | null)?.close ?? 0

    const prevClose =
      yfPrice?.regularMarketPreviousClose ??
      (prevEod as { close?: number } | null)?.close ?? 0

    return {
      symbol: sym,
      name: eodData?.name ?? sym,
      currentPrice,
      prevClose,
      change: prevClose > 0 ? currentPrice - prevClose : 0,
      changePct:
        yfPrice?.regularMarketChangePercent != null
          ? yfPrice.regularMarketChangePercent * 100
          : prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      latestEod: latestEod as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recentEod: (eodData?.eod ?? []) as any[],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dividends: (dividends.status === 'fulfilled' ? dividends.value : []) as any[],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      splits: (splits.status === 'fulfilled'
        ? (splits.value as { data?: unknown[] })?.data ?? [] : []) as any[],
      info: yfInfo.status === 'fulfilled' ? yfInfo.value : null,
      exchange: eodData?.stock_exchange?.acronym ?? null,
    }
  } catch {
    return null
  }
}
