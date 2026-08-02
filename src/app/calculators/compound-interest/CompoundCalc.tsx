'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'

type RateMode   = 'annual' | 'monthly'
type PeriodMode = 'years'  | 'months'

interface YearRow {
  label:    string
  balance:  number
  invested: number
  interest: number
}

interface CalcResult {
  finalValue:    number
  totalInvested: number
  totalInterest: number
  rows:          YearRow[]
}

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)

const RATE_PRESETS: { label: string; desc: string; value: string; mode: RateMode }[] = [
  { label: 'S&P 500',      desc: 'Historical avg', value: '10', mode: 'annual' },
  { label: 'Growth',       desc: 'Balanced mix',   value: '7',  mode: 'annual' },
  { label: 'HYSA',         desc: 'High-yield sav', value: '5',  mode: 'annual' },
  { label: 'Bonds',        desc: 'Conservative',   value: '4',  mode: 'annual' },
]

function calcCompound(
  principal: number,
  rate:      number,
  rateMode:  RateMode,
  period:    number,
  periodMode: PeriodMode,
  pmt:       number,
): CalcResult {
  const annualRate = rateMode === 'annual' ? rate : rate * 12
  const r          = Math.pow(1 + annualRate / 100, 1 / 12) - 1
  const n          = periodMode === 'years' ? Math.round(period * 12) : Math.round(period)

  let balance = principal
  const rows: YearRow[] = [{ label: 'Start', balance: principal, invested: principal, interest: 0 }]

  for (let month = 1; month <= n; month++) {
    balance = r === 0 ? balance + pmt : balance * (1 + r) + pmt
    const invested = principal + pmt * month
    const isYearEnd = month % 12 === 0
    const isLast    = month === n
    if (isYearEnd || isLast) {
      const label = periodMode === 'years'
        ? `Year ${month / 12}`
        : `Month ${month}`
      rows.push({ label, balance, invested, interest: balance - invested })
    }
  }

  const totalInvested = principal + pmt * n
  return { finalValue: balance, totalInvested, totalInterest: balance - totalInvested, rows }
}

function AreaChart({ rows }: { rows: YearRow[] }) {
  if (rows.length < 2) return null
  const W = 500, H = 140
  const maxY = Math.max(...rows.map(r => r.balance), 1)
  const nx = (i: number) => ((i / (rows.length - 1)) * W).toFixed(1)
  const ny = (v: number) => (H - (v / maxY) * H).toFixed(1)

  const totalPts    = rows.map((r, i) => `${i === 0 ? 'M' : 'L'}${nx(i)},${ny(r.balance)}`).join(' ')
  const investedPts = rows.map((r, i) => `${i === 0 ? 'M' : 'L'}${nx(i)},${ny(r.invested)}`).join(' ')
  const last        = rows.length - 1

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 140 }}>
      <defs>
        <linearGradient id="cg-t" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="cg-i" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#065f46" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#065f46" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path d={`${investedPts} L${nx(last)},${H} L0,${H}Z`} fill="url(#cg-i)" />
      <path d={`${totalPts} L${nx(last)},${H} L0,${H}Z`}    fill="url(#cg-t)" />
      <path d={investedPts} fill="none" stroke="#059669" strokeWidth="1" />
      <path d={totalPts}    fill="none" stroke="#10b981" strokeWidth="2" />
    </svg>
  )
}

function NumInput({ label, value, onChange, min = 0, step = 1, pre, suf }: {
  label: string; value: string; onChange: (v: string) => void
  min?: number; step?: number; pre?: string; suf?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-zinc-400">{label}</label>
      <div className="relative flex items-center">
        {pre && <span className="absolute left-3 text-sm text-zinc-400 select-none">{pre}</span>}
        <input
          type="number" value={value} onChange={e => onChange(e.target.value)}
          min={min} step={step}
          className={`w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none transition-colors ${pre ? 'pl-7' : 'pl-3'} ${suf ? 'pr-10' : 'pr-3'}`}
        />
        {suf && <span className="absolute right-3 text-sm text-zinc-400 select-none">{suf}</span>}
      </div>
    </div>
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
          className={`flex-1 px-3 py-2.5 text-xs font-semibold transition-colors ${value === o.value ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function CompoundCalc() {
  const [principal,  setPrincipal]  = useState('10000')
  const [rate,       setRate]       = useState('10')
  const [rateMode,   setRateMode]   = useState<RateMode>('annual')
  const [period,     setPeriod]     = useState('20')
  const [periodMode, setPeriodMode] = useState<PeriodMode>('years')
  const [pmt,        setPmt]        = useState('500')

  const result = useMemo(() => {
    const p = parseFloat(principal) || 0
    const r = parseFloat(rate)      || 0
    const n = parseFloat(period)    || 0
    const m = parseFloat(pmt)       || 0
    if (n <= 0 || r < 0 || p < 0) return null
    return calcCompound(p, r, rateMode, n, periodMode, m)
  }, [principal, rate, rateMode, period, periodMode, pmt])

  const interestPct = result && result.finalValue > 0
    ? (result.totalInterest / result.finalValue) * 100
    : 0

  // Active preset detection
  const activePreset = RATE_PRESETS.find(p => p.value === rate && p.mode === rateMode)?.label ?? null

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="mb-6 text-xs text-zinc-500">
        <Link href="/calculators" className="hover:text-zinc-300 transition-colors">Calculators</Link>
        <span className="mx-1.5">›</span>
        <span className="text-zinc-300">Compound Interest</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold text-zinc-100">Compound Interest Calculator</h1>
      <p className="mb-8 max-w-2xl text-zinc-400 leading-relaxed">
        See how your investments grow exponentially over time. Includes initial capital, monthly
        contributions, and a full year-by-year breakdown.
      </p>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* ── Inputs ── */}
        <div className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-zinc-300">Parameters</h2>

          <NumInput label="Initial investment ($)" value={principal} onChange={setPrincipal} step={100} pre="$" />
          <NumInput label="Monthly contribution ($)" value={pmt} onChange={setPmt} step={50} pre="$" />

          {/* Rate with toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Interest rate</label>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <input type="number" value={rate} onChange={e => setRate(e.target.value)}
                  min={0} step={0.1}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-3 pr-8 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 select-none">%</span>
              </div>
              <Toggle
                options={[{ label: 'Annual', value: 'annual' as RateMode }, { label: 'Monthly', value: 'monthly' as RateMode }]}
                value={rateMode} onChange={setRateMode}
              />
            </div>

            {/* ── Rate presets ── */}
            <div className="mt-1 flex flex-wrap gap-1.5">
              {RATE_PRESETS.map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => { setRate(p.value); setRateMode(p.mode) }}
                  title={p.desc}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    activePreset === p.label
                      ? 'bg-emerald-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {p.label} {p.value}%
                </button>
              ))}
            </div>
          </div>

          {/* Period with toggle */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-400">Period</label>
            <div className="flex gap-2">
              <input type="number" value={period} onChange={e => setPeriod(e.target.value)}
                min={1} step={1}
                className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-3 pr-3 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none transition-colors"
              />
              <Toggle
                options={[{ label: 'Years', value: 'years' as PeriodMode }, { label: 'Months', value: 'months' as PeriodMode }]}
                value={periodMode} onChange={setPeriodMode}
              />
            </div>
          </div>
        </div>

        {/* ── Results ── */}
        <div className="min-w-0 space-y-4">
          {result ? (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { label: 'Final value',    value: result.finalValue,    cls: 'text-emerald-400' },
                  { label: 'Total invested', value: result.totalInvested, cls: 'text-zinc-200' },
                  { label: 'Total interest', value: result.totalInterest, cls: 'text-amber-400' },
                ].map(c => (
                  <div key={c.label} className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900 p-3 sm:p-4">
                    <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-[10px]">{c.label}</p>
                    <p className={`mt-1 truncate text-sm font-bold leading-tight tabular-nums sm:text-lg ${c.cls}`}>{usd(c.value)}</p>
                  </div>
                ))}
              </div>

              {/* Area chart */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-300">Balance over time</p>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-3 rounded-full bg-emerald-400" />
                      Final balance
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-3 rounded-full bg-emerald-800" />
                      Invested
                    </span>
                  </div>
                </div>

                <AreaChart rows={result.rows} />

                {/* Interest/invested bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[11px] text-zinc-500">
                    <span>Invested - {(100 - interestPct).toFixed(1)}%</span>
                    <span>Interest earned - {interestPct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.max(interestPct, 2)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Breakdown table */}
              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                <div className="border-b border-zinc-800 px-4 py-3 sm:px-5">
                  <p className="text-sm font-semibold text-zinc-300">Period breakdown</p>
                </div>
                <div className="max-h-72 overflow-x-auto overflow-y-auto">
                  <table className="w-full min-w-[320px] text-sm">
                    <thead className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/95">
                      <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                        <th className="px-3 py-2 sm:px-5">Period</th>
                        <th className="px-3 py-2 text-right sm:px-5">Balance</th>
                        <th className="px-3 py-2 text-right sm:px-5">Invested</th>
                        <th className="px-3 py-2 text-right sm:px-5">Interest</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {result.rows.map((row, i) => (
                        <tr key={i} className="transition-colors hover:bg-zinc-800/30">
                          <td className="px-3 py-2 text-zinc-400 sm:px-5">{row.label}</td>
                          <td className="px-3 py-2 text-right font-medium tabular-nums text-zinc-200 sm:px-5">{usd(row.balance)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-zinc-400 sm:px-5">{usd(row.invested)}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-emerald-400 sm:px-5">{usd(row.interest)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 p-16 text-sm text-zinc-600">
              Enter values above to see your projection
            </div>
          )}
        </div>
      </div>

      {/* SEO body */}
      <section className="mt-14 space-y-5 border-t border-zinc-800 pt-10 text-sm leading-relaxed text-zinc-400">
        <h2 className="text-base font-bold text-zinc-200">What is compound interest?</h2>
        <p>
          Compound interest means that the interest you earn in one period is added to your principal,
          so in the next period you earn interest on a larger base. This creates exponential growth:
          the longer your time horizon, the more dramatic the effect.
        </p>
        <h2 className="text-base font-bold text-zinc-200">Which rate should I use?</h2>
        <p>
          The <strong className="text-zinc-300">S&P 500</strong> has historically returned ~10%/year
          before inflation over long periods - use this for an all-equity US index fund scenario.
          A <strong className="text-zinc-300">balanced growth</strong> portfolio (stocks + bonds) is
          closer to 7%. <strong className="text-zinc-300">High-yield savings accounts (HYSA)</strong> are
          currently paying around 4-5% with FDIC insurance and zero market risk.
          <strong className="text-zinc-300"> Bonds</strong> historically return ~4% annualized.
        </p>
        <h2 className="text-base font-bold text-zinc-200">Formula used</h2>
        <p>
          <code className="mr-1 rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-emerald-300">
            FV = PV × (1+r)^n + PMT × ((1+r)^n − 1) / r
          </code>
          where <strong className="text-zinc-300">r</strong> is the monthly rate,
          <strong className="text-zinc-300"> n</strong> is the number of months,
          <strong className="text-zinc-300"> PV</strong> is the initial investment, and
          <strong className="text-zinc-300"> PMT</strong> is the monthly contribution.
          Annual rates are converted to monthly via
          <code className="ml-1 rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-emerald-300">
            r = (1 + annual%)^(1/12) − 1
          </code>.
        </p>
        <p className="text-xs text-zinc-600">
          For educational purposes only. Not financial advice. Past returns do not guarantee future results.
        </p>
      </section>
    </div>
  )
}
