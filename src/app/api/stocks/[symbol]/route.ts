import { NextRequest, NextResponse } from 'next/server'
import { getLatestIntraday } from '@/lib/marketstack'
import { getYFSummary } from '@/lib/yahoo-finance'

const MS_KEY = process.env.MARKETSTACK_API_KEY!
const BASE = 'https://api.marketstack.com/v1'

async function msGet(path: string, params: Record<string, string | number> = {}) {
  const url = new URL(`${BASE}${path}`)
  url.searchParams.set('access_key', MS_KEY)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v))
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`MS ${res.status}`)
  return res.json()
}

// GET /api/stocks/[symbol]
// Returns: quote, info (YF), history (MS), dividends (MS), splits (MS)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()

  try {
    const [intraday, tickerEod, dividends, splits, yfInfo] = await Promise.allSettled([
      // Latest intraday snapshot
      msGet(`/tickers/${sym}/intraday/latest`),
      // EOD with ticker metadata + last 30 trading days
      msGet(`/tickers/${sym}/eod`, { limit: 365 }),
      // Full dividend history
      msGet(`/tickers/${sym}/dividends`, { limit: 1000 }),
      // Split history
      msGet(`/tickers/${sym}/splits`, { limit: 20 }),
      // Yahoo Finance fundamentals + company info
      getYFSummary(sym),
    ])

    const eodData =
      tickerEod.status === 'fulfilled'
        ? (tickerEod.value as { data?: { eod?: unknown[]; name?: string } })?.data
        : null

    const latestEod = eodData?.eod?.[0] ?? null
    const prevEod = eodData?.eod?.[1] ?? null
    const intradayBar =
      intraday.status === 'fulfilled' ? intraday.value : null

    const yfPrice = yfInfo.status === 'fulfilled' ? yfInfo.value : null

    const currentPrice =
      yfPrice?.regularMarketPrice ??
      (intradayBar as { last?: number; close?: number; open?: number } | null)?.last ??
      (intradayBar as { last?: number; close?: number; open?: number } | null)?.close ??
      (latestEod as { adj_close?: number; close?: number; open?: number } | null)?.close ??
      (latestEod as { adj_close?: number; close?: number; open?: number } | null)?.open ??
      0

    const prevClose =
      yfPrice?.regularMarketPreviousClose ??
      (prevEod as { adj_close?: number; close?: number } | null)?.close ??
      0

    return NextResponse.json(
      {
        symbol: sym,
        name: eodData?.name ?? sym,
        currentPrice,
        prevClose,
        change: prevClose > 0 ? currentPrice - prevClose : 0,
        changePct:
          yfPrice?.regularMarketChangePercent != null
            ? yfPrice.regularMarketChangePercent * 100
            : prevClose > 0
            ? ((currentPrice - prevClose) / prevClose) * 100
            : 0,
        latestEod,
        recentEod: eodData?.eod ?? [],
        dividends:
          dividends.status === 'fulfilled'
            ? (dividends.value as { data?: unknown[] })?.data ?? []
            : [],
        splits:
          splits.status === 'fulfilled'
            ? (splits.value as { data?: unknown[] })?.data ?? []
            : [],
        info: yfInfo.status === 'fulfilled' ? yfInfo.value : null,
        exchange: (eodData as { stock_exchange?: { acronym?: string } })?.stock_exchange?.acronym ?? null,
      },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' } }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
