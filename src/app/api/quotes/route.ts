import { NextRequest, NextResponse } from 'next/server'
import { getYFBatchQuotes } from '@/lib/yahoo-finance'
import { rateLimit, getIp } from '@/lib/rate-limit'

const TICKER_RE = /^\^?[A-Z0-9.\-]{1,10}$/

// GET /api/quotes?symbols=AAPL,MSFT,NVDA
// Legacy endpoint, now backed by Yahoo Finance (was Marketstack). Returns the
// current quote for each symbol as { data: YFBatchQuote[] }.
export async function GET(req: NextRequest) {
  if (!rateLimit(getIp(req), 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const raw = req.nextUrl.searchParams.get('symbols') ?? ''
  const symbols = raw.split(',').map(s => s.trim().toUpperCase()).filter(s => TICKER_RE.test(s))

  if (!symbols.length) {
    return NextResponse.json({ error: 'symbols param required' }, { status: 400 })
  }

  try {
    const data = await getYFBatchQuotes(symbols)
    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 502 })
  }
}
