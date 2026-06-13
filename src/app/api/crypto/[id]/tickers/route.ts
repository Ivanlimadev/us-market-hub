import { NextRequest, NextResponse } from 'next/server'
import { cgFetch } from '@/lib/coingecko'

interface RawTicker {
  base: string
  target: string
  market: { name: string; identifier: string; logo?: string }
  last: number
  converted_volume: { usd?: number }
  trust_score: 'green' | 'yellow' | 'red' | null
  is_anomaly: boolean
  is_stale: boolean
  trade_url: string | null
}

export interface ExchangeTicker {
  exchange: string
  identifier: string
  logo: string
  target: string
  price: number
  volume24h: number
  trustScore: 'green' | 'yellow' | 'red'
  tradeUrl: string | null
}

const STABLE_TARGETS = new Set(['USD', 'USDT', 'USDC', 'BUSD', 'DAI', 'FDUSD', 'TUSD', 'USDD', 'PYUSD'])
const TRUST_ORDER: Record<string, number> = { green: 3, yellow: 2, red: 1 }

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  try {
    const raw = await cgFetch<{ tickers: RawTicker[] }>(
      `/coins/${id}/tickers?per_page=100&page=1`,
      10 * 60_000,
    )

    const tickers: ExchangeTicker[] = (raw.tickers ?? [])
      .filter(t =>
        STABLE_TARGETS.has(t.target) &&
        !t.is_anomaly &&
        !t.is_stale &&
        (t.converted_volume.usd ?? 0) > 10_000,
      )
      .sort((a, b) => {
        const diff = (TRUST_ORDER[b.trust_score ?? 'red'] ?? 0) - (TRUST_ORDER[a.trust_score ?? 'red'] ?? 0)
        if (diff !== 0) return diff
        return (b.converted_volume.usd ?? 0) - (a.converted_volume.usd ?? 0)
      })
      .slice(0, 8)
      .map(t => ({
        exchange:   t.market.name,
        identifier: t.market.identifier,
        logo:       t.market.logo ?? '',
        target:     t.target,
        price:      t.last,
        volume24h:  t.converted_volume.usd ?? 0,
        trustScore: t.trust_score ?? 'red',
        tradeUrl:   t.trade_url,
      }))

    return NextResponse.json(tickers)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
