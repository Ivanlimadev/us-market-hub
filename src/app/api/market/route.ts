import { NextResponse } from 'next/server'
import { getLatestEod } from '@/lib/marketstack'

// US market indices — suffix .INDX required by Marketstack
const US_INDICES = ['DJI.INDX', 'IXIC.INDX', 'RUT.INDX', 'VIX.INDX']

// Major US blue chips — XNAS/XNYS exchange ensures US-only
const BLUE_CHIPS = [
  'AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN',
  'META', 'TSLA', 'JPM', 'V', 'UNH',
]

// GET /api/market — homepage market overview
export async function GET() {
  try {
    const [indicesRes, blueChipsRes] = await Promise.all([
      getLatestEod(US_INDICES).catch(() => null),
      getLatestEod(BLUE_CHIPS),
    ])

    return NextResponse.json(
      {
        indices: indicesRes?.data ?? [],
        blueChips: blueChipsRes.data,
      },
      {
        headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
      }
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
