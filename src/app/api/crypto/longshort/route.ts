import { NextResponse } from 'next/server'

export interface LongShortItem {
  symbol:   string
  longPct:  number  // 0-100
  shortPct: number  // 0-100
  ratio:    number  // long/short
}

const COINS = ['BTC','ETH','SOL','BNB','XRP','DOGE','ADA','AVAX','LINK','TON','SUI']

let cache: { data: LongShortItem[]; ts: number } | null = null
const TTL = 5 * 60_000

async function fetchOne(symbol: string): Promise<LongShortItem | null> {
  try {
    const res = await fetch(
      `https://www.okx.com/api/v5/rubik/stat/contracts/long-short-account-ratio-contract?instId=${symbol}-USDT-SWAP&period=5m&limit=1`,
      { next: { revalidate: 300 } },
    )
    if (!res.ok) return null
    const json = await res.json()
    const row = json.data?.[0]
    if (!row) return null
    const ratio   = parseFloat(row[1]) || 0
    const longPct = (ratio / (1 + ratio)) * 100
    return { symbol, longPct, shortPct: 100 - longPct, ratio }
  } catch {
    return null
  }
}

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data)
  }

  const results = await Promise.allSettled(COINS.map(fetchOne))
  const data: LongShortItem[] = results
    .filter((r): r is PromiseFulfilledResult<LongShortItem> =>
      r.status === 'fulfilled' && r.value !== null,
    )
    .map(r => r.value)

  if (data.length > 0) cache = { data, ts: Date.now() }
  else if (cache) return NextResponse.json(cache.data)

  return NextResponse.json(data)
}
