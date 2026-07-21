import { NextRequest, NextResponse } from 'next/server'
import { getDividends } from '@/lib/marketstack'
import { rateLimit, getIp } from '@/lib/rate-limit'
import { parseSymbol, badRequest } from '@/lib/validate'

// GET /api/dividends?symbol=AAPL&limit=20
export async function GET(req: NextRequest) {
  if (!rateLimit(getIp(req), 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { searchParams } = req.nextUrl
  const symRaw = searchParams.get('symbol')
  const symParsed = parseSymbol(symRaw)
  if (!symParsed.ok) return badRequest(symParsed.error)
  const symbol = symParsed.value
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined
  const limit = Number(searchParams.get('limit') ?? 20)

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
        return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
