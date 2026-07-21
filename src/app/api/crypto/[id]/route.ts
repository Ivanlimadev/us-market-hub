import { NextRequest, NextResponse } from 'next/server'
import { cgCoin } from '@/lib/coingecko'
import { parseCryptoId, badRequest } from '@/lib/validate'
import { rateLimit, getIp } from '@/lib/rate-limit'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!rateLimit(getIp(req), 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  const { id: raw } = await params
  const r = parseCryptoId(raw)
  if (!r.ok) return badRequest(r.error)
  const id = r.value
  try {
    const data = await cgCoin(id)
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
