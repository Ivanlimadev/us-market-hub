'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'

type Mode = 'how-long' | 'how-much'

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

const usdFull = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)

interface ChartRow { month: number; balance: number; invested: number }

interface HowLongResult {
  months:        number
  years:         number
  extraMonths:   number
  totalInvested: number
  totalInterest: number
  chartData:     ChartRow[]
}

interface HowMuchResult {
  monthlyPmt:    number
  totalInvested: number
  totalInterest: number
  chartData:     ChartRow[]
  alreadyThere:  boolean
}

function calcHowLong(
  principal: number,
  pmt: number,
  annualRate: number,
): HowLongResult | null {
  const r = Math.pow(1 + annualRate / 100, 1 / 12) - 1
  const MAX_MONTHS = 600 // 50 years

  let balance = principal
  const chartData: ChartRow[] = [{ month: 0, balance: principal, invested: principal }]

  for (let m = 1; m <= MAX_MONTHS; m++) {
    balance = r === 0 ? balance + pmt : balance * (1 + r) + pmt
    const invested = principal + pmt * m

    if (balance >= 1_000_000) {
      chartData.push({ month: m, balance, invested })
      const years       = Math.floor(m / 12)
      const extraMonths = m % 12
      return {
        months: m, years, extraMonths,
        totalInvested: invested,
        totalInterest: balance - invested,
        chartData,
      }
    }

    // Sample every 12 months for chart
    if (m % 12 === 0) {
      chartData.push({ month: m, balance, invested })
    }
  }

  return null // goal not reachable in 50 years
}

function calcHowMuch(
  principal: number,
  years: number,
  annualRate: number,
): HowMuchResult {
  const r = Math.pow(1 + annualRate / 100, 1 / 12) - 1
  const n = years * 12
  const goal = 1_000_000

  // Check if initial investment alone is enough
  const pvGrowth = r === 0 ? principal : principal * Math.pow(1 + r, n)
  if (pvGrowth >= goal) {
    // Build chart with PMT = 0
    const chartData: ChartRow[] = [{ month: 0, balance: principal, invested: principal }]
    let balance = principal
    for (let m = 12; m <= n; m += 12) {
      balance = r === 0 ? balance : balance * Math.pow(1 + r, 12)
      chartData.push({ month: m, balance, invested: principal })
    }
    return {
      monthlyPmt: 0,
      totalInvested: principal,
      totalInterest: pvGrowth - principal,
      chartData,
      alreadyThere: true,
    }
  }

  let pmt: number
  if (r === 0) {
    pmt = (goal - principal) / n
  } else {
    const factor = Math.pow(1 + r, n)
    pmt = (goal - principal * factor) * r / (factor - 1)
  }

  pmt = Math.max(pmt, 0)

  // Build chart data
  const chartData: ChartRow[] = [{ month: 0, balance: principal, invested: principal }]
  let balance = principal
  for (let m = 1; m <= n; m++) {
    balance = r === 0 ? balance + pmt : balance * (1 + r) + pmt
    if (m % 12 === 0 || m === n) {
      chartData.push({ month: m, balance, invested: principal + pmt * m })
    }
  }

  const totalInvested = principal + pmt * n
  return {
    monthlyPmt:    pmt,
    totalInvested,
    totalInterest: balance - totalInvested,
    chartData,
    alreadyThere:  false,
  }
}

function AreaChart({ data }: { data: ChartRow[] }) {
  if (data.length < 2) return null
  const W = 500, H = 140
  const maxY = Math.max(...data.map(d => d.balance), 1)
  const nx = (i: number) => ((i / (data.length - 1)) * W).toFixed(1)
  const ny = (v: number) => (H - (v / maxY) * H).toFixed(1)

  const balLine  = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${nx(i)},${ny(d.balance)}`).join(' ')
  const invLine  = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${nx(i)},${ny(d.invested)}`).join(' ')
  const last     = data.length - 1

  // Goal line (y position for $1M)
  const goalY = ny(1_000_000)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 140 }}>
      <defs>
        <linearGradient id="mg-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="mg-i" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#78350f" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#78350f" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path d={`${invLine} L${nx(last)},${H} L0,${H}Z`} fill="url(#mg-i)" />
      <path d={`${balLine} L${nx(last)},${H} L0,${H}Z`} fill="url(#mg-b)" />
      <path d={invLine} fill="none" stroke="#92400e" strokeWidth="1" />
      <path d={balLine} fill="none" stroke="#f59e0b" strokeWidth="2" />
      {/* $1M goal line */}
      {parseFloat(goalY) >= 0 && parseFloat(goalY) <= H && (
        <line x1="0" y1={goalY} x2={W} y2={goalY}
          stroke="#fbbf24" strokeWidth="1" strokeDasharray="6,4" opacity="0.5" />
      )}
    </svg>
  )
}

function Toggle<T extends string>({ options, value, onChange }: {
  options: { label: string; value: T }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex rounded-xl border border-zinc-700 overflow-hidden">
      {options.map(o => (
        <button key={o.value} type="button" onClick={() => onChange(o.value)}
          className={`flex-1 px-4 py-2.5 text-xs font-semibold transition-colors ${value === o.value ? 'bg-amber-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function FirstMillionCalc() {
  const [mode,      setMode]      = useState<Mode>('how-long')
  const [principal, setPrincipal] = useState('10000')
  const [pmt,       setPmt]       = useState('1000')
  const [rate,      setRate]      = useState('10')
  const [years,     setYears]     = useState('20')

  const result = useMemo(() => {
    const p = Math.max(parseFloat(principal) || 0, 0)
    const r = parseFloat(rate)      || 0
    const m = Math.max(parseFloat(pmt) || 0, 0)
    const y = Math.max(parseFloat(years) || 0, 1)
    if (r < 0) return null

    if (mode === 'how-long') {
      return { mode, data: calcHowLong(p, m, r) }
    } else {
      return { mode, data: calcHowMuch(p, y, r) }
    }
  }, [mode, principal, pmt, rate, years])

  const chartData = result?.data
    ? 'chartData' in result.data ? result.data.chartData : undefined
    : undefined

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="mb-6 text-xs text-zinc-500">
        <Link href="/calculators" className="hover:text-zinc-300 transition-colors">Calculators</Link>
        <span className="mx-1.5">›</span>
        <span className="text-zinc-300">First Million</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold text-zinc-100">First Million Calculator</h1>
      <p className="mb-8 max-w-2xl text-zinc-400 leading-relaxed">
        Find out how long it takes to reach $1,000,000 — or how much you need to invest monthly
        to get there by your target date.
      </p>

      {/* Mode toggle */}
      <div className="mb-8 max-w-sm">
        <Toggle
          options={[
            { label: '⏱ How long?',   value: 'how-long'  as Mode },
            { label: '💰 How much/mo?', value: 'how-much' as Mode },
          ]}
          value={mode} onChange={setMode}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* Inputs */}
        <div className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-zinc-300">
            {mode === 'how-long' ? 'How long to reach $1M?' : 'Monthly contribution needed?'}
          </h2>

          {/* Initial capital (both modes) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-400">Initial capital ($)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 select-none">$</span>
              <input type="number" value={principal} onChange={e => setPrincipal(e.target.value)}
                min={0} step={1000}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-7 pr-3 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Monthly contribution — only in how-long mode */}
          {mode === 'how-long' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-400">Monthly contribution ($)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 select-none">$</span>
                <input type="number" value={pmt} onChange={e => setPmt(e.target.value)}
                  min={0} step={100}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-7 pr-3 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          {/* Time horizon — only in how-much mode */}
          {mode === 'how-much' && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-400">Time horizon (years)</label>
              <input type="number" value={years} onChange={e => setYears(e.target.value)}
                min={1} step={1}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-3 pr-3 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none transition-colors"
              />
            </div>
          )}

          {/* Annual rate (both modes) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-400">Annual return (%)</label>
            <div className="relative">
              <input type="number" value={rate} onChange={e => setRate(e.target.value)}
                min={0} step={0.5}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-3 pr-8 text-sm text-zinc-100 focus:border-amber-500 focus:outline-none transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 select-none">%</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {result?.data ? (
            <>
              {mode === 'how-long' && (() => {
                const d = result.data as HowLongResult | null
                if (!d) return (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                    <p className="text-zinc-400 text-sm">
                      Goal not reachable within 50 years with current parameters.
                      Try increasing your monthly contribution or annual return rate.
                    </p>
                  </div>
                )
                return (
                  <>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
                      <p className="text-[11px] uppercase tracking-widest font-semibold text-amber-500 mb-2">Time to $1,000,000</p>
                      <p className="text-4xl font-bold text-amber-400">
                        {d.years > 0 ? `${d.years}y ` : ''}{d.extraMonths > 0 ? `${d.extraMonths}mo` : d.years > 0 ? '' : `${d.months}mo`}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">{d.months} total months</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Total invested</p>
                        <p className="mt-1 text-lg font-bold text-zinc-200">{usd(d.totalInvested)}</p>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Interest earned</p>
                        <p className="mt-1 text-lg font-bold text-amber-400">{usd(d.totalInterest)}</p>
                      </div>
                    </div>
                  </>
                )
              })()}

              {mode === 'how-much' && (() => {
                const d = result.data as HowMuchResult
                return (
                  <>
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6 text-center">
                      <p className="text-[11px] uppercase tracking-widest font-semibold text-amber-500 mb-2">
                        {d.alreadyThere ? 'Already on track!' : 'Monthly contribution needed'}
                      </p>
                      {d.alreadyThere ? (
                        <p className="text-lg font-bold text-emerald-400">
                          Your initial investment alone will reach $1M in {parseFloat(years)} years.
                        </p>
                      ) : (
                        <p className="text-4xl font-bold text-amber-400">{usdFull(d.monthlyPmt)}<span className="text-lg text-zinc-400">/mo</span></p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Total invested</p>
                        <p className="mt-1 text-lg font-bold text-zinc-200">{usd(d.totalInvested)}</p>
                      </div>
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Interest earned</p>
                        <p className="mt-1 text-lg font-bold text-amber-400">{usd(d.totalInterest)}</p>
                      </div>
                    </div>
                  </>
                )
              })()}

              {chartData && chartData.length > 1 && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-300">Balance growth</p>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                      <span className="flex items-center gap-1.5"><span className="inline-block h-1.5 w-3 rounded-full bg-amber-400" /> Balance</span>
                      <span className="flex items-center gap-1.5"><span className="inline-block h-1.5 w-3 rounded-full bg-amber-900" /> Invested</span>
                    </div>
                  </div>
                  <AreaChart data={chartData} />
                  <p className="mt-2 text-[11px] text-zinc-600">Dashed line = $1,000,000 goal</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 p-16 text-sm text-zinc-600">
              Enter values above to calculate
            </div>
          )}
        </div>
      </div>

      <section className="mt-14 space-y-5 border-t border-zinc-800 pt-10 text-sm leading-relaxed text-zinc-400">
        <h2 className="text-base font-bold text-zinc-200">How to reach your first million</h2>
        <p>
          The path to $1,000,000 depends on three variables: how much you start with, how much you
          contribute each month, and your average annual return. The S&P 500 has historically
          returned around 10% per year before inflation. Starting earlier — even with a small amount —
          makes an enormous difference due to the compounding effect.
        </p>
        <p>
          For example: investing $500/month at 10% annual return from age 25 reaches $1M by around
          age 57 — 32 years. Waiting until 35 to start extends that to age 63, a full 6 extra years
          for just a 10-year delay in starting.
        </p>
        <p className="text-xs text-zinc-600">
          For educational purposes only. Not financial advice. Returns are not guaranteed.
        </p>
      </section>
    </div>
  )
}
