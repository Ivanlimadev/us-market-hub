import { NextRequest, NextResponse } from 'next/server'
import { getYFBatchQuotes, type YFBatchQuote } from '@/lib/yahoo-finance'
import { cached, cachedStale } from '@/lib/server-cache'
import { rateLimit, getIp } from '@/lib/rate-limit'

const TICKER_RE = /^\^?[A-Z0-9.\-]{1,10}$/

// GET /api/batch-quotes?symbols=AAPL,MSFT,NVDA
export async function GET(req: NextRequest) {
  // 20 batch calls/min per IP — each call can fetch up to 50 symbols
  if (!rateLimit(getIp(req), 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const raw = req.nextUrl.searchParams.get('symbols') ?? ''
  const symbols = raw.split(',').map(s => s.trim().toUpperCase()).filter(s => TICKER_RE.test(s)).slice(0, 50)

  if (!symbols.length) {
    return NextResponse.json({ error: 'symbols param required' }, { status: 400 })
  }

  // Cache key is the normalized symbol set so different orderings share an entry.
  const key = `batch:${[...symbols].sort().join(',')}`

  try {
    const quotes = await cached(key, 60_000, () => getYFBatchQuotes(symbols))
    return NextResponse.json(quotes, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch {
    const stale = cachedStale<YFBatchQuote[]>(key)
    if (stale) return NextResponse.json(stale)
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 502 })
  }
}
