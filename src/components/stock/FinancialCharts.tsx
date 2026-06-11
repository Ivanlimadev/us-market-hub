'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { YFFinancials, YFFinancialRow } from '@/lib/yahoo-finance'

// ── helpers ────────────────────────────────────────────────────────────────

function fmtLarge(n: number | null): string {
  if (n === null) return '—'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`
  if (abs >= 1e9)  return `${sign}$${(abs / 1e9).toFixed(2)}B`
  if (abs >= 1e6)  return `${sign}$${(abs / 1e6).toFixed(2)}M`
  return `${sign}$${abs.toLocaleString()}`
}

function fmtEps(n: number | null): string {
  if (n === null) return '—'
  return `${n >= 0 ? '' : '-'}$${Math.abs(n).toFixed(2)}`
}

function fmtCagr(n: number | null): string {
  if (n === null) return '—'
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

function shortDate(date: string, isQuarterly: boolean): string {
  if (!date) return ''
  const d = new Date(date)
  if (isQuarterly) {
    const q = Math.floor(d.getMonth() / 3) + 1
    return `Q${q}'${String(d.getFullYear()).slice(2)}`
  }
  return String(d.getFullYear())
}

type MetricKey = 'revenue' | 'netIncome' | 'eps'

const METRICS: { key: MetricKey; label: string; fmt: (n: number | null) => string }[] = [
  { key: 'revenue',      label: 'Revenue',    fmt: fmtLarge },
  { key: 'netIncome',    label: 'Net Income', fmt: fmtLarge },
  { key: 'eps',          label: 'EPS',        fmt: fmtEps  },
]

// ── bar chart ──────────────────────────────────────────────────────────────

const BAR_H = 80 // max bar height in px

function BarChart({
  rows,
  metricKey,
  isQuarterly,
  fmtFn,
}: {
  rows: YFFinancialRow[]
  metricKey: MetricKey
  isQuarterly: boolean
  fmtFn: (n: number | null) => string
}) {
  const values = rows.map((r) => r[metricKey] as number | null)
  const nums   = values.filter((v): v is number => v !== null)
  const max    = Math.max(...nums.map(Math.abs), 0.001)

  return (
    <div className="flex items-end gap-1 h-24 relative">
      {/* baseline */}
      <div className="absolute bottom-5 left-0 right-0 h-px bg-zinc-700/60" />

      {rows.map((row, i) => {
        const val = values[i]
        const isPos = val === null || val >= 0
        const barH  = val === null ? 0 : Math.max(Math.round((Math.abs(val) / max) * BAR_H), 3)
        const date  = shortDate(row.date, isQuarterly)

        return (
          <div
            key={row.date}
            className="group relative flex flex-1 flex-col items-center justify-end"
            style={{ height: BAR_H + 20 }} // +20 for label
          >
            {/* bar */}
            <div
              className={`w-full rounded-t-sm transition-all ${
                val === null
                  ? 'bg-zinc-700/30'
                  : isPos
                  ? 'bg-emerald-500/70 group-hover:bg-emerald-400'
                  : 'bg-red-500/70 group-hover:bg-red-400'
              }`}
              style={{ height: val === null ? 3 : barH }}
            />

            {/* label */}
            <span className="mt-1.5 block text-center text-[10px] text-zinc-600">{date}</span>

            {/* tooltip */}
            {val !== null && (
              <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1.5 rounded-lg border border-zinc-600 bg-zinc-800 px-2.5 py-1.5 text-xs text-white whitespace-nowrap z-20 shadow-xl">
                <span className="text-zinc-400">{date}</span>
                <span className={`font-semibold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                  {fmtFn(val)}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── hook ───────────────────────────────────────────────────────────────────

function useFinancials(symbol: string) {
  return useQuery<YFFinancials>({
    queryKey: ['financials', symbol],
    queryFn: () => fetch(`/api/stocks/${symbol}/financials`).then((r) => r.json()),
    staleTime: 60 * 60_000,
  })
}

// ── main component ─────────────────────────────────────────────────────────

export function FinancialCharts({ symbol }: { symbol: string }) {
  const [period, setPeriod]   = useState<'annual' | 'quarterly'>('annual')
  const [metric, setMetric]   = useState<MetricKey>('revenue')
  const { data, isLoading }   = useFinancials(symbol)

  const rows      = data?.[period] ?? []
  const metricDef = METRICS.find((m) => m.key === metric)!
  const hasData   = rows.length > 0

  const cagrRevenue    = data?.cagr5yRevenue ?? null
  const cagrNetIncome  = data?.cagr5yNetIncome ?? null

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-300">Revenue &amp; Earnings</h3>
          {period === 'annual' && (cagrRevenue !== null || cagrNetIncome !== null) && (
            <p className="mt-0.5 text-xs text-zinc-500">
              CAGR {rows.length > 1 ? `${rows.length - 1}Y` : ''}&nbsp;·&nbsp;
              {cagrRevenue !== null && (
                <span>Revenue <span className={cagrRevenue >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtCagr(cagrRevenue)}</span></span>
              )}
              {cagrRevenue !== null && cagrNetIncome !== null && <span className="mx-1 text-zinc-700">|</span>}
              {cagrNetIncome !== null && (
                <span>Net Income <span className={cagrNetIncome >= 0 ? 'text-emerald-400' : 'text-red-400'}>{fmtCagr(cagrNetIncome)}</span></span>
              )}
            </p>
          )}
        </div>

        {/* Period toggle */}
        <div className="flex rounded-lg border border-zinc-700 overflow-hidden text-xs font-medium">
          {(['annual', 'quarterly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 transition-colors capitalize ${
                period === p ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Metric tabs */}
      <div className="flex gap-1 border-b border-zinc-800 px-5 py-2">
        {METRICS.map((m) => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              metric === m.key
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="px-5 py-4">
        {isLoading ? (
          <div className="flex items-end gap-1 h-24">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 animate-pulse rounded-t-sm bg-zinc-800"
                style={{ height: [40, 64, 52, 72][i] }}
              />
            ))}
          </div>
        ) : !hasData ? (
          <div className="flex h-24 items-center justify-center text-sm text-zinc-500">
            No financial data available
          </div>
        ) : (
          <BarChart
            rows={rows}
            metricKey={metric}
            isQuarterly={period === 'quarterly'}
            fmtFn={metricDef.fmt}
          />
        )}
      </div>

      {/* Latest values summary row */}
      {!isLoading && hasData && (
        <div className="grid grid-cols-3 border-t border-zinc-800">
          {METRICS.map((m, i) => {
            const latestRow = rows[rows.length - 1]
            const val = latestRow?.[m.key] as number | null
            const isPos = val === null || val >= 0
            return (
              <div
                key={m.key}
                className={`px-4 py-3 ${i < 2 ? 'border-r border-zinc-800' : ''}`}
              >
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">{m.label}</p>
                <p className={`mt-0.5 font-mono text-sm font-semibold ${
                  val === null ? 'text-zinc-600' : isPos ? 'text-white' : 'text-red-400'
                }`}>
                  {m.fmt(val)}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
