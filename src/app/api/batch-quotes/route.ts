import { NextRequest, NextResponse } from 'next/server'
import { getYFBatchQuotes } from '@/lib/yahoo-finance'

// GET /api/batch-quotes?symbols=AAPL,MSFT,NVDA
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('symbols') ?? ''
  const symbols = raw.split(',').map(s => s.trim()).filter(Boolean)

  if (!symbols.length) {
    return NextResponse.json({ error: 'symbols param required' }, { status: 400 })
  }

  try {
    const quotes = await getYFBatchQuotes(symbols)
    return NextResponse.json(quotes, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
