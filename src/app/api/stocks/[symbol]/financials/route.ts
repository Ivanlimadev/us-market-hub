import { NextRequest, NextResponse } from 'next/server'
import { getYFFinancials } from '@/lib/yahoo-finance'
import { parseSymbol, badRequest } from '@/lib/validate'
import { rateLimit, getIp } from '@/lib/rate-limit'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  if (!rateLimit(getIp(req), 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { symbol: raw } = await params
  const r = parseSymbol(raw)
  if (!r.ok) return badRequest(r.error)
  const symbol = r.value
  try {
    const data = await getYFFinancials(symbol)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=600' },
    })
  } catch (err) {
        return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
