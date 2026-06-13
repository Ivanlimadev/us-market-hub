import { NextRequest, NextResponse } from 'next/server'
import { cgMarkets } from '@/lib/coingecko'

export async function GET(req: NextRequest) {
  const perPage = Number(req.nextUrl.searchParams.get('limit') ?? 100)

  try {
    const data = await cgMarkets(Math.min(perPage, 250))
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
