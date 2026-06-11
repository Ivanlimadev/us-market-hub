'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { X, Plus } from 'lucide-react'
import { useStockHistory15y } from '@/lib/hooks/useStockHistory15y'
import type { StockDetailData } from '@/lib/hooks/useStockDetail'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6']
const MAX = 5

function fmtLarge(n: number | null) {
  if (!n) return '—'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  return `$${(n / 1e6).toFixed(0)}M`
}

function useStockData(symbol: string) {
  return useQuery<StockDetailData>({
    queryKey: ['stock-detail', symbol],
    queryFn: () => fetch(`/api/stocks/${symbol}`).then((r) => r.json()),
    staleTime: 60_000,
    enabled: !!symbol,
  })
}

function MetricRow({ label, values }: { label: string; values: (string | null)[] }) {
  return (
    <tr className="border-b border-zinc-800/50">
      <td className="py-2.5 pr-4 text-xs text-zinc-500 whitespace-nowrap">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="px-3 py-2.5 text-center font-mono text-xs text-zinc-200">
          {v ?? '—'}
        </td>
      ))}
      {Array.from({ length: MAX - values.length }).map((_, i) => (
        <td key={`empty-${i}`} className="px-3 py-2.5 text-center text-xs text-zinc-700">—</td>
      ))}
    </tr>
  )
}

function NormalizedChart({ symbols, colors }: { symbols: string[]; colors: string[] }) {
  const histories = symbols.map((s) => useStockHistory15y(s)) // eslint-disable-line react-hooks/rules-of-hooks

  const chartData = useMemo(() => {
    const series = histories.map((h, i) => {
      const bars = h.data ?? []
      if (!bars.length) return null
      const start = bars[0].close
      return { symbol: symbols[i], color: colors[i], points: bars.map((b) => ({ date: b.date, pct: ((b.close - start) / start) * 100 })) }
    }).filter(Boolean)
    return series
  }, [histories, symbols, colors])

  if (!chartData.length) return null

  // Simple SVG line chart
  const allPts = chartData.flatMap((s) => s!.points.map((p) => p.pct))
  const minY = Math.min(...allPts) - 5
  const maxY = Math.max(...allPts) + 5
  const rangeY = maxY - minY || 1
  const W = 600, H = 180

  const toX = (i: number, total: number) => (i / (total - 1)) * W
  const toY = (pct: number) => H - ((pct - minY) / rangeY) * H

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 300, height: 180 }}>
        <line x1="0" y1={toY(0)} x2={W} y2={toY(0)} stroke="#3f3f46" strokeWidth="1" strokeDasharray="4 4" />
        {chartData.map((s) => {
          if (!s) return null
          const pts = s.points
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i, pts.length).toFixed(1)} ${toY(p.pct).toFixed(1)}`).join(' ')
          return <path key={s.symbol} d={d} fill="none" stroke={s.color} strokeWidth="1.5" />
        })}
      </svg>
    </div>
  )
}

function StockColumn({ symbol, color, onRemove }: { symbol: string; color: string; onRemove: () => void }) {
  const { data } = useStockData(symbol)
  const isUp = (data?.changePct ?? 0) >= 0

  return (
    <th className="px-3 py-3 text-center">
      <div className="flex flex-col items-center gap-1">
        <div className="relative">
          <Link href={`/stocks/${symbol}`}>
            <div className="h-10 w-10 overflow-hidden rounded-xl bg-zinc-800 flex items-center justify-center border-2" style={{ borderColor: color }}>
              <Image src={`https://assets.parqet.com/logos/symbol/${symbol}?format=png`}
                alt={symbol} width={40} height={40} className="object-contain" unoptimized
                onError={(e) => { const t = e.target as HTMLImageElement; t.style.display = 'none'; if (t.parentElement) t.parentElement.innerHTML = `<span class="text-xs font-bold text-zinc-400">${symbol.slice(0, 2)}</span>` }}
              />
            </div>
          </Link>
          <button onClick={onRemove} className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-700 text-zinc-400 hover:bg-red-500 hover:text-white transition-colors">
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
        <p className="text-xs font-bold text-white">{symbol}</p>
        {data && (
          <p className={`text-[10px] font-semibold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
            ${data.currentPrice.toFixed(2)} {isUp ? '+' : ''}{data.changePct.toFixed(2)}%
          </p>
        )}
      </div>
    </th>
  )
}

export function CompareView() {
  const [symbols, setSymbols] = useState<string[]>(['AAPL', 'MSFT'])
  const [input, setInput]     = useState('')

  const stockQueries = symbols.map((s) => useStockData(s)) // eslint-disable-line react-hooks/rules-of-hooks

  function addSymbol() {
    const sym = input.trim().toUpperCase()
    if (!sym || symbols.includes(sym) || symbols.length >= MAX) return
    setSymbols((prev) => [...prev, sym])
    setInput('')
  }

  function removeSymbol(sym: string) { setSymbols((prev) => prev.filter((s) => s !== sym)) }

  function fmt$(n: number | null) { return n !== null ? `$${n.toFixed(2)}` : null }
  function fmtPct(n: number | null) { return n !== null ? `${(n * 100).toFixed(1)}%` : null }
  function fmtN(n: number | null, dec = 2) { return n !== null ? n.toFixed(dec) : null }

  const dataList = stockQueries.map((q) => q.data ?? null)

  const metrics: { label: string; get: (d: StockDetailData | null) => string | null }[] = [
    { label: 'Market Cap',       get: (d) => fmtLarge(d?.info?.marketCap ?? null) },
    { label: 'Price',            get: (d) => fmt$(d?.currentPrice ?? null) },
    { label: 'P/E (TTM)',        get: (d) => fmtN(d?.info?.pe ?? null) },
    { label: 'Forward P/E',      get: (d) => fmtN(d?.info?.forwardPE ?? null) },
    { label: 'P/B',              get: (d) => fmtN(d?.info?.priceToBook ?? null) },
    { label: 'EPS',              get: (d) => fmt$(d?.info?.eps ?? null) },
    { label: 'Dividend Yield',   get: (d) => d?.info?.dividendYield !== null && d?.info?.dividendYield !== undefined ? (d.info.dividendYield * 100).toFixed(2) + '%' : null },
    { label: 'Beta',             get: (d) => fmtN(d?.info?.beta ?? null) },
    { label: 'ROE',              get: (d) => fmtPct(d?.info?.roe ?? null) },
    { label: 'ROA',              get: (d) => fmtPct(d?.info?.roa ?? null) },
    { label: 'Profit Margin',    get: (d) => fmtPct(d?.info?.profitMargin ?? null) },
    { label: 'Revenue Growth',   get: (d) => fmtPct(d?.info?.revenueGrowth ?? null) },
    { label: 'Debt/Equity',      get: (d) => fmtN(d?.info?.debtToEquity ?? null) },
    { label: '52W High',         get: (d) => fmt$(d?.info?.week52High ?? null) },
    { label: '52W Low',          get: (d) => fmt$(d?.info?.week52Low ?? null) },
    { label: 'Sector',           get: (d) => d?.info?.sector ?? null },
  ]

  return (
    <div className="space-y-5">
      {/* Add symbol input */}
      <div className="flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && addSymbol()}
          placeholder="Add symbol (e.g. NVDA)…"
          maxLength={10}
          className="h-9 w-48 rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-sm font-mono text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
        />
        <button
          onClick={addSymbol}
          disabled={!input.trim() || symbols.length >= MAX}
          className="flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-sm font-semibold text-white hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
        <span className="text-xs text-zinc-500">{symbols.length}/{MAX} stocks</span>
      </div>

      {symbols.length >= 2 && (
        <>
          {/* Normalized chart */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="mb-3 flex flex-wrap items-center gap-4">
              <h3 className="text-sm font-semibold text-zinc-300">Performance (% return, 15Y)</h3>
              <div className="flex flex-wrap gap-3">
                {symbols.map((s, i) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className="h-2.5 w-5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-xs text-zinc-400">{s}</span>
                  </div>
                ))}
              </div>
            </div>
            <NormalizedChart symbols={symbols} colors={symbols.map((_, i) => COLORS[i])} />
          </div>

          {/* Metrics table */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-800/40">
                    <th className="py-3 pr-4 text-left text-xs text-zinc-500">Metric</th>
                    {symbols.map((s, i) => (
                      <StockColumn key={s} symbol={s} color={COLORS[i]} onRemove={() => removeSymbol(s)} />
                    ))}
                    {Array.from({ length: MAX - symbols.length }).map((_, i) => (
                      <th key={`ph-${i}`} className="px-3 py-3 text-center text-xs text-zinc-700">—</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m) => (
                    <MetricRow key={m.label} label={m.label} values={dataList.map(m.get)} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {symbols.length < 2 && (
        <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-zinc-700 text-zinc-500">
          Add at least 2 stocks to compare
        </div>
      )}
    </div>
  )
}
