import { NextRequest, NextResponse } from 'next/server'
import { getYFChart } from '@/lib/yahoo-finance'
import { parseSymbol, badRequest } from '@/lib/validate'
import { rateLimit, getIp } from '@/lib/rate-limit'

// Yahoo chart ranges we allow (kept small and safe).
const VALID_RANGES = new Set(['1mo', '3mo', '6mo', 'ytd', '1y', '2y', '5y', '10y', 'max'])

// GET /api/history?symbol=AAPL&range=1y
// Legacy endpoint, now backed by Yahoo Finance (was Marketstack). Returns
// { bars: YFChartBar[] } with daily open/high/low/close/adj_close/volume.
export async function GET(req: NextRequest) {
  if (!rateLimit(getIp(req), 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = req.nextUrl

  const r = parseSymbol(searchParams.get('symbol'))
  if (!r.ok) return badRequest(r.error)

  const rangeParam = searchParams.get('range') ?? '1y'
  const range = VALID_RANGES.has(rangeParam) ? rangeParam : '1y'

  try {
    const bars = await getYFChart(r.value, range, '1d')
    return NextResponse.json({ bars }, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
