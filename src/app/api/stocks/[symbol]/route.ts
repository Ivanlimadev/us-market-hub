import { NextRequest, NextResponse } from 'next/server'
import { fetchStockData } from '@/lib/stock-server'
import { parseSymbol, badRequest } from '@/lib/validate'
import { rateLimit, getIp } from '@/lib/rate-limit'

// GET /api/stocks/[symbol]
// Returns: quote, info (YF), history (MS), dividends (MS), splits (MS)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  // 60 requests/min per IP — protects YF and Marketstack quota
  if (!rateLimit(getIp(req), 60, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const { symbol: raw } = await params
  const r = parseSymbol(raw)
  if (!r.ok) return badRequest(r.error)
  const symbol = r.value

  const data = await fetchStockData(symbol)

  if (!data) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
  })
}
