import type { CryptoMarket, CryptoGlobal, CryptoDetail, CryptoHistoryBar } from '@/types/crypto'

const BASE = 'https://api.coingecko.com/api/v3'

// Simple in-memory cache to respect CoinGecko's 30 req/min free limit
const cache = new Map<string, { data: unknown; expires: number }>()

export async function cgFetch<T>(path: string, ttlMs = 60_000): Promise<T> {
  const cached = cache.get(path)
  if (cached && Date.now() < cached.expires) return cached.data as T

  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Accept': 'application/json' },
    next: { revalidate: Math.floor(ttlMs / 1000) },
  })

  if (!res.ok) throw new Error(`CoinGecko ${res.status}: ${path}`)

  const data = await res.json() as T
  cache.set(path, { data, expires: Date.now() + ttlMs })
  return data
}

export async function cgMarkets(perPage = 100): Promise<CryptoMarket[]> {
  const params = new URLSearchParams({
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: String(perPage),
    page: '1',
    sparkline: 'false',
    price_change_percentage: '1h,24h,7d,30d,1y',
    locale: 'en',
  })
  return cgFetch<CryptoMarket[]>(`/coins/markets?${params}`, 60_000)
}

export async function cgGlobal(): Promise<CryptoGlobal> {
  const raw = await cgFetch<{
    data: {
      active_cryptocurrencies: number
      markets: number
      total_market_cap: Record<string, number>
      total_volume: Record<string, number>
      market_cap_change_percentage_24h_usd: number
      market_cap_percentage: Record<string, number>
    }
  }>('/global', 5 * 60_000)

  const d = raw.data
  return {
    active_cryptocurrencies: d.active_cryptocurrencies,
    markets: d.markets,
    total_market_cap_usd: d.total_market_cap.usd ?? 0,
    total_volume_usd: d.total_volume.usd ?? 0,
    market_cap_change_percentage_24h: d.market_cap_change_percentage_24h_usd,
    btc_dominance: d.market_cap_percentage.btc ?? 0,
    eth_dominance: d.market_cap_percentage.eth ?? 0,
  }
}

export async function cgCoin(id: string): Promise<CryptoDetail> {
  const raw = await cgFetch<{
    id: string; symbol: string; name: string
    image: { thumb: string; small: string; large: string }
    description: { en: string }
    categories: string[]
    links: { homepage: string[] }
    market_data: {
      current_price: Record<string, number>
      market_cap: Record<string, number>
      market_cap_rank: number
      total_volume: Record<string, number>
      high_24h: Record<string, number>
      low_24h: Record<string, number>
      price_change_24h: number
      price_change_percentage_24h: number
      price_change_percentage_7d: number
      price_change_percentage_14d: number
      price_change_percentage_30d: number
      price_change_percentage_60d: number
      price_change_percentage_1y: number
      circulating_supply: number
      total_supply: number | null
      max_supply: number | null
      ath: Record<string, number>
      ath_change_percentage: Record<string, number>
      ath_date: Record<string, string>
      atl: Record<string, number>
      atl_change_percentage: Record<string, number>
      atl_date: Record<string, string>
    }
  }>(`/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`, 60_000)

  const md = raw.market_data
  return {
    id: raw.id,
    symbol: raw.symbol,
    name: raw.name,
    image: raw.image,
    description: raw.description?.en ?? '',
    categories: raw.categories ?? [],
    homepage: raw.links?.homepage?.[0] ?? '',
    market_data: {
      current_price: md.current_price.usd ?? 0,
      market_cap: md.market_cap.usd ?? 0,
      market_cap_rank: md.market_cap_rank,
      total_volume: md.total_volume.usd ?? 0,
      high_24h: md.high_24h.usd ?? 0,
      low_24h: md.low_24h.usd ?? 0,
      price_change_24h: md.price_change_24h,
      price_change_percentage_24h: md.price_change_percentage_24h,
      price_change_percentage_7d: md.price_change_percentage_7d,
      price_change_percentage_14d: md.price_change_percentage_14d,
      price_change_percentage_30d: md.price_change_percentage_30d,
      price_change_percentage_60d: md.price_change_percentage_60d,
      price_change_percentage_1y: md.price_change_percentage_1y,
      circulating_supply: md.circulating_supply,
      total_supply: md.total_supply,
      max_supply: md.max_supply,
      ath: md.ath.usd ?? 0,
      ath_change_percentage: md.ath_change_percentage.usd ?? 0,
      ath_date: md.ath_date.usd ?? '',
      atl: md.atl.usd ?? 0,
      atl_change_percentage: md.atl_change_percentage.usd ?? 0,
      atl_date: md.atl_date.usd ?? '',
    },
  }
}

export async function cgHistory(id: string, days: number): Promise<CryptoHistoryBar[]> {
  const interval = days <= 1 ? 'minutely' : days <= 90 ? 'hourly' : 'daily'
  const raw = await cgFetch<{ prices: [number, number][]; total_volumes: [number, number][] }>(
    `/coins/${id}/market_chart?vs_currency=usd&days=${days}&interval=${interval}`,
    60_000,
  )

  const volMap = new Map((raw.total_volumes ?? []).map(([t, v]) => [t, v]))
  return (raw.prices ?? []).map(([t, price]) => ({
    time: Math.floor(t / 1000),
    price,
    volume: volMap.get(t) ?? 0,
  }))
}
