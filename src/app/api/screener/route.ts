import { NextResponse } from 'next/server'
import { getYFBatchQuotes } from '@/lib/yahoo-finance'
import { ALL_SYMBOLS, getSector } from '@/lib/stock-universe'

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export async function GET() {
  try {
    const chunks = chunk(ALL_SYMBOLS, 50)
    const results = await Promise.all(chunks.map((c) => getYFBatchQuotes(c)))
    const quotes = results.flat().map((q) => ({
      ...q,
      // Fall back to our universe mapping if YF doesn't return sector
      sector: q.sector ?? getSector(q.symbol),
    }))
    return NextResponse.json(quotes, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
