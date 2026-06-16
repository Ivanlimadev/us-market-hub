import { NextRequest, NextResponse } from 'next/server'
import { getYFFinancials } from '@/lib/yahoo-finance'
import { parseSymbol, badRequest } from '@/lib/validate'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
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
