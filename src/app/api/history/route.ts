import { NextRequest, NextResponse } from 'next/server'
import { getEod } from '@/lib/marketstack'

// GET /api/history?symbol=AAPL&from=2024-01-01&to=2025-01-01&limit=365
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const symbol = searchParams.get('symbol')
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined
  const limit = Number(searchParams.get('limit') ?? 365)

  if (!symbol) {
    return NextResponse.json({ error: 'symbol param required' }, { status: 400 })
  }

  try {
    const data = await getEod(symbol, {
      date_from: from,
      date_to: to,
      limit: Math.min(limit, 1000),
    })
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err: unknown) {
        return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
