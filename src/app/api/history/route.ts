import { NextRequest, NextResponse } from 'next/server'
import { getEod } from '@/lib/marketstack'
import { parseSymbol, badRequest, dateSchema, limitSchema } from '@/lib/validate'

// GET /api/history?symbol=AAPL&from=2024-01-01&to=2025-01-01&limit=365
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const r = parseSymbol(searchParams.get('symbol'))
  if (!r.ok) return badRequest(r.error)
  const symbol = r.value

  const fromParsed = dateSchema.safeParse(searchParams.get('from') ?? undefined)
  const toParsed   = dateSchema.safeParse(searchParams.get('to') ?? undefined)
  const limitParsed = limitSchema.safeParse(searchParams.get('limit') ?? undefined)

  if (!fromParsed.success) return badRequest('Invalid from date (YYYY-MM-DD)')
  if (!toParsed.success)   return badRequest('Invalid to date (YYYY-MM-DD)')

  const from  = fromParsed.data
  const to    = toParsed.data
  const limit = limitParsed.success ? limitParsed.data : 365

  try {
    const data = await getEod(symbol, {
      date_from: from,
      date_to: to,
      limit,
    })
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err: unknown) {
        return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
