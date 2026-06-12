import { NextRequest, NextResponse } from 'next/server'
import { getDividends } from '@/lib/marketstack'

// GET /api/dividends?symbol=AAPL&limit=20
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const symbol = searchParams.get('symbol')
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined
  const limit = Number(searchParams.get('limit') ?? 20)

  if (!symbol) {
    return NextResponse.json({ error: 'symbol param required' }, { status: 400 })
  }

  try {
    const data = await getDividends(symbol, {
      date_from: from,
      date_to: to,
      limit: Math.min(limit, 1000),
    })
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=600' },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
