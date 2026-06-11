import { NextRequest, NextResponse } from 'next/server'
import { getYFChart } from '@/lib/yahoo-finance'

// Map our period labels → Yahoo Finance range + interval
const PERIOD_MAP: Record<string, { range: string; interval: string }> = {
  '1d':  { range: '5d',   interval: '1d' },
  '1w':  { range: '5d',   interval: '1d' },
  '1m':  { range: '1mo',  interval: '1d' },
  '3m':  { range: '3mo',  interval: '1d' },
  '6m':  { range: '6mo',  interval: '1d' },
  'ytd': { range: 'ytd',  interval: '1d' },
  '1y':  { range: '1y',   interval: '1d' },
  '2y':  { range: '2y',   interval: '1d' },
  '5y':  { range: '5y',   interval: '1d' },
  '10y': { range: '10y',  interval: '1d' },
  '15y': { range: 'max',  interval: '1d' }, // returns monthly for full history — correct adj prices
}

// GET /api/stocks/[symbol]/history?period=1y
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const sym = symbol.toUpperCase()
  const period = req.nextUrl.searchParams.get('period') ?? '1y'
  const { range, interval } = PERIOD_MAP[period] ?? PERIOD_MAP['1y']

  try {
    const bars = await getYFChart(sym, range, interval)

    return NextResponse.json(
      { period, bars, count: bars.length },
      { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' } }
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
