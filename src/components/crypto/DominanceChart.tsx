'use client'
import { useQuery } from '@tanstack/react-query'
import type { CryptoGlobal } from '@/types/crypto'

const PALETTE = ['#f7931a', '#627eea', '#26a17b', '#f0b90b', '#9945ff', '#52525b']

function fmt(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(0)}B`
  return `$${(n / 1e6).toFixed(0)}M`
}

function Donut({ segments }: { segments: { pct: number; color: string }[] }) {
  const r = 15.9155 // circumference = 100
  let cum = 0
  const items = segments.map(s => {
    const offset = -cum
    cum += s.pct
    return { ...s, offset }
  })
  return (
    <svg viewBox="0 0 36 36" className="w-full h-full">
      {/* track */}
      <circle cx="18" cy="18" r={r} fill="none" stroke="#27272a" strokeWidth="3.8" />
      {items.map((s, i) => (
        <circle
          key={i}
          cx="18" cy="18" r={r}
          fill="none"
          stroke={s.color}
          strokeWidth="3.8"
          strokeDasharray={`${Math.max(0, s.pct - 0.6)} ${100 - s.pct + 0.6}`}
          strokeDashoffset={s.offset}
          transform="rotate(-90 18 18)"
        />
      ))}
    </svg>
  )
}

export function DominanceChart() {
  const { data, isLoading } = useQuery<CryptoGlobal>({
    queryKey: ['crypto-global'],
    queryFn:  () => fetch('/api/crypto/global').then(r => r.json()),
    staleTime: 4 * 60_000,
    refetchInterval: 5 * 60_000,
  })

  const segments = (data?.top_dominances ?? []).map((d, i) => ({
    ...d,
    color: PALETTE[i] ?? '#52525b',
  }))

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-zinc-200">Market Dominance</h3>
        {data && (
          <p className="text-xs text-zinc-500 mt-0.5">
            Total cap: <span className="text-zinc-300 font-medium">{fmt(data.total_market_cap_usd)}</span>
          </p>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-6 animate-pulse">
          <div className="h-36 w-36 rounded-full bg-zinc-800 shrink-0" />
          <div className="flex-1 space-y-2.5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 rounded bg-zinc-800" style={{ width: `${60 + (i % 3) * 10}%` }} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-5">
          {/* Donut */}
          <div className="h-36 w-36 shrink-0">
            <Donut segments={segments} />
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2 min-w-0">
            {segments.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="w-12 font-bold text-zinc-300 shrink-0">{s.symbol}</span>
                {/* bar */}
                <div className="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden min-w-0">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, s.pct)}%`, background: s.color }}
                  />
                </div>
                <span className="w-10 text-right text-zinc-400 tabular-nums shrink-0">
                  {s.pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
