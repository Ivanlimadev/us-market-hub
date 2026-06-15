'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { X, Plus, TrendingUp, BarChart2 } from 'lucide-react'
import type { StockDetailData } from '@/lib/hooks/useStockDetail'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6']
const MAX = 5
const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'NVDA']

function fmtLarge(n: number | null) {
  if (!n) return '—'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  return `$${(n / 1e6).toFixed(0)}M`
}

function useStockData(symbol: string) {
  return useQuery<StockDetailData>({
    queryKey: ['stock-detail', symbol],
    queryFn:  () => fetch(`/api/stocks/${symbol}`).then(r => r.json()),
    staleTime: 60_000,
    enabled:  !!symbol,
  })
}

// Fixed 5 hooks — never changes count, avoids Rules of Hooks violation
function useAllStockData(symbols: string[]) {
  const q0 = useStockData(symbols[0] ?? '')
  const q1 = useStockData(symbols[1] ?? '')
  const q2 = useStockData(symbols[2] ?? '')
  const q3 = useStockData(symbols[3] ?? '')
  const q4 = useStockData(symbols[4] ?? '')
  return [q0, q1, q2, q3, q4].slice(0, symbols.length)
}

function useAllHistories(symbols: string[]) {
  const h0 = useQuery({ queryKey: ['hist', symbols[0] ?? ''], queryFn: () => fetch(`/api/stocks/${symbols[0]}/history?period=15y`).then(r => r.json()), enabled: !!symbols[0], staleTime: 3600_000 })
  const h1 = useQuery({ queryKey: ['hist', symbols[1] ?? ''], queryFn: () => fetch(`/api/stocks/${symbols[1]}/history?period=15y`).then(r => r.json()), enabled: !!symbols[1], staleTime: 3600_000 })
  const h2 = useQuery({ queryKey: ['hist', symbols[2] ?? ''], queryFn: () => fetch(`/api/stocks/${symbols[2]}/history?period=15y`).then(r => r.json()), enabled: !!symbols[2], staleTime: 3600_000 })
  const h3 = useQuery({ queryKey: ['hist', symbols[3] ?? ''], queryFn: () => fetch(`/api/stocks/${symbols[3]}/history?period=15y`).then(r => r.json()), enabled: !!symbols[3], staleTime: 3600_000 })
  const h4 = useQuery({ queryKey: ['hist', symbols[4] ?? ''], queryFn: () => fetch(`/api/stocks/${symbols[4]}/history?period=15y`).then(r => r.json()), enabled: !!symbols[4], staleTime: 3600_000 })
  return [h0, h1, h2, h3, h4].slice(0, symbols.length)
}

function StockLogo({ symbol }: { symbol: string }) {
  return (
    <div className="h-10 w-10 overflow-hidden rounded-xl bg-zinc-800 flex items-center justify-center">
      <Image src={`https://assets.parqet.com/logos/symbol/${symbol}?format=png`}
        alt={symbol} width={40} height={40} className="object-contain" unoptimized
        onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = 'none'; if (t.parentElement) t.parentElement.innerHTML = `<span class="text-xs font-bold text-zinc-400">${symbol.slice(0, 2)}</span>` }}
      />
    </div>
  )
}

function NormalizedChart({ symbols, histories, colors }: {
  symbols: string[]
  histories: Array<{ data?: Array<{ date: string; close: number }> }>
  colors: string[]
}) {
  const chartData = useMemo(() => {
    return symbols.map((sym, i) => {
      const bars = (histories[i]?.data as Array<{ date: string; close: number }> | undefined) ?? []
      if (!bars.length) return null
      const start = bars[0].close
      if (!start) return null
      return {
        symbol: sym,
        color: colors[i],
        points: bars.map(b => ({ date: b.date, pct: ((b.close - start) / start) * 100 })),
      }
    }).filter(Boolean)
  }, [symbols, histories, colors])

  if (!chartData.length) return (
    <div className="flex h-40 items-center justify-center text-xs text-zinc-600">Loading chart…</div>
  )

  const allPts = chartData.flatMap(s => s!.points.map(p => p.pct))
  const minY = Math.min(...allPts) - 5
  const maxY = Math.max(...allPts) + 5
  const rangeY = maxY - minY || 1
  const W = 600, H = 180
  const toX = (i: number, total: number) => (i / Math.max(total - 1, 1)) * W
  const toY = (pct: number) => H - ((pct - minY) / rangeY) * H

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 280, height: 180 }}>
        <line x1="0" y1={toY(0)} x2={W} y2={toY(0)} stroke="#3f3f46" strokeWidth="1" strokeDasharray="4 4" />
        {chartData.map(s => {
          if (!s) return null
          const pts = s.points
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i, pts.length).toFixed(1)} ${toY(p.pct).toFixed(1)}`).join(' ')
          return <path key={s.symbol} d={d} fill="none" stroke={s.color} strokeWidth="2" />
        })}
      </svg>
    </div>
  )
}

function MetricRow({ label, values, count }: { label: string; values: (string | null)[]; count: number }) {
  return (
    <tr className="border-b border-zinc-800/40 hover:bg-zinc-800/20 transition-colors">
      <td className="py-3 pr-4 pl-4 text-xs text-zinc-500 whitespace-nowrap font-medium">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="px-3 py-3 text-center font-mono text-xs text-zinc-200">{v ?? '—'}</td>
      ))}
      {Array.from({ length: MAX - count }).map((_, i) => (
        <td key={`e-${i}`} className="px-3 py-3 text-center text-xs text-zinc-800">—</td>
      ))}
    </tr>
  )
}

export function CompareView() {
  const [symbols, setSymbols] = useState<string[]>(DEFAULT_SYMBOLS)
  const [input, setInput]     = useState('')
  const [inputError, setInputError] = useState('')

  const stockQueries  = useAllStockData(symbols)
  const histQueries   = useAllHistories(symbols)
  const dataList      = stockQueries.map(q => q.data ?? null)
  const isLoading     = stockQueries.some(q => q.isLoading)

  function addSymbol() {
    const sym = input.trim().toUpperCase().replace(/[^A-Z.]/g, '')
    if (!sym) return
    if (symbols.includes(sym)) { setInputError('Already in comparison'); return }
    if (symbols.length >= MAX) { setInputError(`Max ${MAX} stocks`); return }
    setSymbols(prev => [...prev, sym])
    setInput('')
    setInputError('')
  }

  function removeSymbol(sym: string) {
    setSymbols(prev => prev.filter(s => s !== sym))
  }

  const fmt$   = (n: number | null) => n !== null ? `$${n.toFixed(2)}` : null
  const fmtPct = (n: number | null) => n !== null ? `${(n * 100).toFixed(1)}%` : null
  const fmtN   = (n: number | null, dec = 2) => n !== null ? n.toFixed(dec) : null

  const metrics: { label: string; get: (d: StockDetailData | null) => string | null }[] = [
    { label: 'Price',           get: d => fmt$(d?.currentPrice ?? null) },
    { label: 'Change',          get: d => d?.changePct !== undefined ? `${d.changePct >= 0 ? '+' : ''}${d.changePct.toFixed(2)}%` : null },
    { label: 'Market Cap',      get: d => fmtLarge(d?.info?.marketCap ?? null) },
    { label: 'P/E (TTM)',       get: d => fmtN(d?.info?.pe ?? null) },
    { label: 'Forward P/E',     get: d => fmtN(d?.info?.forwardPE ?? null) },
    { label: 'P/B',             get: d => fmtN(d?.info?.priceToBook ?? null) },
    { label: 'EPS',             get: d => fmt$(d?.info?.eps ?? null) },
    { label: 'Dividend Yield',  get: d => d?.info?.dividendYield ? `${(d.info.dividendYield * 100).toFixed(2)}%` : null },
    { label: 'Beta',            get: d => fmtN(d?.info?.beta ?? null) },
    { label: 'ROE',             get: d => fmtPct(d?.info?.roe ?? null) },
    { label: 'Profit Margin',   get: d => fmtPct(d?.info?.profitMargin ?? null) },
    { label: 'Revenue Growth',  get: d => fmtPct(d?.info?.revenueGrowth ?? null) },
    { label: 'Debt/Equity',     get: d => fmtN(d?.info?.debtToEquity ?? null) },
    { label: '52W High',        get: d => fmt$(d?.info?.week52High ?? null) },
    { label: '52W Low',         get: d => fmt$(d?.info?.week52Low ?? null) },
    { label: 'Sector',          get: d => d?.info?.sector ?? null },
  ]

  return (
    <div className="space-y-5">

      {/* Search bar */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <p className="text-sm font-medium text-zinc-300">Add stocks to compare <span className="text-zinc-600">({symbols.length}/{MAX})</span></p>
        </div>

        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => { setInput(e.target.value.toUpperCase().replace(/[^A-Z.]/g, '')); setInputError('') }}
            onKeyDown={e => e.key === 'Enter' && addSymbol()}
            placeholder="Enter ticker (e.g. NVDA, TSLA)…"
            maxLength={10}
            disabled={symbols.length >= MAX}
            className="flex-1 h-10 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm font-mono text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none disabled:opacity-40"
          />
          <button
            onClick={addSymbol}
            disabled={!input.trim() || symbols.length >= MAX}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>

        {inputError && <p className="text-xs text-red-400">{inputError}</p>}

        {/* Current symbols chips */}
        <div className="flex flex-wrap gap-2">
          {symbols.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5 rounded-full border pl-2 pr-1 py-1" style={{ borderColor: COLORS[i] + '60', backgroundColor: COLORS[i] + '15' }}>
              <div className="h-4 w-4 rounded-full" style={{ backgroundColor: COLORS[i] }} />
              <span className="text-xs font-bold text-zinc-200">{s}</span>
              <button
                onClick={() => removeSymbol(s)}
                className="flex h-4 w-4 items-center justify-center rounded-full text-zinc-500 hover:bg-red-500/20 hover:text-red-400 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {symbols.length < 2 && (
        <div className="flex flex-col h-48 items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-700 text-zinc-500">
          <TrendingUp className="h-8 w-8 text-zinc-700" />
          <p className="text-sm">Add at least 2 stocks to compare</p>
        </div>
      )}

      {symbols.length >= 2 && (
        <>
          {/* Normalized chart */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-300">Performance comparison (% return)</h3>
              <div className="flex flex-wrap gap-3">
                {symbols.map((s, i) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className="h-2 w-5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-xs text-zinc-400">{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <NormalizedChart
              symbols={symbols}
              histories={histQueries.map(q => ({ data: q.data as Array<{ date: string; close: number }> | undefined }))}
              colors={symbols.map((_, i) => COLORS[i])}
            />
          </div>

          {/* Metrics table */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-800/50">
                    <th className="py-3 pl-4 pr-4 text-left text-xs font-medium text-zinc-500">Metric</th>
                    {symbols.map((s, i) => (
                      <th key={s} className="px-3 py-3 text-center min-w-[100px]">
                        <div className="flex flex-col items-center gap-1.5">
                          <div className="relative">
                            <Link href={`/stocks/${s}`} className="block">
                              <div className="h-9 w-9 overflow-hidden rounded-xl bg-zinc-800 flex items-center justify-center border-2 hover:border-opacity-100 transition-colors" style={{ borderColor: COLORS[i] }}>
                                <StockLogo symbol={s} />
                              </div>
                            </Link>
                          </div>
                          <span className="text-xs font-bold text-white">{s}</span>
                          {isLoading && !dataList[i] ? (
                            <span className="text-[10px] text-zinc-600">Loading…</span>
                          ) : dataList[i] && (
                            <span className={`text-[10px] font-semibold ${(dataList[i]?.changePct ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              ${(dataList[i]?.currentPrice ?? 0).toFixed(2)} {(dataList[i]?.changePct ?? 0) >= 0 ? '+' : ''}{(dataList[i]?.changePct ?? 0).toFixed(2)}%
                            </span>
                          )}
                        </div>
                      </th>
                    ))}
                    {Array.from({ length: MAX - symbols.length }).map((_, i) => (
                      <th key={`ph-${i}`} className="px-3 py-3 min-w-[100px]" />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map(m => (
                    <MetricRow key={m.label} label={m.label} values={dataList.map(m.get)} count={symbols.length} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
