import { NextResponse } from 'next/server'
import { ALL_SYMBOLS } from '@/lib/stock-universe'

const MS_KEY = process.env.MARKETSTACK_API_KEY!
const BASE   = 'https://api.marketstack.com/v1'

const EXTRA_DIV = [
  'IBM','MMM','T','VZ','MO','PM','KHC','GIS','CL',
  'O','WPC','STAG','LTC','MAIN','ARCC',
  'EPD','ET','MPLX','KMI','WMB',
  'BX','KKR','APO',
  'BTI','AGNC','NLY',
  'PEG','FE','PPL',
  'CINF','AFL','MET','PRU',
]

const DIV_STOCKS = [...new Set([...ALL_SYMBOLS, ...EXTRA_DIV])]

interface DivEvent { symbol: string; exDate: string; payDate: string; amount: number }

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

async function fetchBatch(symbols: string[], dateFrom: string, dateTo: string): Promise<DivEvent[]> {
  const url = new URL(`${BASE}/dividends`)
  url.searchParams.set('access_key', MS_KEY)
  url.searchParams.set('symbols',    symbols.join(','))
  url.searchParams.set('date_from',  dateFrom)
  url.searchParams.set('date_to',    dateTo)
  url.searchParams.set('limit',      '1000')

  const res  = await fetch(url.toString())
  if (!res.ok) return []
  const json = await res.json() as { data?: Array<{ symbol: string; date: string; dividend: number }> }

  return (json.data ?? []).map(d => {
    const ex  = d.date.split('T')[0]
    const pay = new Date(ex + 'T12:00:00')
    pay.setDate(pay.getDate() + 14)
    return { symbol: d.symbol, exDate: ex, payDate: pay.toISOString().split('T')[0], amount: d.dividend }
  })
}

export async function GET() {
  try {
    const today    = new Date().toISOString().split('T')[0]
    const future   = new Date()
    future.setDate(future.getDate() + 60)
    const dateTo   = future.toISOString().split('T')[0]

    // Batch into groups of 50 to avoid URL length limits
    const batches  = chunk(DIV_STOCKS, 50)
    const results  = await Promise.allSettled(batches.map(b => fetchBatch(b, today, dateTo)))

    const events: DivEvent[] = results
      .filter((r): r is PromiseFulfilledResult<DivEvent[]> => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .sort((a, b) => a.exDate.localeCompare(b.exDate))

    return NextResponse.json(events, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=300' },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
