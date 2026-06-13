import { NextRequest, NextResponse } from 'next/server'
import { getLatestEod, getLatestIntraday } from '@/lib/marketstack'

const TICKER_RE = /^[A-Z0-9.\-]{1,10}$/
const VALID_INTERVALS = new Set(['1min', '5min', '10min', '15min', '30min', '1hour'])

// GET /api/quotes?symbols=AAPL,MSFT,NVDA&type=eod|intraday
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const raw      = searchParams.get('symbols') ?? ''
  const type     = searchParams.get('type') === 'eod' ? 'eod' : 'intraday'
  const interval = VALID_INTERVALS.has(searchParams.get('interval') ?? '')
    ? (searchParams.get('interval') as '1min' | '5min' | '10min')
    : '5min'

  const symbols = raw.split(',').map(s => s.trim().toUpperCase()).filter(s => TICKER_RE.test(s))

  if (!symbols.length) {
    return NextResponse.json({ error: 'symbols param required' }, { status: 400 })
  }

  try {
    if (type === 'intraday') {
      const data = await getLatestIntraday(symbols, interval)
      return NextResponse.json(data, {
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
      })
    }

    const data = await getLatestEod(symbols)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 502 })
  }
}
