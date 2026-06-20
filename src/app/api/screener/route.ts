import { NextRequest, NextResponse } from 'next/server'
import { getYFBatchQuotes } from '@/lib/yahoo-finance'
import { ALL_SYMBOLS, getSector } from '@/lib/stock-universe'
import { rateLimit, getIp } from '@/lib/rate-limit'

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export async function GET(req: NextRequest) {
  // Screener fetches 100+ symbols — strict limit to avoid Yahoo IP ban
  if (!rateLimit(getIp(req), 5, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  try {
    const chunks = chunk(ALL_SYMBOLS, 50)
    const results = await Promise.all(chunks.map((c) => getYFBatchQuotes(c)))
    const quotes = results.flat().map((q) => ({
      ...q,
      // Fall back to our universe mapping if YF doesn't return sector
      sector: q.sector ?? getSector(q.symbol),
    }))
    return NextResponse.json(quotes, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=300' },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
