import { NextResponse } from 'next/server'
import { getYFBatchQuotes } from '@/lib/yahoo-finance'
import { ALL_SYMBOLS } from '@/lib/stock-universe'

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

export async function GET() {
  try {
    const now   = Math.floor(Date.now() / 1000)
    const cutoff = now + 60 * 24 * 3600  // +60 days

    // Single batch call — orders of magnitude faster than 140 individual v10 requests
    const batches = chunk(EARNINGS_STOCKS, 200)
    const allQuotes = (
      await Promise.all(batches.map(b => getYFBatchQuotes(b)))
    ).flat()

    const events = allQuotes
      .filter(q => {
        const ts = q.earningsTimestamp ?? q.earningsTimestampEnd
        return ts && ts >= now && ts <= cutoff
      })
      .map(q => {
        const ts = q.earningsTimestamp ?? q.earningsTimestampEnd!
        const date = new Date(ts * 1000).toISOString().split('T')[0]
        return {
          symbol:    q.symbol,
          name:      q.name,
          date,
          time:      callTime(q.earningsTimestampEnd ?? q.earningsTimestamp),
          price:     q.price,
          changePct: q.changePct,
          marketCap: q.marketCap,
          eps:       q.eps,
        }
      })
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json(events, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=300' },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
