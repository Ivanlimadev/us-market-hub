'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { getPollInterval } from '@/lib/market-hours'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { YFBatchQuote } from '@/lib/yahoo-finance'

function fmtCap(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  return `$${(n / 1e6).toFixed(0)}M`
}

function StockLogo({ symbol }: { symbol: string }) {
  return (
    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-zinc-800 flex items-center justify-center">
      <Image
        src={`https://assets.parqet.com/logos/symbol/${symbol}?format=png`}
        alt={symbol}
        width={40}
        height={40}
        className="object-contain"
        onError={(e) => {
          const t = e.target as HTMLImageElement
          t.style.display = 'none'
          if (t.parentElement) {
            t.parentElement.innerHTML = `<span class="text-xs font-bold text-zinc-300">${symbol.slice(0, 2)}</span>`
          }
        }}
        unoptimized
      />
    </div>
  )
}

function HeatCard({ q, rank }: { q: YFBatchQuote; rank: number }) {
  const p = q.changePct ?? 0
  const up = p >= 0

  const glow = up
    ? 'shadow-[0_0_24px_rgba(16,185,129,0.10)]'
    : 'shadow-[0_0_24px_rgba(239,68,68,0.10)]'

  const accentBar = up ? 'bg-emerald-500' : 'bg-red-500'
  const pctColor  = up ? 'text-emerald-400' : 'text-red-400'
  const pctBg     = up ? 'bg-emerald-500/10' : 'bg-red-500/10'
  const Icon      = up ? TrendingUp : TrendingDown

  return (
    <Link
      href={`/stocks/${q.symbol}`}
      className={`group relative flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-600 transition-all duration-200 ${glow}`}
    >
      {/* rank */}
      <span className="absolute top-3 right-3 text-[10px] font-bold text-zinc-600">#{rank}</span>

      {/* accent bar top */}
      <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-full ${accentBar} opacity-60`} />

      {/* logo + symbol */}
      <div className="flex items-center gap-3 mt-1">
        <StockLogo symbol={q.symbol} />
        <div className="min-w-0">
          <p className="text-sm font-bold text-white leading-none">{q.symbol}</p>
          <p className="text-[11px] text-zinc-500 leading-none mt-1 truncate max-w-[100px]">{q.name ?? q.symbol}</p>
        </div>
      </div>

      {/* price */}
      <div className="flex items-end justify-between gap-2">
        <span className="text-xl font-mono font-bold text-white leading-none">
          ${(q.price ?? 0) >= 10 ? (q.price ?? 0).toFixed(2) : (q.price ?? 0).toFixed(4)}
        </span>
        <span className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold ${pctBg} ${pctColor}`}>
          <Icon className="h-3 w-3" />
          {p >= 0 ? '+' : ''}{p.toFixed(2)}%
        </span>
      </div>

      {/* market cap */}
      {q.marketCap && (
        <div className="flex items-center justify-between border-t border-zinc-800 pt-2.5">
          <span className="text-[10px] text-zinc-600 uppercase tracking-wide">Market Cap</span>
          <span className="text-[11px] font-semibold text-zinc-400">{fmtCap(q.marketCap)}</span>
        </div>
      )}
    </Link>
  )
}

export function HeatmapView() {
  const { data, isLoading } = useQuery<YFBatchQuote[]>({
    queryKey:        ['screener'],
    queryFn:         () => fetch('/api/screener').then(r => r.json()),
    staleTime:       25_000,
    refetchInterval: getPollInterval,
  })

  const top20 = data?.length
    ? [...data]
        .filter(q => (q.marketCap ?? 0) > 0)
        .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
        .slice(0, 20)
    : []

  if (isLoading && !top20.length) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900 h-36" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {top20.map((q, i) => (
        <HeatCard key={q.symbol} q={q} rank={i + 1} />
      ))}
    </div>
  )
}
