'use client'
import { useMemo } from 'react'
import { useStockHistory15y, calcPeriodReturns } from '@/lib/hooks/useStockHistory15y'

function ChangeCell({ pct, hasData }: { pct: number; hasData: boolean }) {
  if (!hasData) return <span className="text-zinc-700 text-xs">—</span>
  const isUp = pct >= 0
  return (
    <span className={`text-sm font-semibold tabular-nums ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
      {isUp ? '+' : ''}{pct.toFixed(2)}%
    </span>
  )
}

export function PerformanceStrip({ symbol }: { symbol: string }) {
  const { data: bars, isLoading } = useStockHistory15y(symbol)

  const periods = useMemo(() => {
    if (!bars?.length) return []
    return calcPeriodReturns(bars)
  }, [bars])

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-300">Performance</h3>
      </div>
      <div className="grid grid-cols-2 divide-x divide-zinc-800 sm:grid-cols-4 lg:grid-cols-8">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 px-3 py-3">
                <div className="h-3 w-10 animate-pulse rounded bg-zinc-800" />
                <div className="h-4 w-14 animate-pulse rounded bg-zinc-800" />
              </div>
            ))
          : periods.map((p) => (
              <div key={p.key} className="flex flex-col items-center gap-1 px-2 py-3 text-center">
                <span className="text-[11px] font-medium text-zinc-500">{p.label}</span>
                <ChangeCell pct={p.pct} hasData={p.hasData} />
              </div>
            ))}
      </div>
    </div>
  )
}
