'use client'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Series {
  id: string
  label: string
  unit: string
  section: string
  direction: number   // +1 = higher is good, -1 = lower is good
  value: number
  change: number
  history: number[]
}

const SECTIONS: { key: string; title: string }[] = [
  { key: 'growth',    title: 'Growth' },
  { key: 'inflation', title: 'Inflation' },
  { key: 'labor',     title: 'Jobs & Labor' },
  { key: 'fed',       title: 'The Fed' },
  { key: 'bonds',     title: 'Rates & Bonds' },
  { key: 'consumer',  title: 'Consumer' },
]

function fmt(n: number, unit: string): string {
  if (unit === '%' || unit === 'pts') return n.toFixed(n % 1 === 0 ? 0 : 1)
  if (unit === 'K') return Math.abs(n) >= 1000 ? n.toLocaleString('en-US') : n.toString()
  return n.toLocaleString('en-US')
}

function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const w = 80, h = 24
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function UsEconomyCards() {
  const { data, isLoading, isError } = useQuery<Series[]>({
    queryKey: ['macro-us'],
    queryFn: () => fetch('/api/macro/us').then((r) => (r.ok ? r.json() : [])),
    staleTime: 5 * 60_000,
  })

  if (isError) return null

  return (
    <div className="not-prose my-8 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">US Economy — live indicators</h2>
        <span className="text-[11px] text-zinc-500">Source: FRED · updated monthly</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-800/60" />
          ))}
        </div>
      ) : (
        SECTIONS.map(({ key, title }) => {
          const items = (data ?? []).filter((s) => s.section === key)
          if (!items.length) return null
          return (
            <div key={key} className="mb-4 last:mb-0">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-zinc-500">{title}</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {items.map((s) => {
                  const good = s.change === 0 ? null : s.change * s.direction > 0
                  const color = good === null ? '#a1a1aa' : good ? '#10b981' : '#f87171'
                  const Icon = s.change === 0 ? Minus : s.change > 0 ? TrendingUp : TrendingDown
                  return (
                    <div key={s.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                      <p className="truncate text-[11px] text-zinc-400" title={s.label}>{s.label}</p>
                      <div className="mt-1 flex items-end justify-between gap-2">
                        <p className="text-lg font-bold text-white">
                          {fmt(s.value, s.unit)}<span className="ml-0.5 text-xs font-medium text-zinc-500">{s.unit}</span>
                        </p>
                        <Sparkline data={s.history} color={color} />
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-[11px] font-medium" style={{ color }}>
                        <Icon className="h-3 w-3" />
                        {s.change > 0 ? '+' : ''}{fmt(s.change, s.unit)} {s.unit} vs prior
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
      <p className="mt-3 text-[11px] text-zinc-600">Colors reflect whether each move is good or bad for the economy. Data is for informational purposes only.</p>
    </div>
  )
}
