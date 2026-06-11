import { NextResponse } from 'next/server'

const MS_KEY = process.env.MARKETSTACK_API_KEY!
const BASE = 'https://api.marketstack.com/v1'

// Top dividend payers to track
const DIV_STOCKS = [
  'AAPL','MSFT','JPM','JNJ','PG','KO','PEP','XOM','CVX','T',
  'VZ','MO','PM','ABT','MRK','PFE','ABBV','TXN','IBM','MMM',
  'HD','LOW','DUK','SO','NEE','D','O','VICI','SPG','AMT',
  'V','MA','BAC','WFC','GS','WMT','COST','CL','GIS','KHC',
  'AMGN','BMY','LLY','UNH','HON','CAT','UPS','RTX','LMT','NOC',
]

interface DivEvent {
  symbol: string
  exDate: string
  payDate: string
  amount: number
}

export async function GET() {
  try {
    const today = new Date()
    const future = new Date(today)
    future.setDate(today.getDate() + 45)

    const dateFrom = today.toISOString().split('T')[0]
    const dateTo   = future.toISOString().split('T')[0]

    const url = new URL(`${BASE}/dividends`)
    url.searchParams.set('access_key', MS_KEY)
    url.searchParams.set('symbols', DIV_STOCKS.join(','))
    url.searchParams.set('date_from', dateFrom)
    url.searchParams.set('date_to', dateTo)
    url.searchParams.set('limit', '200')

    const res  = await fetch(url.toString())
    const json = await res.json() as { data?: Array<{ symbol: string; date: string; dividend: number }> }

    const events: DivEvent[] = (json.data ?? []).map((d) => {
      const ex   = d.date.split('T')[0]
      const pay  = new Date(ex)
      pay.setDate(pay.getDate() + 14)
      return {
        symbol:  d.symbol,
        exDate:  ex,
        payDate: pay.toISOString().split('T')[0],
        amount:  d.dividend,
      }
    }).sort((a, b) => a.exDate.localeCompare(b.exDate))

    return NextResponse.json(events, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=300' },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
