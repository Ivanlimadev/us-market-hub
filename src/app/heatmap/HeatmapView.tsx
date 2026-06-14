'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getPollInterval } from '@/lib/market-hours'
import type { YFBatchQuote } from '@/lib/yahoo-finance'

function pctColor(p: number) {
  if (p <= -2)  return { bg: 'bg-red-900/80',    text: 'text-red-300',     border: 'border-red-700/40' }
  if (p < -0.5) return { bg: 'bg-red-800/60',    text: 'text-red-400',     border: 'border-red-600/30' }
  if (p < 0.5)  return { bg: 'bg-zinc-800/80',   text: 'text-zinc-400',    border: 'border-zinc-700/40' }
  if (p < 2)    return { bg: 'bg-emerald-900/60', text: 'text-emerald-400', border: 'border-emerald-700/30' }
  return               { bg: 'bg-emerald-800/80', text: 'text-emerald-300', border: 'border-emerald-600/40' }
}

function fmtCap(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  return `$${(n / 1e6).toFixed(0)}M`
}

export function HeatmapView() {
  const { data, isLoading } = useQuery<YFBatchQuote[]>({
    queryKey:        ['screener'],
    queryFn:         () => fetch('/api/screener').then(r => r.json()),
    staleTime:       25_000,
    refetchInterval: getPollInterval,
  })

  const top25 = data?.length
    ? [...data]
        .filter(q => (q.marketCap ?? 0) > 0)
        .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
        .slice(0, 25)
    : []

  if (isLoading && !top25.length) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-4 h-24" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {top25.map((q) => {
        const p = q.changePct
        const { bg, text, border } = pctColor(p)
        return (
          <Link
            key={q.symbol}
            href={`/stocks/${q.symbol}`}
            className={`group rounded-xl border ${border} ${bg} p-4 flex flex-col gap-1.5 hover:brightness-110 transition-all duration-150`}
          >
            <div className="flex items-start justify-between gap-1">
              <span className="text-sm font-bold text-white leading-none">{q.symbol}</span>
              <span className={`text-xs font-semibold leading-none ${text}`}>
                {p >= 0 ? '+' : ''}{p.toFixed(2)}%
              </span>
            </div>
            <span className="text-base font-mono font-semibold text-white leading-none">
              ${q.price >= 10 ? q.price.toFixed(2) : q.price.toFixed(4)}
            </span>
            {q.marketCap && (
              <span className="text-[11px] text-zinc-500 leading-none">{fmtCap(q.marketCap)}</span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
