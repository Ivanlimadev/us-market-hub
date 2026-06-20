import { NextRequest, NextResponse } from 'next/server'
import { getYFChart } from '@/lib/yahoo-finance'
import { rateLimit, getIp } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  if (!rateLimit(getIp(req), 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const symbol = req.nextUrl.searchParams.get('symbol')
  const range  = req.nextUrl.searchParams.get('range') ?? '2y'

  if (!symbol) {
    return NextResponse.json({ error: 'symbol required' }, { status: 400 })
  }

  try {
    const bars = await getYFChart(symbol.toUpperCase(), range, '1d')
    return NextResponse.json(bars, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=300' },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
