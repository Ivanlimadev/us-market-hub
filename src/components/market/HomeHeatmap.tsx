'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getPollInterval } from '@/lib/market-hours'
import { STOCK_UNIVERSE } from '@/lib/stock-universe'
import type { YFBatchQuote } from '@/lib/yahoo-finance'

function heatColor(pct: number) {
  if (pct <= -3)   return 'bg-red-700       text-red-100'
  if (pct <= -1.5) return 'bg-red-600/80    text-red-100'
  if (pct <= -0.5) return 'bg-red-500/50    text-red-200'
  if (pct <   0.5) return 'bg-zinc-700/80   text-zinc-300'
  if (pct <   1.5) return 'bg-emerald-700/60 text-emerald-100'
  if (pct <   3)   return 'bg-emerald-600/80 text-emerald-100'
  return                   'bg-emerald-500   text-white'
}

export function HomeHeatmap() {
  const { data, isLoading } = useQuery<YFBatchQuote[]>({
    queryKey:        ['screener'],
    queryFn:         () => fetch('/api/screener').then((r) => r.json()),
    staleTime:       55_000,
    refetchInterval: getPollInterval,
  })

  const quoteMap = Object.fromEntries((data ?? []).map((q) => [q.symbol, q]))

  const legend = [
    { label: '< -3%', cls: 'bg-red-700' },
    { label: '-1.5%', cls: 'bg-red-600/80' },
    { label: '±0',    cls: 'bg-zinc-700' },
    { label: '+1.5%', cls: 'bg-emerald-600/80' },
    { label: '> +3%', cls: 'bg-emerald-500' },
  ]

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">Market Heatmap</h2>
          <p className="text-[11px] text-zinc-500">Color = day return</p>
        </div>
        <div className="flex items-center gap-2">
          {legend.map((l) => (
            <div key={l.label} className="hidden items-center gap-1 sm:flex">
              <div className={`h-2.5 w-2.5 rounded-sm ${l.cls}`} />
              <span className="text-[10px] text-zinc-500">{l.label}</span>
            </div>
          ))}
          <Link href="/heatmap" className="ml-2 rounded-md border border-zinc-700 px-2.5 py-1 text-[11px] font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-colors">
            Full view
          </Link>
        </div>
      </div>

      <div className="p-3 space-y-2">
        {Object.entries(STOCK_UNIVERSE).map(([sector, symbols]) => (
          <div key={sector}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{sector}</p>
            <div className="flex flex-wrap gap-1">
              {symbols.map((sym) => {
                const q   = quoteMap[sym]
                const pct = q?.changePct ?? 0
                const cls = heatColor(pct)
                return (
                  <Link
                    key={sym}
                    href={`/stocks/${sym}`}
                    className={`group flex flex-col items-center justify-center rounded-md transition-all hover:opacity-90 hover:scale-105 ${cls} ${isLoading ? 'animate-pulse' : ''}`}
                    style={{ minWidth: 52, minHeight: 44, padding: '4px 6px' }}
                  >
                    <span className="text-[11px] font-bold leading-none">{sym}</span>
                    {q && (
                      <span className="mt-0.5 text-[9px] font-semibold opacity-90 leading-none">
                        {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
