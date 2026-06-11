'use client'
import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { StockDetailData } from '@/lib/hooks/useStockDetail'
import { splitAdjustDividends } from '@/lib/dividend-utils'

interface DivRow {
  exDate: string
  paymentDate: string
  amount: number
  yieldPct: number | null
}

interface AnnualBar { year: number; total: number }

function fmt$(n: number) { return `$${n.toFixed(4)}` }

function fmtDate(iso: string) {
  // yyyy-mm-dd → mm/dd/yyyy
  const [y, m, d] = iso.split('-')
  return `${m}/${d}/${y}`
}

function addDays(isoDate: string, days: number): string {
  const d = new Date(isoDate)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function DividendsSection({ data }: { data: StockDetailData }) {
  const [showAll, setShowAll] = useState(false)
  const rawDivs = data.dividends ?? []
  const currentPrice = data.currentPrice

  // Apply split adjustment so all historical values reflect current per-share basis
  const divs = useMemo(
    () => splitAdjustDividends(rawDivs, data.splits ?? []),
    [rawDivs, data.splits]
  )

  // Compute payment-date gap from Yahoo Finance calendar data
  const paymentGap = useMemo(() => {
    const exDate = data.info?.exDividendDate
    const payDate = data.info?.dividendDate
    if (!exDate || !payDate) return 14
    const gap = Math.round(
      (new Date(payDate).getTime() - new Date(exDate).getTime()) / 86_400_000
    )
    return gap > 0 && gap < 60 ? gap : 14
  }, [data.info])

  const rows: DivRow[] = useMemo(() => {
    return divs.map((d) => {
      const exDate = d.date.split('T')[0]
      return {
        exDate,
        paymentDate: addDays(exDate, paymentGap),
        amount: d.dividend,
        yieldPct: currentPrice > 0 ? (d.dividend * 4 / currentPrice) * 100 : null,
      }
    })
  }, [divs, currentPrice, paymentGap])

  const annual: AnnualBar[] = useMemo(() => {
    const map: Record<number, number> = {}
    for (const d of divs) {
      const y = new Date(d.date).getFullYear()
      map[y] = (map[y] ?? 0) + d.dividend
    }
    return Object.entries(map)
      .map(([y, total]) => ({ year: parseInt(y), total }))
      .sort((a, b) => a.year - b.year)
  }, [divs])

  const maxAnnual = Math.max(...annual.map((a) => a.total), 0.001)
  const lastDiv = divs[0]
  const currentDY = data.info?.dividendYield
  const fiveYearAvgDY = annual.slice(-5).reduce((s, a) => s + a.total, 0) / 5
  const visibleRows = showAll ? rows : rows.slice(0, 8)

  // Pad to minimum 10 slots so bars are never oversized on companies with few years of data
  const MIN_SLOTS = 10
  const paddedAnnual: Array<{ year: number; total: number; empty: boolean }> = useMemo(() => {
    const real = annual.map((a) => ({ ...a, empty: false }))
    if (real.length >= MIN_SLOTS) return real
    const firstYear = real[0]?.year ?? new Date().getFullYear()
    const pads = Array.from({ length: MIN_SLOTS - real.length }, (_, i) => ({
      year: firstYear - (MIN_SLOTS - real.length) + i,
      total: 0,
      empty: true,
    }))
    return [...pads, ...real]
  }, [annual])

  if (!divs.length) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="mb-2 text-sm font-semibold text-zinc-300">Dividends</h3>
        <p className="text-sm text-zinc-500">This stock does not pay dividends.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Summary metrics */}
      <div className="border-b border-zinc-800 px-5 py-4">
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">Dividends</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Current DY</p>
            <p className="text-lg font-bold text-emerald-400">
              {currentDY ? `${(currentDY * 100).toFixed(2)}%` : '—'}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider">5Y Avg Annual</p>
            <p className="text-lg font-bold text-white">
              {fiveYearAvgDY > 0 ? fmt$(fiveYearAvgDY) : '—'}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Last Payment</p>
            <p className="text-lg font-bold text-white">
              {lastDiv ? fmt$(lastDiv.dividend) : '—'}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-500 uppercase tracking-wider">Ex-Date</p>
            <p className="text-lg font-bold text-white">
              {lastDiv ? fmtDate(lastDiv.date.split('T')[0]) : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Annual bar chart */}
      <div className="border-b border-zinc-800 px-5 py-4">
        <p className="mb-3 text-xs font-medium text-zinc-500">Annual dividends paid per share</p>
        <div className="relative h-20 flex items-end gap-0.5">
          {paddedAnnual.map((a) => {
            const barH = a.empty ? 0 : Math.max(Math.round((a.total / maxAnnual) * 72), 3)
            return (
              <div
                key={a.year}
                className="group relative flex flex-1 flex-col items-center justify-end h-full min-w-0 max-w-[40px]"
              >
                {a.empty ? (
                  <div className="w-full rounded-sm bg-zinc-800/60" style={{ height: 2 }} />
                ) : (
                  <>
                    <div
                      className="w-full rounded-sm bg-emerald-500/60 transition-all group-hover:bg-emerald-400"
                      style={{ height: barH }}
                    />
                    <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1.5 rounded-lg border border-zinc-600 bg-zinc-800 px-2.5 py-1.5 text-xs text-white whitespace-nowrap z-20 shadow-xl">
                      <span className="text-zinc-400">{a.year}</span>
                      <span className="font-semibold text-emerald-400">{fmt$(a.total)}</span>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
        <div className="mt-1.5 flex gap-0.5">
          {paddedAnnual.map((a, i) => (
            <div key={a.year} className="flex-1 min-w-0 max-w-[40px] text-center">
              {!a.empty && (i === 0 || i === Math.floor(paddedAnnual.length / 2) || i === paddedAnnual.length - 1) ? (
                <span className="text-[10px] text-zinc-600">{a.year}</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Dividend history table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Ex-Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Payment
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Amount
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Est. DY
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30 ${
                  i === 0 ? 'bg-emerald-500/5' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {i === 0 && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        Latest
                      </span>
                    )}
                    <span className="font-mono text-xs text-zinc-200">{fmtDate(row.exDate)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-zinc-400">{fmtDate(row.paymentDate)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono font-semibold text-white">{fmt$(row.amount)}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-zinc-400 text-xs">
                    {row.yieldPct != null ? `${row.yieldPct.toFixed(2)}%` : '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > 8 && (
        <div className="border-t border-zinc-800 px-5 py-3">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="flex w-full items-center justify-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showAll ? 'rotate-180' : ''}`} />
            {showAll ? 'Show less' : `Show all ${rows.length} dividends`}
          </button>
        </div>
      )}
    </div>
  )
}
