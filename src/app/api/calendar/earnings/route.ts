import { NextResponse } from 'next/server'
import { getYFBatchQuotes } from '@/lib/yahoo-finance'
import { ALL_SYMBOLS } from '@/lib/stock-universe'

// Yahoo Finance v7 quote includes nextEarningsDate — we fetch it via batch
// but the batch endpoint doesn't return earningsDate, so we use a different approach:
// fetch calendarEvents per stock in parallel (limited set)

const EARNINGS_STOCKS = ALL_SYMBOLS.slice(0, 60)

async function getEarningsDate(symbol: string): Promise<{ symbol: string; date: string | null; time: string | null } | null> {
  try {
    const res = await fetch(
      `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=calendarEvents`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    if (!res.ok) return null
    const json = await res.json() as {
      quoteSummary?: {
        result?: Array<{
          calendarEvents?: {
            earnings?: { earningsDate?: Array<{ fmt?: string }>; earningsCallTime?: string }
          }
        }>
      }
    }
    const cal = json.quoteSummary?.result?.[0]?.calendarEvents
    const dates = cal?.earnings?.earningsDate ?? []
    const date  = dates[0]?.fmt ?? null
    const time  = (cal?.earnings as { earningsCallTime?: string } | undefined)?.earningsCallTime ?? null
    return { symbol, date, time }
  } catch {
    return null
  }
}

export async function GET() {
  try {
    const results = await Promise.allSettled(
      EARNINGS_STOCKS.map((s) => getEarningsDate(s))
    )

    const today   = new Date().toISOString().split('T')[0]
    const cutoff  = new Date()
    cutoff.setDate(cutoff.getDate() + 45)
    const cutoffStr = cutoff.toISOString().split('T')[0]

    const events = results
      .filter((r): r is PromiseFulfilledResult<{ symbol: string; date: string | null; time: string | null }> =>
        r.status === 'fulfilled' && r.value !== null && r.value.date !== null
      )
      .map((r) => r.value)
      .filter((e) => e.date! >= today && e.date! <= cutoffStr)
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))

    const quotes = await getYFBatchQuotes(events.map((e) => e.symbol))
    const quoteMap = Object.fromEntries(quotes.map((q) => [q.symbol, q]))

    const enriched = events.map((e) => ({
      ...e,
      name: quoteMap[e.symbol]?.name ?? e.symbol,
      price: quoteMap[e.symbol]?.price ?? null,
      changePct: quoteMap[e.symbol]?.changePct ?? null,
      marketCap: quoteMap[e.symbol]?.marketCap ?? null,
      eps: quoteMap[e.symbol]?.eps ?? null,
    }))

    return NextResponse.json(enriched, {
      headers: { 'Cache-Control': 's-maxage=3600, stale-while-revalidate=300' },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
