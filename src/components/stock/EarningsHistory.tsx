'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, ExternalLink, DollarSign, BarChart2, Wallet, Layers, Gift, FlaskConical, LineChart, type LucideIcon } from 'lucide-react'
import type { EdgarData, EdgarQuarter, EdgarAnnual, EdgarBalanceSheet, EdgarCapitalReturns } from '@/app/api/stocks/edgar/route'

function fmtB(n: number | null): string {
  if (n === null) return '—'
  const abs = Math.abs(n)
  const sign = n < 0 ? '-' : ''
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(1)}T`
  if (abs >= 1e9)  return `${sign}$${(abs / 1e9).toFixed(1)}B`
  if (abs >= 1e6)  return `${sign}$${(abs / 1e6).toFixed(0)}M`
  return `${sign}$${abs.toLocaleString()}`
}

function fmtEps(n: number | null): string {
  if (n === null) return '—'
  return `$${n.toFixed(2)}`
}

type Metric = 'revenue' | 'netIncome' | 'eps' | 'fcf' | 'balanceSheet' | 'capitalReturns' | 'rd'

// ── Balance Sheet ──────────────────────────────────────────────────────────

function BalanceSheetChart({ bs }: { bs: EdgarBalanceSheet[] }) {
  const maxAssets = Math.max(...bs.map(b => b.assets ?? 0), 1)

  return (
    <div className="space-y-3">
      {/* Grouped bar chart: Assets (zinc) / Cash (emerald) / LT Debt (red) per year */}
      <div className="flex items-end gap-3 h-20">
        {bs.map(b => {
          const aPct = b.assets      != null ? b.assets      / maxAssets * 100 : 4
          const cPct = b.cash        != null ? b.cash        / maxAssets * 100 : 0
          const dPct = b.longTermDebt!= null ? b.longTermDebt / maxAssets * 100 : 0
          return (
            <div key={b.year} className="flex flex-col items-center flex-1 gap-1">
              <div className="flex items-end gap-[2px] w-full" style={{ height: '64px' }}>
                <div className="flex-1 bg-zinc-600 rounded-t-sm" style={{ height: `${Math.max(aPct, 4)}%` }} title={`Assets: ${fmtB(b.assets)}`} />
                <div className="flex-1 bg-emerald-500 rounded-t-sm" style={{ height: `${Math.max(cPct, 2)}%` }} title={`Cash: ${fmtB(b.cash)}`} />
                <div className="flex-1 bg-red-500 rounded-t-sm" style={{ height: `${Math.max(dPct, 2)}%` }} title={`LT Debt: ${fmtB(b.longTermDebt)}`} />
              </div>
              <span className="text-[9px] text-zinc-600">{b.label}</span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-zinc-600" />Assets</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" />Cash</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-red-500" />LT Debt</span>
      </div>

      {/* Balance sheet table */}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-600">
            <th className="pb-2 text-left font-medium">Year</th>
            <th className="pb-2 text-right font-medium">Total Assets</th>
            <th className="pb-2 text-right font-medium">Cash</th>
            <th className="pb-2 text-right font-medium">LT Debt</th>
            <th className="pb-2 text-right font-medium">Equity</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {[...bs].reverse().map((b, i, arr) => {
            const prev       = arr[i + 1]
            const assetsUp   = prev?.assets != null && b.assets != null ? b.assets >= prev.assets : null
            const equityUp   = prev?.equity != null && b.equity != null ? b.equity >= prev.equity : null
            const debtUp     = prev?.longTermDebt != null && b.longTermDebt != null ? b.longTermDebt > prev.longTermDebt : null
            return (
              <tr key={b.year} className="hover:bg-zinc-800/30 transition-colors">
                <td className="py-2.5 font-semibold text-zinc-300">{b.label}</td>
                <td className="py-2.5 text-right tabular-nums">
                  <span className={`flex items-center justify-end gap-0.5 ${assetsUp === true ? 'text-emerald-400' : assetsUp === false ? 'text-red-400' : 'text-zinc-300'}`}>
                    {assetsUp === true && <TrendingUp className="h-3 w-3" />}
                    {assetsUp === false && <TrendingDown className="h-3 w-3" />}
                    {fmtB(b.assets)}
                  </span>
                </td>
                <td className="py-2.5 text-right tabular-nums text-emerald-400">
                  {fmtB(b.cash)}
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  <span className={debtUp === true ? 'text-red-400' : debtUp === false ? 'text-emerald-400' : 'text-zinc-400'}>
                    {fmtB(b.longTermDebt)}
                  </span>
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  <span className={`flex items-center justify-end gap-0.5 ${equityUp === true ? 'text-emerald-400' : equityUp === false ? 'text-red-400' : 'text-zinc-300'}`}>
                    {equityUp === true && <TrendingUp className="h-3 w-3" />}
                    {equityUp === false && <TrendingDown className="h-3 w-3" />}
                    {fmtB(b.equity)}
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

// ── R&D Chart ──────────────────────────────────────────────────────────────

function RdChart({ annual }: { annual: EdgarAnnual[] }) {
  const hasRd = annual.some(a => a.rdExpense != null)
  if (!hasRd) return (
    <p className="text-xs text-zinc-500 py-4 text-center">
      No R&amp;D expense data reported for this company.
    </p>
  )

  const max = Math.max(...annual.map(a => a.rdExpense ?? 0), 1)

  return (
    <div className="space-y-3">
      {/* Bar chart */}
      <div className="flex items-end gap-2 h-20">
        {annual.map((a, i) => {
          const prev  = annual[i - 1]
          const grew  = prev?.rdExpense != null && a.rdExpense != null ? a.rdExpense >= prev.rdExpense : true
          const pct   = a.rdExpense != null ? a.rdExpense / max * 100 : 4
          const margin = a.rdExpense != null && a.revenue != null
            ? `${(a.rdExpense / a.revenue * 100).toFixed(1)}%`
            : null
          return (
            <div key={a.year} className="flex flex-col items-center flex-1 gap-1 group relative">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex whitespace-nowrap rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-200 z-10 border border-zinc-700">
                {fmtB(a.rdExpense)}{margin ? ` · ${margin} of rev` : ''}
              </div>
              <div className="w-full flex items-end justify-center" style={{ height: '64px' }}>
                <div
                  className={`w-full rounded-t-sm ${grew ? 'bg-violet-500' : 'bg-violet-500/50'}`}
                  style={{ height: `${Math.max(pct, 4)}%` }}
                />
              </div>
              <span className="text-[9px] text-zinc-600">{a.label}</span>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-600">
            <th className="pb-2 text-left font-medium">Year</th>
            <th className="pb-2 text-right font-medium">R&amp;D Spend</th>
            <th className="pb-2 text-right font-medium">Revenue</th>
            <th className="pb-2 text-right font-medium">% of Revenue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {[...annual].reverse().map((a, i, arr) => {
            const prev   = arr[i + 1]
            const rdUp   = prev?.rdExpense != null && a.rdExpense != null ? a.rdExpense >= prev.rdExpense : null
            const margin = a.rdExpense != null && a.revenue != null
              ? (a.rdExpense / a.revenue * 100)
              : null
            const prevMargin = prev?.rdExpense != null && prev?.revenue != null
              ? (prev.rdExpense / prev.revenue * 100)
              : null
            const marginUp = margin != null && prevMargin != null ? margin >= prevMargin : null
            return (
              <tr key={a.year} className="hover:bg-zinc-800/30 transition-colors">
                <td className="py-2.5 font-semibold text-zinc-300">{a.label}</td>
                <td className="py-2.5 text-right tabular-nums">
                  <span className={`flex items-center justify-end gap-0.5 text-violet-400 font-semibold`}>
                    {rdUp === true && <TrendingUp className="h-3 w-3" />}
                    {rdUp === false && <TrendingDown className="h-3 w-3" />}
                    {fmtB(a.rdExpense)}
                  </span>
                </td>
                <td className="py-2.5 text-right tabular-nums text-zinc-400">
                  {fmtB(a.revenue)}
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  <span className={marginUp === true ? 'text-violet-400' : marginUp === false ? 'text-zinc-400' : 'text-zinc-300'}>
                    {margin != null ? `${margin.toFixed(1)}%` : '—'}
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

// ── Capital Returns Chart ──────────────────────────────────────────────────

function fmtShares(n: number | null): string {
  if (n === null) return '—'
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(0)}M`
  return n.toLocaleString()
}

function CapitalReturnsChart({ cr }: { cr: EdgarCapitalReturns[] }) {
  const maxTotal = Math.max(...cr.map(c => c.totalReturned ?? 0), 1)
  const maxShares = Math.max(...cr.map(c => c.sharesOutstanding ?? 0), 1)
  const minShares = Math.min(...cr.filter(c => c.sharesOutstanding != null).map(c => c.sharesOutstanding!))

  return (
    <div className="space-y-3">
      {/* Stacked bar: buybacks (violet) + dividends (emerald) */}
      <div className="flex items-end gap-2 h-20">
        {cr.map((c, i) => {
          const prev     = cr[i - 1]
          const grew     = prev?.totalReturned != null && c.totalReturned != null ? c.totalReturned >= prev.totalReturned : true
          const totalPct = c.totalReturned != null ? c.totalReturned / maxTotal * 100 : 4
          const bbPct    = c.totalReturned && c.buybacks != null ? c.buybacks / c.totalReturned * 100 : 100
          const divPct   = 100 - bbPct
          return (
            <div key={c.year} className="flex flex-col items-center flex-1 gap-1 group relative">
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 hidden group-hover:flex whitespace-nowrap rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-200 z-10 border border-zinc-700">
                {fmtB(c.totalReturned)}
              </div>
              <div className="w-full flex items-end justify-center" style={{ height: '64px' }}>
                <div
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${Math.max(totalPct, 4)}%`,
                    background: divPct > 1
                      ? `linear-gradient(to top, #10b981 ${divPct}%, #8b5cf6 ${divPct}%)`
                      : '#8b5cf6',
                    opacity: grew ? 1 : 0.65,
                  }}
                />
              </div>
              <span className="text-[9px] text-zinc-600">{c.label}</span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-violet-500" />Buybacks</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-emerald-500" />Dividends</span>
      </div>

      {/* Shares outstanding mini-trend */}
      {cr.some(c => c.sharesOutstanding != null) && (
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1.5">Shares Outstanding</p>
          <div className="flex items-end gap-1 h-8">
            {cr.map(c => {
              const range  = maxShares - minShares || 1
              const pct    = c.sharesOutstanding != null ? ((c.sharesOutstanding - minShares) / range * 60 + 20) : 4
              return (
                <div key={c.year} className="flex flex-col items-center flex-1 gap-0.5 group relative">
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:flex whitespace-nowrap rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-zinc-200 z-10 border border-zinc-700">
                    {fmtShares(c.sharesOutstanding)}
                  </div>
                  <div className="w-full flex items-end justify-center" style={{ height: '28px' }}>
                    <div className="w-full rounded-t-sm bg-zinc-600" style={{ height: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-600">
            <th className="pb-2 text-left font-medium">Year</th>
            <th className="pb-2 text-right font-medium">Buybacks</th>
            <th className="pb-2 text-right font-medium">Dividends</th>
            <th className="pb-2 text-right font-medium">Total Returned</th>
            <th className="pb-2 text-right font-medium">Shares</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {[...cr].reverse().map((c, i, arr) => {
            const prev    = arr[i + 1]
            const totalUp = prev?.totalReturned != null && c.totalReturned != null ? c.totalReturned >= prev.totalReturned : null
            const sharesDown = prev?.sharesOutstanding != null && c.sharesOutstanding != null ? c.sharesOutstanding < prev.sharesOutstanding : null
            return (
              <tr key={c.year} className="hover:bg-zinc-800/30 transition-colors">
                <td className="py-2.5 font-semibold text-zinc-300">{c.label}</td>
                <td className="py-2.5 text-right tabular-nums text-violet-400">
                  {fmtB(c.buybacks)}
                </td>
                <td className="py-2.5 text-right tabular-nums text-emerald-400">
                  {c.dividendsPaid != null ? fmtB(c.dividendsPaid) : '—'}
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  <span className={`flex items-center justify-end gap-0.5 font-semibold ${totalUp === true ? 'text-emerald-400' : totalUp === false ? 'text-red-400' : 'text-zinc-300'}`}>
                    {totalUp === true && <TrendingUp className="h-3 w-3" />}
                    {totalUp === false && <TrendingDown className="h-3 w-3" />}
                    {fmtB(c.totalReturned)}
                  </span>
                </td>
                <td className="py-2.5 text-right tabular-nums">
                  <span className={sharesDown === true ? 'text-emerald-400' : sharesDown === false ? 'text-red-400' : 'text-zinc-400'}>
                    {fmtShares(c.sharesOutstanding)}
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

// ── FCF Chart ──────────────────────────────────────────────────────────────

function FcfChart({ annual }: { annual: EdgarAnnual[] }) {
  const max = Math.max(...annual.map(a => Math.abs(a.fcf ?? 0)), 1)
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2 h-20">
        {annual.map((a, i) => {
          const prev = annual[i - 1]
          const grew = prev?.fcf != null && a.fcf != null ? a.fcf >= prev.fcf : true
          const pct  = a.fcf != null ? Math.abs(a.fcf) / max * 100 : 4
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
            const prev  = arr[i + 1]
            const fcfUp = prev?.fcf != null && a.fcf != null ? a.fcf >= prev.fcf : null
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

// ── Mini Bar (quarterly) ───────────────────────────────────────────────────

type QuarterlyMetric = 'revenue' | 'netIncome' | 'eps'

function MiniBar({ quarters, metric }: { quarters: EdgarQuarter[]; metric: QuarterlyMetric }) {
  const values = quarters.map(q => q[metric] ?? 0)
  const max = Math.max(...values.map(Math.abs))
  if (max === 0) return null

  return (
    <div className="flex items-end gap-1 h-16">
      {quarters.map((q, i) => {
        const val  = q[metric] ?? 0
        const pct  = max > 0 ? Math.abs(val) / max * 100 : 0
        const isUp = val >= 0
        const prev = i > 0 ? (quarters[i - 1][metric] ?? 0) : val
        const grew = val >= prev
        return (
          <div key={q.frame} className="flex flex-col items-center flex-1 gap-1 group relative">
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

// ── Main Component ─────────────────────────────────────────────────────────

export function EarningsHistory({ symbol }: { symbol: string }) {
  const [tab, setTab] = useState<Metric>('revenue')

  const { data, isLoading, isError } = useQuery<EdgarData>({
    queryKey: ['edgar', symbol],
    queryFn:  () => fetch(`/api/stocks/edgar?symbol=${symbol}`).then(r => r.json()),
    staleTime: 5 * 60 * 60_000,
    retry: 1,
  })

  const TABS: { key: Metric; label: string; short: string; icon: LucideIcon }[] = [
    { key: 'revenue',        label: 'Revenue',        short: 'Revenue',  icon: DollarSign },
    { key: 'netIncome',      label: 'Net Income',     short: 'Net Inc.', icon: LineChart },
    { key: 'eps',            label: 'EPS',            short: 'EPS',      icon: BarChart2 },
    { key: 'fcf',            label: 'Free Cash Flow', short: 'FCF',      icon: Wallet },
    { key: 'balanceSheet',   label: 'Balance Sheet',  short: 'Balance',  icon: Layers },
    { key: 'capitalReturns', label: 'Capital Returns',short: 'Returns',  icon: Gift },
    { key: 'rd',             label: 'R&D Spending',   short: 'R&D',      icon: FlaskConical },
  ]

  const activeTab = TABS.find(t => t.key === tab)!
  const isQuarterly = tab === 'revenue' || tab === 'netIncome' || tab === 'eps'

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Earnings History</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">SEC EDGAR · official filings</p>
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
          {/* View selector — scrollable pills on mobile */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-2">Select view</p>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
              {TABS.map(t => {
                const Icon = t.icon
                const active = tab === t.key
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      active
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400'
                        : 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">{t.label}</span>
                    <span className="sm:hidden">{t.short}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Active view label */}
          <div className="flex items-center gap-2">
            {(() => { const Icon = activeTab.icon; return <Icon className="h-4 w-4 text-emerald-400" /> })()}
            <p className="text-sm font-semibold text-zinc-200">{activeTab.label}</p>
            {isQuarterly && <span className="text-[10px] text-zinc-600 ml-1">quarterly</span>}
            {!isQuarterly && <span className="text-[10px] text-zinc-600 ml-1">annual</span>}
          </div>

          {/* R&D tab */}
          {tab === 'rd' && <RdChart annual={data.annual ?? []} />}

          {/* Capital Returns tab */}
          {tab === 'capitalReturns' && (
            data.capitalReturns?.length > 0
              ? <CapitalReturnsChart cr={data.capitalReturns} />
              : <p className="text-xs text-zinc-500 py-4 text-center">Capital returns data not available for {symbol}.</p>
          )}

          {/* Balance Sheet tab */}
          {tab === 'balanceSheet' && (
            data.balanceSheet?.length > 0
              ? <BalanceSheetChart bs={data.balanceSheet} />
              : <p className="text-xs text-zinc-500 py-4 text-center">Balance sheet data not available for {symbol}.</p>
          )}

          {/* FCF tab */}
          {tab === 'fcf' && (
            data.annual?.length > 0
              ? <FcfChart annual={data.annual} />
              : <p className="text-xs text-zinc-500 py-4 text-center">Cash flow data not available for {symbol}.</p>
          )}

          {/* Quarterly bar chart */}
          {isQuarterly && <MiniBar quarters={data.quarters} metric={tab as QuarterlyMetric} />}

          {/* Quarterly table */}
          {isQuarterly && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-600">
                    <th className="pb-2 text-left font-medium">Quarter</th>
                    <th className={`pb-2 text-right font-medium ${tab === 'revenue' ? 'text-zinc-300' : ''}`}>Revenue</th>
                    <th className={`pb-2 text-right font-medium ${tab === 'netIncome' ? 'text-zinc-300' : ''}`}>Net Income</th>
                    <th className={`pb-2 text-right font-medium ${tab === 'eps' ? 'text-zinc-300' : ''}`}>EPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {[...data.quarters].reverse().map((q, i, arr) => {
                    const prev  = arr[i + 1]
                    const epsUp = prev?.eps != null && q.eps != null ? q.eps >= prev.eps : null
                    const revUp = prev?.revenue != null && q.revenue != null ? q.revenue >= prev.revenue : null
                    const niUp  = prev?.netIncome != null && q.netIncome != null ? q.netIncome >= prev.netIncome : null
                    return (
                      <tr key={q.frame} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="py-2.5 text-zinc-300 font-semibold">{q.label}</td>
                        <td className={`py-2.5 text-right tabular-nums ${tab !== 'revenue' ? 'opacity-40' : ''}`}>
                          <span className={revUp === true ? 'text-emerald-400' : revUp === false ? 'text-red-400' : 'text-zinc-300'}>
                            {fmtB(q.revenue)}
                          </span>
                        </td>
                        <td className={`py-2.5 text-right tabular-nums ${tab !== 'netIncome' ? 'opacity-40' : ''}`}>
                          <span className={niUp === true ? 'text-emerald-400' : niUp === false ? 'text-red-400' : 'text-zinc-300'}>
                            {fmtB(q.netIncome)}
                          </span>
                        </td>
                        <td className={`py-2.5 text-right tabular-nums ${tab !== 'eps' ? 'opacity-40' : ''}`}>
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
            </div>
          )}

          <p className="text-[10px] text-zinc-700 text-right">
            Source: SEC EDGAR official filings · updated quarterly
          </p>
        </div>
      ) : null}
    </div>
  )
}
