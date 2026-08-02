import { NextResponse } from 'next/server'

interface DLProtocol {
  name: string
  tvl: number
  change_1d: number | null
  change_7d: number | null
  logo: string
  category: string
  chains: string[]
}
interface DLChain { name: string; tvl: number }

export interface DefiTVLData {
  totalTvl: number
  change1d: number
  protocols: { name: string; tvl: number; change1d: number; logo: string; category: string }[]
  chains: { name: string; tvl: number; share: number }[]
}

let cache: { data: DefiTVLData; ts: number } | null = null
const TTL = 15 * 60_000

export async function GET() {
  try {
    if (cache && Date.now() - cache.ts < TTL) {
      return NextResponse.json(cache.data)
    }

    const [protoRes, chainRes] = await Promise.all([
      fetch('https://api.llama.fi/protocols', { next: { revalidate: 900 } }),
      fetch('https://api.llama.fi/v2/chains',  { next: { revalidate: 900 } }),
    ])

    if (!protoRes.ok || !chainRes.ok) throw new Error('DefiLlama error')

    const protocols: DLProtocol[] = await protoRes.json()
    const chains:   DLChain[]    = await chainRes.json()

    // Top 8 DeFi protocols - exclude CEX and bridge aggregators
    const EXCLUDE_CATEGORIES = new Set(['CEX', 'Bridge Aggregator', 'Uncollateralized Lending'])
    const top8 = protocols
      .filter(p => p.tvl > 1e6 && !EXCLUDE_CATEGORIES.has(p.category))
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 8)
      .map(p => ({
        name:     p.name,
        tvl:      p.tvl,
        change1d: p.change_1d ?? 0,
        logo:     p.logo ?? '',
        category: p.category ?? 'DeFi',
      }))

    // Total TVL = sum of all chains (per-chain dedup)
    const totalTvl = chains.reduce((s, c) => s + (c.tvl || 0), 0)

    // Weighted 1d change from top 20 protocols
    const top20 = protocols.filter(p => p.tvl > 1e8).slice(0, 20)
    const totalTop20 = top20.reduce((s, p) => s + p.tvl, 0)
    const change1d = totalTop20 > 0
      ? top20.reduce((s, p) => s + (p.change_1d ?? 0) * (p.tvl / totalTop20), 0)
      : 0

    // Top 6 chains
    const sortedChains = [...chains].sort((a, b) => b.tvl - a.tvl).slice(0, 6)
    const maxChainTvl = sortedChains[0]?.tvl || 1
    const topChains = sortedChains.map(c => ({
      name:  c.name,
      tvl:   c.tvl,
      share: (c.tvl / maxChainTvl) * 100,
    }))

    const data: DefiTVLData = { totalTvl, change1d, protocols: top8, chains: topChains }
    if (totalTvl > 0) cache = { data, ts: Date.now() }

    return NextResponse.json(data)
  } catch (err) {
    if (cache) return NextResponse.json(cache.data)
    return NextResponse.json({ error: 'Service unavailable' }, { status: 502 })
  }
}
