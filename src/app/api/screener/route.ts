import { NextResponse } from 'next/server'
import { getYFBatchQuotes } from '@/lib/yahoo-finance'
import { ALL_SYMBOLS, getSector } from '@/lib/stock-universe'

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function loadQuotes() {
  const chunks = chunk(ALL_SYMBOLS, 50)
  const results = await Promise.all(chunks.map((c) => getYFBatchQuotes(c)))
  return results.flat().map((q) => ({
    ...q,
    // Fall back to our universe mapping if YF doesn't return sector
    sector: q.sector ?? getSector(q.symbol),
  }))
}

// Screener fetches 100+ symbols from Yahoo — expensive and risky to hammer.
// A per-IP rate limit didn't help: the homepage Rankings widget AND the
// /screener page both hit this, so a single visitor tripped the limit and got
// a 429 body that crashed the client. Instead, cache the computed list
// process-wide (PM2 runs a single instance) and dedupe concurrent refreshes
// (single-flight) so Yahoo is hit at most once per TTL regardless of traffic.
// The entry is kept past expiry as a stale fallback when a refresh fails.
type Quote = Awaited<ReturnType<typeof loadQuotes>>[number]
const TTL = 60_000
let cache: { data: Quote[]; expires: number } | null = null
let inflight: Promise<Quote[]> | null = null

async function getQuotes(): Promise<Quote[]> {
  if (cache && Date.now() < cache.expires) return cache.data // fresh

  if (!inflight) {
    inflight = loadQuotes()
      .then((data) => { cache = { data, expires: Date.now() + TTL }; return data })
      .finally(() => { inflight = null })
  }

  // Stale-while-revalidate: if we have (stale) data, serve it now and let the
  // refresh finish in the background; only a cold start has to wait.
  if (cache) {
    inflight.catch(() => {}) // don't leave the background refresh unhandled
    return cache.data
  }
  return inflight
}

export async function GET() {
  try {
    const data = await getQuotes()
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=300' },
    })
  } catch {
    if (cache) return NextResponse.json(cache.data) // stale fallback on error
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
