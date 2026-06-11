'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { YFBatchQuote } from '@/lib/yahoo-finance'

const TABS = [
  { key: 'dy',       label: 'Top Dividend Yield',  metric: (s: YFBatchQuote) => (s.dividendYield ?? 0) * 100,  fmt: (v: number) => v.toFixed(2) + '%',   color: 'text-emerald-400' },
  { key: 'gainers',  label: 'Top Gainers Today',    metric: (s: YFBatchQuote) => s.changePct,                  fmt: (v: number) => (v >= 0 ? '+' : '') + v.toFixed(2) + '%', color: 'text-emerald-400' },
  { key: 'losers',   label: 'Top Losers Today',     metric: (s: YFBatchQuote) => s.changePct,                  fmt: (v: number) => v.toFixed(2) + '%',   color: 'text-red-400'    },
  { key: 'cap',      label: 'Largest Market Cap',   metric: (s: YFBatchQuote) => s.marketCap ?? 0,             fmt: fmtCap,                               color: 'text-zinc-300'   },
  { key: 'roe',      label: 'Highest ROE',          metric: (s: YFBatchQuote) => (s.roe ?? 0) * 100,           fmt: (v: number) => v.toFixed(1) + '%',   color: 'text-sky-400'    },
] as const

type TabKey = typeof TABS[number]['key']

function fmtCap(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  return `$${(n / 1e6).toFixed(0)}M`
}

function Logo({ symbol }: { symbol: string }) {
  return (
    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-zinc-800 flex items-center justify-center">
      <Image src={`https://assets.parqet.com/logos/symbol/${symbol}?format=png`}
        alt={symbol} width={36} height={36} className="object-contain" unoptimized
        onError={(e) => {
          const t = e.target as HTMLImageElement; t.style.display = 'none'
          if (t.parentElement) t.parentElement.innerHTML = `<span class="text-xs font-bold text-zinc-400">${symbol.slice(0, 2)}</span>`
        }}
      />
    </div>
  )
}

export function RankingsView() {
  const [tab, setTab] = useState<TabKey>('dy')

  const { data, isLoading } = useQuery<YFBatchQuote[]>({
    queryKey: ['screener'],
    queryFn: () => fetch('/api/screener').then((r) => r.json()),
    staleTime: 5 * 60_000,
  })

  const ranked = useMemo(() => {
    if (!data) return []
    const tabDef = TABS.find((t) => t.key === tab)!
    const sorted = [...data]
      .filter((s) => {
        const v = tabDef.metric(s)
        if (tab === 'dy')     return v > 0
        if (tab === 'gainers') return s.changePct > 0
        if (tab === 'losers')  return s.changePct < 0
        if (tab === 'roe')     return v > 0
        return true
      })
      .sort((a, b) => {
        const av = tabDef.metric(a)
        const bv = tabDef.metric(b)
        return tab === 'losers' ? av - bv : bv - av
      })
    return sorted.slice(0, 20)
  }, [data, tab])

  const tabDef = TABS.find((t) => t.key === tab)!

  return (
    <div className="space-y-4">
      {/* Tab selector */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              tab === t.key
                ? 'bg-emerald-500 text-white'
                : 'border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="divide-y divide-zinc-800/60">
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="h-5 w-5 animate-pulse rounded bg-zinc-800" />
                  <div className="h-9 w-9 animate-pulse rounded-xl bg-zinc-800" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-20 animate-pulse rounded bg-zinc-800" />
                    <div className="h-3 w-32 animate-pulse rounded bg-zinc-800" />
                  </div>
                  <div className="h-5 w-16 animate-pulse rounded bg-zinc-800" />
                </div>
              ))
            : ranked.map((s, i) => {
                const value     = tabDef.metric(s)
                const isUp      = s.changePct >= 0
                const DayIcon   = isUp ? TrendingUp : TrendingDown
                const dayColor  = isUp ? 'text-emerald-400' : 'text-red-400'

                return (
                  <Link
                    key={s.symbol}
                    href={`/stocks/${s.symbol}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-zinc-800/40"
                  >
                    <span className="w-5 text-center text-xs font-bold text-zinc-600">
                      {i + 1}
                    </span>
                    <Logo symbol={s.symbol} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white">{s.symbol}</p>
                      <p className="truncate text-xs text-zinc-500">{s.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-mono text-sm font-bold ${tabDef.color}`}>
                        {tabDef.fmt(value)}
                      </p>
                      <p className={`flex items-center justify-end gap-0.5 text-xs ${dayColor}`}>
                        <DayIcon className="h-3 w-3" />
                        {isUp ? '+' : ''}{s.changePct.toFixed(2)}%
                      </p>
                    </div>
                  </Link>
                )
              })}
        </div>
      </div>
    </div>
  )
}
