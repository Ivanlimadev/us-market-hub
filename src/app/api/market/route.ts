import { NextResponse } from 'next/server'
import { getYFBatchQuotes } from '@/lib/yahoo-finance'
import { cached, cachedStale } from '@/lib/server-cache'

// US market indices - Yahoo Finance format
const INDEX_SYMBOLS = ['^DJI', '^IXIC', '^RUT', '^VIX']
const INDEX_NAMES: Record<string, string> = {
  '^DJI':  'Dow Jones',
  '^IXIC': 'Nasdaq',
  '^RUT':  'Russell 2000',
  '^VIX':  'VIX',
}

// Major US blue chips
const BLUE_CHIPS = [
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN',
  'META', 'TSLA', 'JPM', 'V', 'UNH',
]

async function loadMarket() {
  const [indexQuotes, chipQuotes] = await Promise.all([
    getYFBatchQuotes(INDEX_SYMBOLS).catch(() => [] as Awaited<ReturnType<typeof getYFBatchQuotes>>),
    getYFBatchQuotes(BLUE_CHIPS),
  ])

  const indices = indexQuotes.map((q) => ({
    symbol:    q.symbol,
    name:      INDEX_NAMES[q.symbol] ?? q.name,
    price:     q.price,
    changePct: q.changePct,
  }))

  const blueChips = chipQuotes.map((q) => ({
    symbol:    q.symbol,
    name:      q.name,
    price:     q.price,
    changePct: q.changePct,
    marketCap: q.marketCap ?? null,
    sector:    q.sector ?? null,
  }))

  return { indices, blueChips }
}

// GET /api/market - homepage market overview.
// Shared process-wide cache (single-flight) replaces the old per-IP rate limit:
// the homepage hits this on every visit, so caching protects Yahoo far better
// than throttling individual IPs.
export async function GET() {
  try {
    const data = await cached('market', 30_000, loadMarket)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
    })
  } catch {
    const stale = cachedStale<Awaited<ReturnType<typeof loadMarket>>>('market')
    if (stale) return NextResponse.json(stale)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
