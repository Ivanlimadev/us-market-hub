'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { getPollInterval } from '@/lib/market-hours'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { YFBatchQuote } from '@/lib/yahoo-finance'

function StockLogo({ symbol }: { symbol: string }) {
  return (
    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-zinc-800 flex items-center justify-center">
      <Image
        src={`https://assets.parqet.com/logos/symbol/${symbol}?format=png`}
        alt={symbol}
        width={36}
        height={36}
        className="object-contain"
        onError={(e) => {
          const t = e.target as HTMLImageElement
          t.style.display = 'none'
          if (t.parentElement)
            t.parentElement.innerHTML = `<span class="text-[10px] font-bold text-zinc-300">${symbol.slice(0, 2)}</span>`
        }}
        unoptimized
      />
    </div>
  )
}

function MiniCard({ q, rank }: { q: YFBatchQuote; rank: number }) {
  const p  = q.changePct ?? 0
  const up = p >= 0
  const Icon      = up ? TrendingUp : TrendingDown
  const pctColor  = up ? 'text-emerald-400' : 'text-red-400'
  const pctBg     = up ? 'bg-emerald-500/10' : 'bg-red-500/10'
  const accentBar = up ? 'bg-emerald-500' : 'bg-red-500'
  const glow      = up ? 'hover:shadow-[0_0_20px_rgba(16,185,129,0.12)]' : 'hover:shadow-[0_0_20px_rgba(239,68,68,0.12)]'

  return (
    <Link
      href={`/stocks/${q.symbol}`}
      className={`relative flex flex-col gap-2.5 rounded-xl border border-zinc-800 bg-zinc-900 p-3.5 hover:border-zinc-600 transition-all duration-150 ${glow}`}
    >
      <div className={`absolute top-0 left-3 right-3 h-[2px] rounded-full ${accentBar} opacity-50`} />
      <span className="absolute top-2.5 right-2.5 text-[9px] font-bold text-zinc-700">#{rank}</span>

      <div className="flex items-center gap-2 mt-0.5">
        <StockLogo symbol={q.symbol} />
        <div className="min-w-0">
          <p className="text-xs font-bold text-white leading-none">{q.symbol}</p>
          <p className="text-[10px] text-zinc-500 truncate leading-none mt-0.5 max-w-[72px]">{q.name ?? q.symbol}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-sm font-bold text-white leading-none">
          ${(q.price ?? 0).toFixed(2)}
        </span>
        <span className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${pctBg} ${pctColor}`}>
          <Icon className="h-2.5 w-2.5" />
          {p >= 0 ? '+' : ''}{p.toFixed(2)}%
        </span>
      </div>
    </Link>
  )
}

export function HomeHeatmap() {
  const { data, isLoading } = useQuery<YFBatchQuote[]>({
    queryKey:        ['screener'],
    queryFn:         () => fetch('/api/screener').then(r => r.json()),
    staleTime:       25_000,
    refetchInterval: getPollInterval,
  })

  const top10 = data?.length
    ? [...data]
        .filter(q => (q.marketCap ?? 0) > 0)
        .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
        .slice(0, 10)
    : []

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-zinc-200">Top 10 Stocks</h2>
        <Link
          href="/heatmap"
          className="rounded-md border border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors"
        >
          Ver top 20 →
        </Link>
      </div>

      <div className="p-3">
        {isLoading && !top10.length ? (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-800 h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {top10.map((q, i) => (
              <MiniCard key={q.symbol} q={q} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
