import { NextRequest, NextResponse } from 'next/server'
import { fetchStockData } from '@/lib/stock-server'

// GET /api/stocks/[symbol]
// Returns: quote, info (YF), history (MS), dividends (MS), splits (MS)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol } = await params
  const data = await fetchStockData(symbol.toUpperCase())

  if (!data) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
  })
}
