import { NextRequest, NextResponse } from 'next/server'
import { getYFBatchQuotes } from '@/lib/yahoo-finance'
import { rateLimit, getIp } from '@/lib/rate-limit'

// US market indices — Yahoo Finance format
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

// GET /api/market — homepage market overview
export async function GET(req: NextRequest) {
  if (!rateLimit(getIp(req), 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  try {
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

    return NextResponse.json(
      { indices, blueChips },
      { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' } }
    )
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
