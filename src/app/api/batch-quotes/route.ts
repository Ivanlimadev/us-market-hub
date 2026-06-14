import { NextRequest, NextResponse } from 'next/server'
import { getYFBatchQuotes } from '@/lib/yahoo-finance'

const TICKER_RE = /^\^?[A-Z0-9.\-]{1,10}$/

// GET /api/batch-quotes?symbols=AAPL,MSFT,NVDA
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('symbols') ?? ''
  const symbols = raw.split(',').map(s => s.trim().toUpperCase()).filter(s => TICKER_RE.test(s)).slice(0, 50)

  if (!symbols.length) {
    return NextResponse.json({ error: 'symbols param required' }, { status: 400 })
  }

  try {
    const quotes = await getYFBatchQuotes(symbols)
    return NextResponse.json(quotes, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 502 })
  }
}
