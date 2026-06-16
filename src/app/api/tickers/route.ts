import { NextRequest, NextResponse } from 'next/server'
import { getTickers } from '@/lib/marketstack'
import { searchSchema, limitSchema } from '@/lib/validate'

// GET /api/tickers?search=apple&exchange=XNAS&limit=20
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const search   = searchSchema.safeParse(searchParams.get('search') ?? undefined).data
  const exchange = searchParams.get('exchange')?.slice(0, 10) ?? undefined
  const limit    = limitSchema.catch(20).parse(searchParams.get('limit') ?? undefined)

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
