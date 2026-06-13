import { NextRequest, NextResponse } from 'next/server'
import { getIntraday } from '@/lib/marketstack'

// GET /api/intraday?symbol=AAPL&interval=5min&from=2025-06-11T09:30:00&limit=100
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const symbol = searchParams.get('symbol')
  const interval = (searchParams.get('interval') ?? '5min') as '1min' | '5min' | '10min' | '15min' | '30min' | '1hour'
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined
  const limit = Number(searchParams.get('limit') ?? 100)

  if (!symbol) {
    return NextResponse.json({ error: 'symbol param required' }, { status: 400 })
  }

  try {
    const data = await getIntraday(symbol, {
      interval,
      date_from: from,
      date_to: to,
      limit: Math.min(limit, 1000),
    })
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
