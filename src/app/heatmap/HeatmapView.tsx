'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getPollInterval } from '@/lib/market-hours'
import { STOCK_UNIVERSE } from '@/lib/stock-universe'
import type { YFBatchQuote } from '@/lib/yahoo-finance'

function heatColor(pct: number): string {
  if (pct <= -3)   return 'bg-red-700       text-red-100'
  if (pct <= -1.5) return 'bg-red-600/80    text-red-100'
  if (pct <= -0.5) return 'bg-red-500/60    text-red-100'
  if (pct <  0.5)  return 'bg-zinc-700      text-zinc-300'
  if (pct <  1.5)  return 'bg-emerald-600/60 text-emerald-100'
  if (pct <  3)    return 'bg-emerald-600/80 text-emerald-100'
  return                   'bg-emerald-700   text-emerald-50'
}

const ALL = Object.values(STOCK_UNIVERSE).flat()

export function HeatmapView() {
  const { data, isLoading } = useQuery<YFBatchQuote[]>({
    queryKey:       ['screener'],
    queryFn:        () => fetch('/api/screener').then((r) => r.json()),
    staleTime:      55_000,
    refetchInterval: getPollInterval,
  })

  const quoteMap = Object.fromEntries((data ?? []).map((q) => [q.symbol, q]))

  // Color legend
  const legend = [
    { label: '< -3%',  cls: 'bg-red-700' },
    { label: '-1.5%',  cls: 'bg-red-600/80' },
    { label: '-0.5%',  cls: 'bg-red-500/60' },
    { label: '±0',     cls: 'bg-zinc-700' },
    { label: '+0.5%',  cls: 'bg-emerald-600/60' },
    { label: '+1.5%',  cls: 'bg-emerald-600/80' },
    { label: '> +3%',  cls: 'bg-emerald-700' },
  ]

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
        <span className="text-zinc-500 mr-1">Scale:</span>
        {legend.map((l) => (
          <div key={l.label} className="flex items-center gap-1">
            <div className={`h-3 w-3 rounded-sm ${l.cls}`} />
            <span>{l.label}</span>
          </div>
        ))}
      </div>

      {/* Sectors */}
      {Object.entries(STOCK_UNIVERSE).map(([sector, symbols]) => (
        <div key={sector}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{sector}</h2>
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {symbols.map((sym) => {
              const q = quoteMap[sym]
              const pct = q?.changePct ?? 0
              const cls = heatColor(pct)

              return (
                <Link
                  key={sym}
                  href={`/stocks/${sym}`}
                  className={`group flex flex-col items-center justify-center rounded-lg p-2 transition-all hover:opacity-90 hover:scale-105 ${cls} ${isLoading ? 'animate-pulse' : ''}`}
                  style={{ minHeight: 64 }}
                >
                  <span className="text-xs font-bold">{sym}</span>
                  {q && (
                    <>
                      <span className="mt-0.5 text-[10px] font-mono opacity-90">
                        ${q.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-semibold opacity-80">
                        {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                      </span>
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
