import { NextRequest, NextResponse } from 'next/server'
import { getIntraday } from '@/lib/marketstack'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { parseSymbol, badRequest } from '@/lib/validate'

// GET /api/intraday?symbol=AAPL&interval=5min&from=2025-06-11T09:30:00&limit=100
export async function GET(req: NextRequest) {
  if (!rateLimit(getIp(req), 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = req.nextUrl
  const symParsed = parseSymbol(searchParams.get('symbol'))
  if (!symParsed.ok) return badRequest(symParsed.error)
  const symbol = symParsed.value
  const interval = (searchParams.get('interval') ?? '5min') as '1min' | '5min' | '10min' | '15min' | '30min' | '1hour'
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined
  const limit = Number(searchParams.get('limit') ?? 100)

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
        return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
