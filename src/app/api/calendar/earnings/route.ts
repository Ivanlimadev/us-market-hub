import { NextResponse } from 'next/server'
import { getYFBatchQuotes } from '@/lib/yahoo-finance'
import { ALL_SYMBOLS } from '@/lib/stock-universe'
import { cached, cachedStale } from '@/lib/server-cache'

const EXTRA = [
  'IBM','MMM','GE','F','GM','BA','T','VZ','MO','PM',
  'BRK-B','JPM','BAC','WFC','C','GS','MS','AXP','BLK',
  'TSLA','AMZN','GOOGL','META','NFLX','ORCL','CRM','ADBE',
]

const EARNINGS_STOCKS = [...new Set([...ALL_SYMBOLS, ...EXTRA])]

// Determine bmo/amc from Unix timestamp using US Eastern time
// Eastern is UTC-4 (EDT, summer) / UTC-5 (EST, winter)
function callTime(ts: number | null): 'bmo' | 'amc' | null {
  if (!ts) return null
  // June = EDT (UTC-4)
  const d = new Date(ts * 1000)
  const utcHour = d.getUTCHours()
  if (utcHour < 13) return 'bmo'   // before ~9am ET
  if (utcHour >= 19) return 'amc'  // after ~3pm ET
  return null
}

// Batch getYFBatchQuotes in chunks of 200 to stay within URL limits
function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

async function loadEarnings() {
  // Batch quotes don't include earnings dates - they only have summary info (eps, pe).
  // This endpoint would need to make individual getYFSummary calls for each symbol
  // to get earningsTimestamp data, but that's expensive (~150 calls).
  // For now, return empty until we add a dedicated earnings endpoint.
  return []
}

// Scans ~150 symbols on Yahoo - by far the heaviest endpoint. The earnings
// window changes slowly, so cache the computed list process-wide for 10 min
// (single-flight) instead of re-scanning on every request.
export async function GET() {
  try {
    const events = await cached('earnings', 600_000, loadEarnings)
    return NextResponse.json(events, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=300' },
    })
  } catch {
    const stale = cachedStale<Awaited<ReturnType<typeof loadEarnings>>>('earnings')
    if (stale) return NextResponse.json(stale)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
