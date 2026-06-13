'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { DefiTVLData } from '@/app/api/defi/tvl/route'

function fmt(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6)  return `$${(n / 1e6).toFixed(0)}M`
  return `$${n.toLocaleString()}`
}

const CHAIN_COLORS: Record<string, string> = {
  Ethereum: '#627eea', Solana: '#9945ff', BSC: '#f0b90b',
  Tron: '#ef4444', Arbitrum: '#12aaff', Avalanche: '#e84142',
  Base: '#0052ff', Polygon: '#8247e5', Optimism: '#ff0420',
}

export function DefiTVLWidget() {
  const [tab, setTab] = useState<'protocols' | 'chains'>('protocols')

  const { data, isLoading, isError, refetch } = useQuery<DefiTVLData>({
    queryKey: ['defi-tvl'],
    queryFn:  () => fetch('/api/defi/tvl').then(r => {
      if (!r.ok) throw new Error(`${r.status}`)
      return r.json()
    }),
    staleTime: 10 * 60_000,
    retry: 2,
  })

  const chgColor = (data?.change1d ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">DeFi Total Value Locked</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">via DefiLlama</p>
        </div>
        {data && (
          <div className="text-right">
            <p className="text-xl font-bold text-white tabular-nums">{fmt(data.totalTvl)}</p>
            <p className={`text-xs font-medium ${chgColor}`}>
              {data.change1d >= 0 ? '+' : ''}{data.change1d.toFixed(2)}% 24h
            </p>
          </div>
        )}
        {isLoading && (
          <div className="animate-pulse text-right">
            <div className="h-6 w-24 rounded bg-zinc-800 mb-1" />
            <div className="h-3 w-16 rounded bg-zinc-800 ml-auto" />
          </div>
        )}
      </div>

      {/* Tab toggle */}
      <div className="flex border-b border-zinc-800 text-xs font-medium">
        {(['protocols', 'chains'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 capitalize transition-colors ${
              tab === t ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {t === 'protocols' ? 'Top Protocols' : 'By Chain'}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        {isError && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <p className="text-xs text-zinc-500">Failed to load DeFi data</p>
            <button onClick={() => refetch()} className="text-[11px] text-emerald-400 hover:underline">Try again</button>
          </div>
        )}

        {isLoading && (
          <div className="divide-y divide-zinc-800/50 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="h-7 w-7 rounded-full bg-zinc-800 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-20 rounded bg-zinc-800" />
                  <div className="h-2.5 w-14 rounded bg-zinc-800" />
                </div>
                <div className="h-3 w-16 rounded bg-zinc-800" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isError && data && tab === 'protocols' && (
          <div className="divide-y divide-zinc-800/50">
            {data.protocols.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 px-5 py-2.5 hover:bg-zinc-800/40 transition-colors">
                <span className="text-[10px] text-zinc-600 w-4 shrink-0 tabular-nums">{i + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {p.logo ? (
                  <img src={p.logo} alt={p.name} width={28} height={28} className="rounded-full h-7 w-7 shrink-0 object-contain bg-zinc-800" />
                ) : (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-zinc-700 flex items-center justify-center text-[9px] font-bold text-zinc-400">
                    {p.name.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{p.category}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-white tabular-nums">{fmt(p.tvl)}</p>
                  <p className={`text-[10px] tabular-nums ${p.change1d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {p.change1d >= 0 ? '+' : ''}{p.change1d.toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !isError && data && tab === 'chains' && (
          <div className="px-5 py-4 space-y-3">
            {data.chains.map(c => {
              const color = CHAIN_COLORS[c.name] ?? '#52525b'
              return (
                <div key={c.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-zinc-300">{c.name}</span>
                    <span className="text-sm font-bold text-white tabular-nums">{fmt(c.tvl)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${c.share}%`, background: color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
