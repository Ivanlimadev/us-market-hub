'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  createChart,
  LineSeries,
  PriceScaleMode,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts'
import { SECTOR_PEERS, DEFAULT_PEERS } from '@/components/stock/RelatedAssets'
import type { StockDetailData } from '@/lib/hooks/useStockDetail'

/**
 * Investidor10-style growth comparison. Multi-line total-return chart (log scale)
 * of the stock vs three groups — similar stocks (peers, by sector), major
 * indexes, and commodities. Each result card toggles its line; the stock's line
 * is fixed. A "dividends reinvested / price only" switch flips between adjusted
 * and raw close. Data is live from the history API (auto-refreshed by React Query).
 */

const PERIODS = [
  { key: '1y',  label: '1Y',  days: 365,  desc: '1 year ago'   },
  { key: '2y',  label: '2Y',  days: 730,  desc: '2 years ago'  },
  { key: '3y',  label: '3Y',  days: 1095, desc: '3 years ago'  },
  { key: '5y',  label: '5Y',  days: 1825, desc: '5 years ago'  },
  { key: '10y', label: '10Y', days: 3650, desc: '10 years ago' },
]

const PEER_COLORS = ['#ec4899', '#f97316', '#06b6d4', '#84cc16']
const STOCK_COLOR = '#10b981'
const INDEXES = [
  { key: 'SPY', label: 'S&P 500',      color: '#0ea5e9' },
  { key: 'QQQ', label: 'Nasdaq 100',   color: '#8b5cf6' },
  { key: 'DIA', label: 'Dow Jones',    color: '#f59e0b' },
  { key: 'IWM', label: 'Russell 2000', color: '#14b8a6' },
]
const COMMODITIES = [
  { key: 'GLD',  label: 'Gold',   color: '#eab308' },
  { key: 'SLV',  label: 'Silver', color: '#94a3b8' },
  { key: 'USO',  label: 'Oil',    color: '#b45309' },
  { key: 'CPER', label: 'Copper', color: '#c2410c' },
]

interface Bar { date: string; close: number; adjClose: number }
type Point = { time: UTCTimestamp; value: number }
type TipItem = { key: string; label: string; color: string; value: number }
type Tip = { left: number; date: string; items: TipItem[] }

function fmt$(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtPct(n: number) {
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
}
function fmtDate(t: UTCTimestamp) {
  return new Date((t as number) * 1000).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}
function toBars(json: { bars?: Array<{ date: string; adj_close?: number | null; close?: number | null }> }): Bar[] {
  return (json.bars ?? [])
    .map((b) => ({ date: b.date.split('T')[0], close: b.close ?? 0, adjClose: b.adj_close ?? b.close ?? 0 }))
    .filter((b) => b.close > 0)
}

/** 10y daily history keeping BOTH raw close and adjusted close (for the reinvest switch). */
function useHist(symbol: string) {
  return useQuery<Bar[]>({
    queryKey: ['gc-hist', symbol],
    staleTime: 5 * 60_000,
    queryFn: async () => toBars(await (await fetch(`/api/stocks/${symbol}/history?period=10y`)).json()),
  })
}

/** Index each series to 100 at the period start (log-scale friendly, always > 0). */
function normalize(bars: Bar[] | undefined, days: number, reinvest: boolean): Point[] {
  if (!bars?.length) return []
  const px = (b: Bar) => (reinvest ? b.adjClose : b.close)
  const cutoff = Date.now() - days * 86_400_000
  const slice = bars.filter((b) => new Date(b.date).getTime() >= cutoff)
  const use = slice.length >= 2 ? slice : bars.slice(-2)
  const base = px(use[0])
  if (!base) return []
  return use.map((b) => ({
    time: Math.floor(new Date(b.date).getTime() / 1000) as UTCTimestamp,
    value: (px(b) / base) * 100,
  }))
}

/** Company logo for stocks; a colored code badge for indexes/commodities. */
function AssetLogo({ ticker, color, useLogo }: { ticker: string; color: string; useLogo: boolean }) {
  const [err, setErr] = useState(false)
  if (!useLogo || err) {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white" style={{ backgroundColor: color }}>
        {ticker.slice(0, 4)}
      </div>
    )
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://assets.parqet.com/logos/symbol/${ticker}?format=png`}
      alt={ticker}
      className="h-9 w-9 shrink-0 rounded-md bg-zinc-950 object-contain"
      onError={() => setErr(true)}
    />
  )
}

export function StockGrowthComparison({ data }: { data: StockDetailData }) {
  const symbol = data.symbol.toUpperCase()
  const sector = data.info?.sector ?? null
  const [amount, setAmount] = useState('1000')
  const [periodKey, setPeriodKey] = useState('5y')
  const [reinvest, setReinvest] = useState(true)
  const numAmount = Math.max(parseFloat(amount) || 1000, 1)

  const period = PERIODS.find((p) => p.key === periodKey) ?? PERIODS[3]
  const days = period.days

  const peers = useMemo(
    () => (sector ? SECTOR_PEERS[sector] ?? DEFAULT_PEERS : DEFAULT_PEERS).filter((s) => s !== symbol).slice(0, 3),
    [sector, symbol],
  )

  const { data: stockBars, isLoading } = useHist(symbol)
  const { data: spyBars } = useHist('SPY')
  const { data: qqqBars } = useHist('QQQ')
  const { data: diaBars } = useHist('DIA')
  const { data: iwmBars } = useHist('IWM')
  const { data: gldBars } = useHist('GLD')
  const { data: slvBars } = useHist('SLV')
  const { data: usoBars } = useHist('USO')
  const { data: cperBars } = useHist('CPER')

  const { data: peerBars } = useQuery({
    queryKey: ['gc-peers', peers.join(',')],
    enabled: peers.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Record<string, Bar[]>> => {
      const entries = await Promise.all(peers.map(async (p) => {
        const res = await fetch(`/api/stocks/${p}/history?period=10y`)
        return [p, toBars(await res.json())] as const
      }))
      return Object.fromEntries(entries)
    },
  })

  const barsByKey: Record<string, Bar[] | undefined> = {
    [symbol]: stockBars, SPY: spyBars, QQQ: qqqBars, DIA: diaBars, IWM: iwmBars,
    GLD: gldBars, SLV: slvBars, USO: usoBars, CPER: cperBars, ...(peerBars ?? {}),
  }

  const assets = useMemo(() => {
    const list = [
      { key: symbol, label: symbol, color: STOCK_COLOR, width: 3, group: 'Similar Stocks', useLogo: true, fixed: true },
      ...peers.map((p, i) => ({ key: p, label: p, color: PEER_COLORS[i % PEER_COLORS.length], width: 2, group: 'Similar Stocks', useLogo: true, fixed: false })),
      ...INDEXES.map((x) => ({ ...x, width: 2, group: 'Indexes', useLogo: false, fixed: false })),
      ...COMMODITIES.map((x) => ({ ...x, width: 2, group: 'Commodities', useLogo: false, fixed: false })),
    ]
    return list.filter((s, i) => list.findIndex((x) => x.key === s.key) === i)
  }, [symbol, peers])

  const [visible, setVisible] = useState<Record<string, boolean>>({ [symbol]: true })
  const isOn = (key: string) => key === symbol || !!visible[key]
  const toggle = (key: string) => {
    if (key === symbol) return
    setVisible((v) => ({ ...v, [key]: !v[key] }))
  }

  const normalized = useMemo(() => {
    const out: Record<string, Point[]> = {}
    for (const a of assets) out[a.key] = normalize(barsByKey[a.key], days, reinvest)
    return out
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, days, reinvest, stockBars, spyBars, qqqBars, diaBars, iwmBars, gldBars, slvBars, usoBars, cperBars, peerBars])

  const rows = useMemo(() => assets.map((a) => {
    const nd = normalized[a.key]
    const idx = nd?.length ? nd[nd.length - 1].value : null
    const pct = idx != null ? idx - 100 : null
    return { ...a, pct, value: idx != null ? numAmount * (idx / 100) : null }
  }), [assets, normalized, numAmount])

  const groups = useMemo(() => (['Similar Stocks', 'Indexes', 'Commodities'] as const).map((title) => ({
    title,
    items: rows.filter((r) => r.group === title),
  })), [rows])

  const stockRow = rows.find((r) => r.key === symbol)
  const spyPct = rows.find((r) => r.key === 'SPY')?.pct ?? null
  const outperf = stockRow?.pct != null && spyPct != null && symbol !== 'SPY' ? stockRow.pct - spyPct : null

  // ── Chart ────────────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<Record<string, ISeriesApi<'Line'>>>({})
  const metaRef = useRef<Record<string, { label: string; color: string }>>({})
  const [tip, setTip] = useState<Tip | null>(null)

  useEffect(() => {
    const m: Record<string, { label: string; color: string }> = {}
    for (const a of assets) m[a.key] = { label: a.label, color: a.color }
    metaRef.current = m
  }, [assets])

  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      layout: { background: { color: 'transparent' }, textColor: '#71717a', attributionLogo: false },
      grid: { vertLines: { color: '#27272a' }, horzLines: { color: '#27272a' } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#3f3f46', mode: PriceScaleMode.Logarithmic },
      timeScale: { borderColor: '#3f3f46', timeVisible: false, secondsVisible: false },
      handleScroll: false,
      handleScale: false,
      localization: { priceFormatter: (p: number) => `${p - 100 >= 0 ? '+' : ''}${(p - 100).toFixed(0)}%` },
    })
    chartRef.current = chart

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.resize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    })
    ro.observe(containerRef.current)

    chart.subscribeCrosshairMove((param) => {
      if (!param.point || param.time == null) { setTip(null); return }
      const items: TipItem[] = []
      for (const [key, ser] of Object.entries(seriesRef.current)) {
        const d = param.seriesData.get(ser) as { value: number } | undefined
        if (d && typeof d.value === 'number') {
          const meta = metaRef.current[key]
          items.push({ key, label: meta?.label ?? key, color: meta?.color ?? '#a1a1aa', value: d.value - 100 })
        }
      }
      if (!items.length) { setTip(null); return }
      items.sort((a, b) => b.value - a.value)
      const w = containerRef.current?.clientWidth ?? 600
      const left = param.point.x > w * 0.58 ? Math.max(param.point.x - 172, 4) : param.point.x + 16
      setTip({ left, date: fmtDate(param.time as UTCTimestamp), items })
    })

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = {}
    }
  }, [])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    for (const key of Object.keys(seriesRef.current)) {
      const a = assets.find((x) => x.key === key)
      if (!a || !isOn(key)) {
        chart.removeSeries(seriesRef.current[key])
        delete seriesRef.current[key]
      }
    }
    let hasData = false
    for (const a of assets) {
      if (!isOn(a.key)) continue
      if (!seriesRef.current[a.key]) {
        seriesRef.current[a.key] = chart.addSeries(LineSeries, {
          color: a.color, lineWidth: a.width as 2 | 3, priceLineVisible: false, lastValueVisible: false,
        })
      }
      const nd = normalized[a.key]
      if (nd?.length) { seriesRef.current[a.key].setData(nd); hasData = true }
    }
    if (hasData) chart.timeScale().fitContent()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, normalized, visible])

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="border-b border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-1.5">
          <h3 className="text-sm font-semibold text-zinc-300">{symbol} vs Peers, Indexes &amp; Commodities</h3>
          <span
            title="Total-return growth of the stock vs US index/asset ETFs. The stock line is always shown; click any result card to add or remove its line. Hover the chart for point-in-time values."
            className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-zinc-600 text-[9px] leading-none text-zinc-400"
          >?</span>
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">Click a card below to plot it on the chart</p>
      </div>

      {/* Chart */}
      <div className="px-3 pt-3">
        <div className="relative h-72">
          <div ref={containerRef} className="h-full w-full" />
          {tip && (
            <div
              className="pointer-events-none absolute top-2 z-20 w-40 rounded-lg border border-neutral-700 bg-neutral-900/95 px-2.5 py-2 text-[11px] shadow-xl"
              style={{ left: tip.left }}
            >
              <p className="mb-1 font-semibold text-neutral-300">{tip.date}</p>
              {tip.items.map((it) => (
                <div key={it.key} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: it.color }} />
                  <span className="truncate font-medium" style={{ color: it.color }}>{it.label}</span>
                  <span className={`ml-auto font-mono font-semibold ${it.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {fmtPct(it.value)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        {isLoading && <p className="pt-1 text-center text-xs text-zinc-600">Loading history…</p>}
      </div>

      {/* Controls + grouped, clickable result cards */}
      <div className="border-t border-zinc-800 px-5 py-4">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
          <span>If you had invested</span>
          <span className="inline-flex h-9 items-center overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 focus-within:border-emerald-500">
            <span className="flex h-full items-center border-r border-zinc-700 px-2 text-xs font-medium text-zinc-400">$</span>
            <input
              type="number" min="1" value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-full w-24 bg-transparent px-2 text-sm font-mono font-semibold text-white focus:outline-none"
            />
          </span>
          <select
            value={periodKey}
            onChange={(e) => setPeriodKey(e.target.value)}
            className="h-9 rounded-lg border border-zinc-700 bg-zinc-800 px-2 text-sm font-semibold text-zinc-200 focus:border-emerald-500 focus:outline-none"
          >
            {PERIODS.map((p) => (
              <option key={p.key} value={p.key}>{p.desc}</option>
            ))}
          </select>
          {/* Reinvest dividends — box styled like the period select: green when on, gray when off */}
          <button
            type="button"
            role="switch"
            aria-checked={reinvest}
            onClick={() => setReinvest((r) => !r)}
            title={reinvest ? 'Dividends reinvested (total return) — click for price only' : 'Price change only — click to reinvest dividends'}
            className={`h-9 rounded-lg border px-3 text-sm font-semibold transition-colors ${reinvest ? '' : 'border-zinc-700 bg-zinc-800 text-zinc-400'}`}
            style={reinvest ? { borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981' } : undefined}
          >
            Reinvest dividends
          </button>
          <span>, you would have:</span>
        </div>

        <div className="grid grid-cols-3 gap-x-3 gap-y-4">
          {groups.map((g) => g.items.length > 0 && (
            <div key={g.title}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{g.title}</p>
              <div className="space-y-2">
                {g.items.map((r) => {
                  const on = isOn(r.key)
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => toggle(r.key)}
                      disabled={r.fixed}
                      title={r.fixed ? 'Always shown' : on ? 'Hide line' : 'Show on chart'}
                      className={`flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition-all ${r.fixed ? 'cursor-default' : 'hover:brightness-110'}`}
                      style={on ? { borderColor: r.color, backgroundColor: `${r.color}14` } : { borderColor: '#27272a', backgroundColor: 'rgba(39,39,42,0.4)' }}
                    >
                      <AssetLogo ticker={r.key} color={r.color} useLogo={r.useLogo} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold" style={{ color: r.color }}>{r.label}</p>
                        <p className="font-mono text-sm font-bold leading-tight text-white">{r.value != null ? fmt$(r.value) : '—'}</p>
                        {r.pct != null && (
                          <p className={`text-[11px] font-semibold tabular-nums ${r.pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{fmtPct(r.pct)}</p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {outperf != null && (
          <p className="mt-4 text-xs text-zinc-400">
            <span className="font-semibold text-white">{symbol}</span>{' '}
            {outperf >= 0 ? 'outperformed' : 'lagged'} the S&amp;P 500 by{' '}
            <span className={`font-semibold ${outperf >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {Math.abs(outperf).toFixed(2)}%
            </span>{' '}over this period.
          </p>
        )}
      </div>

      <div className="border-t border-zinc-800 px-5 py-2.5">
        <p className="text-center text-[11px] text-zinc-600">
          {reinvest
            ? '* Total return with dividends reinvested (adjusted close).'
            : '* Price change only, dividends excluded (raw close).'}{' '}
          Chart shows % growth from the start of the period. For informational purposes only.
        </p>
      </div>
    </div>
  )
}
