import { NextRequest, NextResponse } from 'next/server'
import { getLatestEod, getLatestIntraday } from '@/lib/marketstack'

// GET /api/quotes?symbols=AAPL,MSFT,NVDA&type=eod|intraday
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const symbols = searchParams.get('symbols')
  const type = (searchParams.get('type') ?? 'intraday') as 'eod' | 'intraday'
  const interval = (searchParams.get('interval') ?? '5min') as '1min' | '5min' | '10min'

  if (!symbols) {
    return NextResponse.json({ error: 'symbols param required' }, { status: 400 })
  }

  try {
    if (type === 'intraday') {
      const data = await getLatestIntraday(symbols.split(','), interval)
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
      })
    }

    const data = await getLatestEod(symbols.split(','))
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
