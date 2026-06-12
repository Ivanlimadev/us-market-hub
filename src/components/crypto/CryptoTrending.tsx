'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp } from 'lucide-react'

interface TrendingCoin {
  id: string; name: string; symbol: string
  market_cap_rank: number; image: string
  price: number; price_change_percentage_24h: number
  market_cap: string; sparkline: string
}

function fmtPrice(n: number) {
  if (n >= 1)    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (n >= 0.01) return `$${n.toFixed(4)}`
  return `$${n.toFixed(8)}`
}

export function CryptoTrending() {
  const { data, isLoading } = useQuery<TrendingCoin[]>({
    queryKey: ['crypto-trending'],
    queryFn:  () => fetch('/api/crypto/trending').then((r) => r.json()),
    staleTime: 9 * 60_000,
    refetchInterval: 10 * 60_000,
  })

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
        <TrendingUp className="h-4 w-4 text-emerald-400" />
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">Trending</h2>
          <p className="text-[11px] text-zinc-500">Most searched on CoinGecko</p>
        </div>
      </div>

      <div className="divide-y divide-zinc-800/50">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                <div className="h-7 w-7 rounded-full bg-zinc-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-28 rounded bg-zinc-800" />
                  <div className="h-2.5 w-16 rounded bg-zinc-800" />
                </div>
                <div className="h-3 w-16 rounded bg-zinc-800" />
              </div>
            ))
          : (data ?? []).map((coin, i) => {
              const pct = coin.price_change_percentage_24h
              const pos = pct >= 0
              return (
                <Link
                  key={coin.id}
                  href={`/crypto/${coin.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/40 transition-colors"
                >
                  <span className="w-4 text-[11px] text-zinc-600 font-mono shrink-0">{i + 1}</span>
                  <Image src={coin.image} alt={coin.name} width={28} height={28} className="rounded-full" unoptimized />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-200 truncate leading-none">{coin.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase mt-0.5">{coin.symbol}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-zinc-200">{fmtPrice(coin.price)}</p>
                    <p className={`text-[10px] font-semibold mt-0.5 ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pos ? '+' : ''}{pct.toFixed(2)}%
                    </p>
                  </div>
                </Link>
              )
            })}
      </div>
    </div>
  )
}
