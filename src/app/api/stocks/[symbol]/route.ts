import { NextRequest, NextResponse } from 'next/server'
import { fetchStockData } from '@/lib/stock-server'
import { parseSymbol, badRequest } from '@/lib/validate'

// GET /api/stocks/[symbol]
// Returns: quote, info (YF), history (MS), dividends (MS), splits (MS)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: raw } = await params
  const r = parseSymbol(raw)
  if (!r.ok) return badRequest(r.error)
  const symbol = r.value

  const data = await fetchStockData(symbol)

  if (!data) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  })
}
