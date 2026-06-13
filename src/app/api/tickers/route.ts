import { NextRequest, NextResponse } from 'next/server'
import { getTickers } from '@/lib/marketstack'

// GET /api/tickers?search=apple&exchange=XNAS&limit=20
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const search = searchParams.get('search') ?? undefined
  const exchange = searchParams.get('exchange') ?? undefined
  const limit = Number(searchParams.get('limit') ?? 20)

  try {
    const data = await getTickers(search, {
      exchange,
      limit: Math.min(limit, 1000),
    })
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=600' },
    })
  } catch (err: unknown) {
        return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
