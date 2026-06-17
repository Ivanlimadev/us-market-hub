import { NextResponse } from 'next/server'
import { getYFDividendCalendar, type YFDivEvent } from '@/lib/yahoo-finance'
import { ALL_SYMBOLS } from '@/lib/stock-universe'

// High-yield / income-focused symbols not already in the screener universe
const EXTRA_DIV = [
  'IBM','MMM','T','VZ','MO','PM','KHC','GIS','CL',
  'O','WPC','STAG','LTC','MAIN','ARCC',
  'EPD','ET','MPLX','KMI','WMB',
  'BX','KKR','APO','BTI','AGNC','NLY',
  'PEG','FE','PPL','CINF','AFL','MET','PRU',
]

const DIV_STOCKS = [...new Set([...ALL_SYMBOLS, ...EXTRA_DIV])]

// In-memory cache — 3 hours (dividend calendars don't change frequently)
let cache: { data: YFDivEvent[]; ts: number } | null = null
const CACHE_TTL = 3 * 60 * 60 * 1000

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data, {
        headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=300' },
      })
    }

    // YF batch quotes accept ~100 symbols per request safely
    const batches = chunk(DIV_STOCKS, 100)
    const results = await Promise.allSettled(batches.map((b) => getYFDividendCalendar(b)))

    const events: YFDivEvent[] = results
      .filter((r): r is PromiseFulfilledResult<YFDivEvent[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value)
      // dedupe by symbol (keep earliest ex-date per symbol)
      .reduce<YFDivEvent[]>((acc, ev) => {
        if (!acc.find((e) => e.symbol === ev.symbol)) acc.push(ev)
        return acc
      }, [])
      .sort((a, b) => a.exDate.localeCompare(b.exDate))

    if (events.length > 0) cache = { data: events, ts: Date.now() }

    return NextResponse.json(events, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=300' },
    })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
