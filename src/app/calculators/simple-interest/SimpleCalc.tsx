'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'

type RateMode   = 'annual' | 'monthly'
type PeriodMode = 'years'  | 'months'

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)

interface Row { label: string; interest: number; balance: number }

function calcSimple(
  principal: number,
  rate: number,
  rateMode: RateMode,
  period: number,
  periodMode: PeriodMode,
): { finalValue: number; totalInterest: number; rows: Row[] } {
  // Convert everything to monthly periods and monthly rate
  const rateMonthly = rateMode === 'annual' ? rate / 12 : rate
  const months      = periodMode === 'years' ? Math.round(period * 12) : Math.round(period)

  const rows: Row[] = [{ label: 'Start', interest: 0, balance: principal }]

  for (let m = 1; m <= months; m++) {
    const interest = principal * (rateMonthly / 100) * m
    const isYearEnd = m % 12 === 0
    const isLast    = m === months
    if (isYearEnd || isLast) {
      const label = periodMode === 'years'
        ? `Year ${m / 12}`
        : `Month ${m}`
      rows.push({ label, interest, balance: principal + interest })
    }
  }

  const totalInterest = principal * (rateMonthly / 100) * months
  return { finalValue: principal + totalInterest, totalInterest, rows }
}

function LineChart({ rows }: { rows: Row[] }) {
  if (rows.length < 2) return null
  const W = 500, H = 130
  const maxY = Math.max(...rows.map(r => r.balance), 1)
  const nx = (i: number) => ((i / (rows.length - 1)) * W).toFixed(1)
  const ny = (v: number) => (H - (v / maxY) * H).toFixed(1)
  const linePts = rows.map((r, i) => `${i === 0 ? 'M' : 'L'}${nx(i)},${ny(r.balance)}`).join(' ')
  const last    = rows.length - 1

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 130 }}>
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <path d={`${linePts} L${nx(last)},${H} L0,${H}Z`} fill="url(#sg)" />
      <path d={linePts} fill="none" stroke="#60a5fa" strokeWidth="2" />
    </svg>
  )
}

function Toggle<T extends string>({ options, value, onChange }: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-lg border border-zinc-700 overflow-hidden shrink-0">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={`flex-1 px-3 py-2.5 text-xs font-semibold transition-colors ${value === o.value ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function SimpleCalc() {
  const [principal,  setPrincipal]  = useState('10000')
  const [rate,       setRate]       = useState('10')
  const [rateMode,   setRateMode]   = useState<RateMode>('annual')
  const [period,     setPeriod]     = useState('5')
  const [periodMode, setPeriodMode] = useState<PeriodMode>('years')

  const result = useMemo(() => {
    const p = parseFloat(principal) || 0
    const r = parseFloat(rate)      || 0
    const n = parseFloat(period)    || 0
    if (n <= 0 || r < 0 || p < 0) return null
    return calcSimple(p, r, rateMode, n, periodMode)
  }, [principal, rate, rateMode, period, periodMode])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="mb-6 text-xs text-zinc-500">
        <Link href="/calculators" className="hover:text-zinc-300 transition-colors">Calculators</Link>
        <span className="mx-1.5">›</span>
        <span className="text-zinc-300">Simple Interest</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold text-zinc-100">Simple Interest Calculator</h1>
      <p className="mb-8 max-w-2xl text-zinc-400 leading-relaxed">
        Calculate returns on fixed-income investments where interest is applied only to the original
        principal. Unlike compound interest, there is no reinvestment - returns grow linearly.
      </p>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Inputs */}
        <div className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-zinc-300">Parameters</h2>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-400">Principal ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 select-none">$</span>
              <input type="number" value={principal} onChange={e => setPrincipal(e.target.value)}
                min={0} step={100}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-7 pr-3 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-400">Interest rate</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input type="number" value={rate} onChange={e => setRate(e.target.value)}
                  min={0} step={0.1}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-3 pr-8 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 select-none">%</span>
              </div>
              <Toggle
                options={[{ label: 'Annual', value: 'annual' as RateMode }, { label: 'Monthly', value: 'monthly' as RateMode }]}
                value={rateMode} onChange={setRateMode}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-400">Period</label>
            <div className="flex gap-2">
              <input type="number" value={period} onChange={e => setPeriod(e.target.value)}
                min={1} step={1}
                className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-3 pr-3 text-sm text-zinc-100 focus:border-blue-500 focus:outline-none transition-colors"
              />
              <Toggle
                options={[{ label: 'Years', value: 'years' as PeriodMode }, { label: 'Months', value: 'months' as PeriodMode }]}
                value={periodMode} onChange={setPeriodMode}
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="min-w-0 space-y-4">
          {result ? (
            <>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { label: 'Final amount',   value: result.finalValue,     cls: 'text-blue-400' },
                  { label: 'Principal',       value: parseFloat(principal) || 0, cls: 'text-zinc-200' },
                  { label: 'Total interest', value: result.totalInterest, cls: 'text-amber-400' },
                ].map(c => (
                  <div key={c.label} className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900 p-3 sm:p-4">
                    <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-[10px]">{c.label}</p>
                    <p className={`mt-1 truncate text-sm font-bold leading-tight tabular-nums sm:text-lg ${c.cls}`}>{usd(c.value)}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="mb-3 text-sm font-semibold text-zinc-300">Balance over time</p>
                <LineChart rows={result.rows} />
              </div>

              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                <div className="border-b border-zinc-800 px-4 py-3 sm:px-5">
                  <p className="text-sm font-semibold text-zinc-300">Period breakdown</p>
                </div>
                <div className="max-h-72 overflow-x-auto overflow-y-auto">
                  <table className="w-full min-w-[280px] text-sm">
                    <thead className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/95">
                      <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                        <th className="px-3 py-2 sm:px-5">Period</th>
                        <th className="px-3 py-2 text-right sm:px-5">Balance</th>
                        <th className="px-3 py-2 text-right sm:px-5">Interest earned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {result.rows.map((row, i) => (
                        <tr key={i} className="transition-colors hover:bg-zinc-800/30">
                          <td className="px-3 py-2 text-zinc-400 sm:px-5">{row.label}</td>
                          <td className="px-3 py-2 text-right font-medium tabular-nums text-zinc-200 sm:px-5">{usd(row.balance)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-blue-400 sm:px-5">{usd(row.interest)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 p-16 text-sm text-zinc-600">
              Enter values above to see results
            </div>
          )}
        </div>
      </div>

      <section className="mt-14 space-y-5 border-t border-zinc-800 pt-10 text-sm leading-relaxed text-zinc-400">
        <h2 className="text-base font-bold text-zinc-200">What is simple interest?</h2>
        <p>
          Simple interest is calculated only on the original principal - it does not accumulate.
          If you invest $10,000 at 10% per year for 5 years, you earn $1,000 every year for a
          total of $5,000 in interest and $15,000 final value.
        </p>
        <h2 className="text-base font-bold text-zinc-200">Formula used</h2>
        <p>
          <code className="mr-1 rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-blue-300">
            Interest = Principal × Rate × Time
          </code>
          and
          <code className="ml-1 rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-blue-300">
            Final = Principal + Interest
          </code>.
          Annual rates are divided by 12 when calculating monthly periods.
          Unlike compound interest, the base never grows - returns are linear.
        </p>
        <p className="text-xs text-zinc-600">
          For educational purposes only. Not financial advice.
        </p>
      </section>
    </div>
  )
}
