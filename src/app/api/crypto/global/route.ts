import { NextRequest, NextResponse } from 'next/server'
import { cgGlobal } from '@/lib/coingecko'
import { rateLimit, getIp } from '@/lib/rate-limit'

export async function GET(req: NextRequest) {
  if (!rateLimit(getIp(req), 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  try {
    const data = await cgGlobal()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=600' },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
