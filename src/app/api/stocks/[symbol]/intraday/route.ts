import { NextRequest, NextResponse } from 'next/server'
import { getYFIntraday } from '@/lib/yahoo-finance'
import { parseSymbol, badRequest } from '@/lib/validate'

// GET /api/stocks/[symbol]/intraday?interval=5min
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  const { symbol: rawSym } = await params
  const { value: sym, error } = parseSymbol(rawSym)
  if (error) return badRequest(error)

  // Accept "5min" (old Marketstack style) or "5m" (YF style)
  const raw = req.nextUrl.searchParams.get('interval') ?? '5m'
  const interval = raw.replace('min', 'm') // "5min" → "5m"

  try {
    const bars = await getYFIntraday(sym, interval)

    return NextResponse.json(
      { bars, count: bars.length },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' } }
    )
  } catch (err) {
        return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
