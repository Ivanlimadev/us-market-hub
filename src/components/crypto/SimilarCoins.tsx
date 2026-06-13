'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { CryptoMarket } from '@/types/crypto'

function fmtPrice(n: number): string {
  if (n >= 1) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (n >= 0.0001) return `$${n.toFixed(4)}`
  return `$${n.toFixed(8)}`
}

export function SimilarCoins({ coinId, marketCap }: { coinId: string; marketCap: number }) {
  const { data: markets } = useQuery<CryptoMarket[]>({
    queryKey: ['crypto-markets'],
    queryFn:  () => fetch('/api/crypto/markets?limit=250').then(r => r.json()),
    staleTime: 60_000,
  })

  if (!markets?.length) return null

  const others = markets.filter(c => c.id !== coinId && c.market_cap > 0)

  // Same market-cap tier (0.1× – 10×); fall back to top by MC if fewer than 4 match
  let similar = others
    .filter(c => c.market_cap <= marketCap * 10 && c.market_cap >= marketCap * 0.1)
    .sort((a, b) => b.market_cap - a.market_cap)
    .slice(0, 8)

  if (similar.length < 4) {
    similar = others.sort((a, b) => b.market_cap - a.market_cap).slice(0, 8)
  }

  if (!similar.length) return null

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">Similar Coins</h3>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {similar.map(c => {
          const chg = c.price_change_percentage_24h ?? 0
          const up  = chg >= 0
          return (
            <Link
              key={c.id}
              href={`/crypto/${c.id}`}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-800/40 px-2 py-3 text-center hover:border-zinc-700 hover:bg-zinc-800 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt={c.name} width={28} height={28} className="h-7 w-7 rounded-full" />
              <span className="text-xs font-bold uppercase text-zinc-200">{c.symbol}</span>
              <span className="text-[11px] tabular-nums text-zinc-400">{fmtPrice(c.current_price)}</span>
              <span
                className={`flex items-center gap-0.5 text-[10px] font-semibold tabular-nums ${
                  up ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {up ? '+' : ''}{chg.toFixed(2)}%
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
