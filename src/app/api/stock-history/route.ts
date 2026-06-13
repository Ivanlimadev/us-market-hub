import { NextRequest, NextResponse } from 'next/server'
import { getYFChart } from '@/lib/yahoo-finance'

export async function GET(req: NextRequest) {
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
