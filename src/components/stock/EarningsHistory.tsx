'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, ExternalLink } from 'lucide-react'
import type { EdgarData, EdgarQuarter, EdgarAnnual } from '@/app/api/stocks/edgar/route'

function fmtB(n: number | null): string {
  if (n === null) return '—'
  const b = n / 1e9
  return `$${b.toFixed(2)}B`
}

function fmtEps(n: number | null): string {
  if (n === null) return '—'
  return `$${n.toFixed(2)}`
}

type Metric = 'revenue' | 'netIncome' | 'eps' | 'fcf'

function FcfChart({ annual }: { annual: EdgarAnnual[] }) {
  const max = Math.max(...annual.map(a => Math.abs(a.fcf ?? 0)), 1)
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 h-20">
        {annual.map((a, i) => {
          const prev  = annual[i - 1]
          const grew  = prev?.fcf != null && a.fcf != null ? a.fcf >= prev.fcf : true
          const pct   = a.fcf != null ? Math.abs(a.fcf) / max * 100 : 4
          return (
            <div key={a.year} className="flex flex-col items-center flex-1 gap-1 group relative">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex whitespace-nowrap rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-200 z-10 border border-zinc-700">
                {a.fcf != null ? `$${(a.fcf/1e9).toFixed(1)}B` : '—'}
              </div>
              <div className="w-full flex items-end justify-center" style={{ height: '64px' }}>
                <div
                  className={`w-full rounded-t-sm ${grew ? 'bg-emerald-500' : 'bg-red-500'}`}
                  style={{ height: `${Math.max(pct, 4)}%` }}
                />
              </div>
              <span className="text-[9px] text-zinc-600">{a.label}</span>
            </div>
          )
        })}
      </div>

      {/* FCF table */}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-600">
            <th className="pb-2 text-left font-medium">Year</th>
            <th className="pb-2 text-right font-medium">Operating CF</th>
            <th className="pb-2 text-right font-medium">CapEx</th>
            <th className="pb-2 text-right font-medium">Free Cash Flow</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {[...annual].reverse().map((a, i, arr) => {
            const prev   = arr[i + 1]
            const fcfUp  = prev?.fcf != null && a.fcf != null ? a.fcf >= prev.fcf : null
            return (
              <tr key={a.year} className="hover:bg-zinc-800/30 transition-colors">
                <td className="py-2.5 font-semibold text-zinc-300">{a.label}</td>
                <td className="py-2.5 text-right tabular-nums text-zinc-300">
                  {a.operatingCf != null ? `$${(a.operatingCf/1e9).toFixed(1)}B` : '—'}
                </td>
                <td className="py-2.5 text-right tabular-nums text-red-400">
                  {a.capex != null ? `-$${Math.abs(a.capex/1e9).toFixed(1)}B` : '—'}
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  <span className={`flex items-center justify-end gap-0.5 font-semibold ${fcfUp === true ? 'text-emerald-400' : fcfUp === false ? 'text-red-400' : 'text-zinc-300'}`}>
                    {fcfUp === true && <TrendingUp className="h-3 w-3" />}
                    {fcfUp === false && <TrendingDown className="h-3 w-3" />}
                    {a.fcf != null ? `$${(a.fcf/1e9).toFixed(1)}B` : '—'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function MiniBar({ quarters, metric }: { quarters: EdgarQuarter[]; metric: Metric }) {
  const values = quarters.map(q => q[metric] ?? 0)
  const max = Math.max(...values.map(Math.abs))
  if (max === 0) return null

  return (
    <div className="flex items-end gap-1 h-16">
      {quarters.map((q, i) => {
        const val   = q[metric] ?? 0
        const pct   = max > 0 ? Math.abs(val) / max * 100 : 0
        const isUp  = val >= 0
        const prev  = i > 0 ? (quarters[i - 1][metric] ?? 0) : val
        const grew  = val >= prev
        return (
          <div key={q.frame} className="flex flex-col items-center flex-1 gap-1 group relative">
            {/* Tooltip */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex whitespace-nowrap rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-200 z-10 border border-zinc-700">
              {metric === 'eps' ? fmtEps(q[metric]) : fmtB(q[metric])}
            </div>
            <div className="w-full flex items-end justify-center" style={{ height: '52px' }}>
              <div
                className={`w-full rounded-t-sm transition-all ${grew ? 'bg-emerald-500' : 'bg-red-500'} ${isUp ? '' : 'opacity-60'}`}
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
            </div>
            <span className="text-[9px] text-zinc-600 truncate w-full text-center">{q.label.replace(' ', '\n')}</span>
          </div>
        )
      })}
    </div>
  )
}

export function EarningsHistory({ symbol }: { symbol: string }) {
  const [tab, setTab] = useState<Metric>('revenue')

  const { data, isLoading, isError } = useQuery<EdgarData>({
    queryKey: ['edgar', symbol],
    queryFn:  () => fetch(`/api/stocks/edgar?symbol=${symbol}`).then(r => r.json()),
    staleTime: 5 * 60 * 60_000,
    retry: 1,
  })

  const TABS: { key: Metric; label: string }[] = [
    { key: 'revenue',   label: 'Revenue' },
    { key: 'netIncome', label: 'Net Income' },
    { key: 'eps',       label: 'EPS' },
    { key: 'fcf',       label: 'Free Cash Flow' },
  ]

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Earnings History</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            SEC EDGAR · official filings
          </p>
        </div>
        <a
          href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${data?.cik ?? ''}&type=10-Q&dateb=&owner=include&count=10`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          SEC filings <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {isLoading && (
        <div className="p-5 space-y-4 animate-pulse">
          <div className="h-16 rounded bg-zinc-800" />
          <div className="space-y-2">
            {[1,2,3,4].map(i => <div key={i} className="h-8 rounded bg-zinc-800" />)}
          </div>
        </div>
      )}

      {isError && (
        <div className="px-5 py-8 text-center text-xs text-zinc-500">
          No financial data available for {symbol}.
        </div>
      )}

      {!isLoading && !isError && data?.quarters.length ? (
        <div className="p-5 space-y-4">
          {/* Metric tabs */}
          <div className="flex gap-1 rounded-lg border border-zinc-800 bg-zinc-950 p-1 w-fit">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  tab === t.key ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* FCF tab — annual data */}
          {tab === 'fcf' && data.annual?.length > 0 && (
            <FcfChart annual={data.annual} />
          )}

          {/* Bar chart — quarterly */}
          {tab !== 'fcf' && <MiniBar quarters={data.quarters} metric={tab} />}

          {/* Table — quarterly (hidden on FCF tab) */}
          {tab !== 'fcf' && <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-600">
                  <th className="pb-2 text-left font-medium">Quarter</th>
                  <th className="pb-2 text-right font-medium">Revenue</th>
                  <th className="pb-2 text-right font-medium">Net Income</th>
                  <th className="pb-2 text-right font-medium">EPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {[...data.quarters].reverse().map((q, i, arr) => {
                  const prev = arr[i + 1]
                  const epsUp = prev?.eps != null && q.eps != null ? q.eps >= prev.eps : null
                  const revUp = prev?.revenue != null && q.revenue != null ? q.revenue >= prev.revenue : null
                  const niUp  = prev?.netIncome != null && q.netIncome != null ? q.netIncome >= prev.netIncome : null

                  return (
                    <tr key={q.frame} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2.5 text-zinc-300 font-semibold">{q.label}</td>
                      <td className="py-2.5 text-right tabular-nums">
                        <span className={revUp === true ? 'text-emerald-400' : revUp === false ? 'text-red-400' : 'text-zinc-300'}>
                          {fmtB(q.revenue)}
                        </span>
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        <span className={niUp === true ? 'text-emerald-400' : niUp === false ? 'text-red-400' : 'text-zinc-300'}>
                          {fmtB(q.netIncome)}
                        </span>
                      </td>
                      <td className="py-2.5 text-right tabular-nums">
                        <span className={`flex items-center justify-end gap-0.5 ${epsUp === true ? 'text-emerald-400' : epsUp === false ? 'text-red-400' : 'text-zinc-300'}`}>
                          {epsUp === true && <TrendingUp className="h-3 w-3" />}
                          {epsUp === false && <TrendingDown className="h-3 w-3" />}
                          {fmtEps(q.eps)}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>}

          <p className="text-[10px] text-zinc-700 text-right">
            Source: SEC EDGAR official filings · updated quarterly
          </p>
        </div>
      ) : null}
    </div>
  )
}
