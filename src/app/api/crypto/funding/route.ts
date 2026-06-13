import { NextResponse } from 'next/server'

export interface FundingRateItem {
  symbol: string
  instId: string
  rate: number        // decimal per 8h, e.g. 0.0001
  ratePct: number     // rate * 100, e.g. 0.01
  annualPct: number   // rate * 3 * 365 * 100
  nextFunding: number // unix ms
}

const COINS = [
  'BTC','ETH','SOL','BNB','XRP','DOGE',
  'ADA','AVAX','LINK','TON','SUI','PEPE',
]

let cache: { data: FundingRateItem[]; ts: number } | null = null
const TTL = 5 * 60_000

async function fetchOne(symbol: string): Promise<FundingRateItem | null> {
  const instId = `${symbol}-USDT-SWAP`
  try {
    const res = await fetch(
      `https://www.okx.com/api/v5/public/funding-rate?instId=${instId}`,
      { next: { revalidate: 300 } },
    )
    if (!res.ok) return null
    const json = await res.json()
    const d = json.data?.[0]
    if (!d) return null
    const rate = parseFloat(d.fundingRate) || 0
    return {
      symbol,
      instId,
      rate,
      ratePct:   rate * 100,
      annualPct: rate * 3 * 365 * 100,
      nextFunding: parseInt(d.nextFundingTime) || 0,
    }
  } catch {
    return null
  }
}

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data)
  }

  const results = await Promise.allSettled(COINS.map(fetchOne))
  const data: FundingRateItem[] = results
    .filter((r): r is PromiseFulfilledResult<FundingRateItem> =>
      r.status === 'fulfilled' && r.value !== null,
    )
    .map(r => r.value)

  if (data.length > 0) cache = { data, ts: Date.now() }
  else if (cache) return NextResponse.json(cache.data)

  return NextResponse.json(data)
}
