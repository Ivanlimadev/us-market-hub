import { NextResponse } from 'next/server'
import { cgFetch } from '@/lib/coingecko'

interface TrendingItem {
  item: {
    id: string; name: string; symbol: string; market_cap_rank: number
    thumb: string; large: string
    data: {
      price: number
      price_change_percentage_24h: { usd?: number }
      market_cap: string
      total_volume: string
      sparkline: string
    }
  }
}

export async function GET() {
  try {
    const raw = await cgFetch<{ coins: TrendingItem[] }>('/search/trending', 10 * 60_000)
    const coins = raw.coins.slice(0, 10).map(({ item: i }) => ({
      id:            i.id,
      name:          i.name,
      symbol:        i.symbol,
      market_cap_rank: i.market_cap_rank,
      image:         i.large || i.thumb,
      price:         i.data?.price ?? 0,
      price_change_percentage_24h: i.data?.price_change_percentage_24h?.usd ?? 0,
      market_cap:    i.data?.market_cap ?? '',
      total_volume:  i.data?.total_volume ?? '',
      sparkline:     i.data?.sparkline ?? '',
    }))
    return NextResponse.json(coins, {
      headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=600' },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }
}
