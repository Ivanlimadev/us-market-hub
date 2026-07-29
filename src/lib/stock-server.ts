// Server-only: fetches stock data for SSR/ISR in page.tsx
// Same logic as /api/stocks/[symbol]/route.ts — kept in sync manually.
import { getLatestIntraday } from '@/lib/marketstack'
import { getYFSummary, getYFDividends } from '@/lib/yahoo-finance'
import type { StockDetailData } from '@/lib/hooks/useStockDetail'

const MS_KEY = process.env.MARKETSTACK_API_KEY!
const BASE   = 'https://api.marketstack.com/v1'

// ── Last-good in-memory cache ───────────────────────────────────────────────
// The VPS runs a long-lived Node process (PM2 `next start`), so module memory
// survives across requests and ISR revalidations. When the upstreams (Yahoo +
// Marketstack) momentarily fail, we return the last usable snapshot instead of
// an empty one. This keeps stock pages from blanking out — an empty render sets
// `hasSeoData=false` → noindex → the page drops out of Google. Bridging the gap
// with stale-but-real data keeps the page indexable until the next good fetch.
type Cached = { data: StockDetailData; ts: number }
const lastGood = new Map<string, Cached>()
const LAST_GOOD_TTL_MS = 24 * 60 * 60 * 1000 // 24h — long enough to ride out a
// throttle window, short enough that a truly delisted ticker eventually clears.

// Matches hasSeoData(): a snapshot is "usable" if it has a price or a market cap.
function isUsable(d: StockDetailData): boolean {
  return d.currentPrice > 0 || (d.info?.marketCap ?? 0) > 0
}

function freshCached(sym: string): StockDetailData | null {
  const c = lastGood.get(sym)
  return c && Date.now() - c.ts < LAST_GOOD_TTL_MS ? c.data : null
}

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

    const toNum = (v: unknown): number => {
      const n = Number(v)
      return isFinite(n) ? n : 0
    }

    const currentPrice = toNum(
      yfPrice?.regularMarketPrice ??
      (intradayBar as { last?: number; close?: number } | null)?.last ??
      (intradayBar as { last?: number; close?: number } | null)?.close ??
      (latestEod as { close?: number } | null)?.close
    )

    const prevClose = toNum(
      yfPrice?.regularMarketPreviousClose ??
      (prevEod as { close?: number } | null)?.close
    )

    const result: StockDetailData = {
      symbol: sym,
      name: eodData?.name ?? yfPrice?.longName ?? sym,
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
      exchange: eodData?.stock_exchange?.acronym ?? yfPrice?.exchangeName ?? null,
    }

    // Cache good snapshots; serve the last good one when this fetch came back empty.
    if (isUsable(result)) {
      lastGood.set(sym, { data: result, ts: Date.now() })
      return result
    }
    return freshCached(sym) ?? result
  } catch {
    // Total failure — fall back to the last good snapshot rather than a blank page.
    return freshCached(sym)
  }
}
