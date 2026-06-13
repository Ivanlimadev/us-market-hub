import { NextResponse } from 'next/server'
import { getYFBatchQuotes } from '@/lib/yahoo-finance'

// GET /api/trending — Yahoo Finance trending tickers for the US market
export async function GET() {
  try {
    const res = await fetch(
      'https://query2.finance.yahoo.com/v1/finance/trending/US?count=10&useQuotes=true',
      {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
        next: { revalidate: 300 },
      }
    )

    if (!res.ok) throw new Error(`YF trending ${res.status}`)

    const json = await res.json() as {
      finance?: { result?: Array<{ quotes: Array<{ symbol: string }> }> }
    }

    const symbols: string[] = (json.finance?.result?.[0]?.quotes ?? [])
      .map(q => q.symbol)
      .filter(s => !s.includes('=') && !s.includes('^')) // exclude forex/indices
      .slice(0, 10)

    if (!symbols.length) return NextResponse.json([])

    const quotes = await getYFBatchQuotes(symbols)

    return NextResponse.json(quotes, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
