'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'

type Frequency = 'weekly' | 'biweekly' | 'monthly'

const FREQ: Record<Frequency, { label: string; short: string; perYear: number; unit: string }> = {
  weekly:   { label: 'Weekly',    short: 'Wkly', perYear: 52, unit: '/week'    },
  biweekly: { label: 'Bi-weekly', short: '2-Wk', perYear: 26, unit: '/bi-week' },
  monthly:  { label: 'Monthly',   short: 'Mo',   perYear: 12, unit: '/month'   },
}

const RATE_PRESETS = [
  { label: 'S&P 500', value: '10' },
  { label: 'Growth',  value: '7'  },
  { label: 'HYSA',    value: '5'  },
  { label: 'Bonds',   value: '4'  },
]

const AMOUNT_PRESETS = ['100', '250', '500', '1000']
const YEAR_PRESETS   = ['5', '10', '20', '30']

const usd  = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const usd2 = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)

interface YearRow { year: number; balance: number; invested: number; returnPct: number }

interface CalcResult {
  finalValue:    number
  totalInvested: number
  totalReturn:   number
  returnPct:     number
  lumpSumFinal:  number
  rows:          YearRow[]
}

function calcDCA(
  contribution: number,
  annualRate:   number,
  years:        number,
  frequency:    Frequency,
  initialLump:  number,
): CalcResult | null {
  if (years <= 0 || annualRate < 0 || (contribution <= 0 && initialLump <= 0)) return null

  const { perYear } = FREQ[frequency]
  const r = Math.pow(1 + annualRate / 100, 1 / perYear) - 1
  const n = years * perYear

  let balance = initialLump
  const rows: YearRow[] = [{ year: 0, balance: initialLump, invested: initialLump, returnPct: 0 }]

  for (let p = 1; p <= n; p++) {
    balance = r === 0 ? balance + contribution : balance * (1 + r) + contribution
    if (p % perYear === 0 || p === n) {
      const invested = initialLump + contribution * p
      rows.push({
        year:      p / perYear,
        balance,
        invested,
        returnPct: invested > 0 ? ((balance - invested) / invested) * 100 : 0,
      })
    }
  }

  const totalInvested = initialLump + contribution * n
  const totalReturn   = balance - totalInvested
  const returnPct     = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0
  // Lump sum: same total amount invested all on day 1
  const lumpSumFinal  = r === 0 ? totalInvested : totalInvested * Math.pow(1 + r, n)

  return { finalValue: balance, totalInvested, totalReturn, returnPct, lumpSumFinal, rows }
}

function AreaChart({ rows }: { rows: YearRow[] }) {
  if (rows.length < 2) return null
  const W = 500, H = 140
  const maxY = Math.max(...rows.map(r => r.balance), 1)
  const nx = (i: number) => ((i / (rows.length - 1)) * W).toFixed(1)
  const ny = (v: number) => (H - (v / maxY) * H).toFixed(1)
  const balPts = rows.map((r, i) => `${i === 0 ? 'M' : 'L'}${nx(i)},${ny(r.balance)}`).join(' ')
  const invPts = rows.map((r, i) => `${i === 0 ? 'M' : 'L'}${nx(i)},${ny(r.invested)}`).join(' ')
  const last   = rows.length - 1

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 140 }}>
      <defs>
        <linearGradient id="dca-gb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="dca-gi" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#164e63" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#164e63" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path d={`${invPts} L${nx(last)},${H} L0,${H}Z`} fill="url(#dca-gi)" />
      <path d={`${balPts} L${nx(last)},${H} L0,${H}Z`} fill="url(#dca-gb)" />
      <path d={invPts} fill="none" stroke="#155e75" strokeWidth="1" />
      <path d={balPts} fill="none" stroke="#06b6d4" strokeWidth="2" />
    </svg>
  )
}

function Presets({ values, current, onSelect, active }: {
  values: string[]; current: string; onSelect: (v: string) => void; active: string
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map(v => (
        <button key={v} type="button" onClick={() => onSelect(v)}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
            current === v ? `bg-${active}-500 text-white` : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
          }`}>
          {v}
        </button>
      ))}
    </div>
  )
}

export function DCACalc() {
  const [contribution, setContribution] = useState('500')
  const [frequency,    setFrequency]    = useState<Frequency>('monthly')
  const [rate,         setRate]         = useState('10')
  const [years,        setYears]        = useState('20')
  const [age,          setAge]          = useState('30')
  const [lump,         setLump]         = useState('0')

  const freqInfo    = FREQ[frequency]
  const activePreset = RATE_PRESETS.find(p => p.value === rate)?.label ?? null
  const targetAge   = (parseInt(age) || 0) + (parseInt(years) || 0)

  const result = useMemo(() => calcDCA(
    parseFloat(contribution) || 0,
    parseFloat(rate)         || 0,
    parseInt(years)          || 0,
    frequency,
    parseFloat(lump)         || 0,
  ), [contribution, rate, years, frequency, lump])

  const lumpWins = result ? result.lumpSumFinal > result.finalValue : false
  const diff     = result ? Math.abs(result.lumpSumFinal - result.finalValue) : 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="mb-6 text-xs text-zinc-500">
        <Link href="/calculators" className="hover:text-zinc-300 transition-colors">Calculators</Link>
        <span className="mx-1.5">›</span>
        <span className="text-zinc-300">DCA Calculator</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold text-zinc-100">DCA Calculator</h1>
      <p className="mb-8 max-w-2xl text-zinc-400 leading-relaxed">
        Dollar-Cost Averaging means investing a fixed amount at regular intervals regardless of
        market price. See how consistent contributions compound over time — and how DCA compares
        to putting the same total in as a lump sum on day one.
      </p>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">

        {/* ── Inputs ── */}
        <div className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-zinc-300">Parameters</h2>

          {/* Age */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-400">Your current age</label>
            <input type="number" value={age} onChange={e => setAge(e.target.value)}
              min={1} max={100} step={1}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-3 pr-3 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Contribution amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">
              Investment amount
              <span className="ml-1 font-normal text-zinc-600">({freqInfo.unit})</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 select-none">$</span>
              <input type="number" value={contribution} onChange={e => setContribution(e.target.value)}
                min={0} step={50}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-7 pr-3 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none transition-colors"
              />
            </div>
            {/* Amount presets */}
            <div className="flex flex-wrap gap-1.5">
              {AMOUNT_PRESETS.map(v => (
                <button key={v} type="button" onClick={() => setContribution(v)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    contribution === v ? 'bg-cyan-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                  }`}>
                  ${v}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Investment frequency</label>
            <div className="flex rounded-lg border border-zinc-700 overflow-hidden">
              {(Object.entries(FREQ) as [Frequency, typeof FREQ[Frequency]][]).map(([key, f]) => (
                <button key={key} type="button" onClick={() => setFrequency(key)}
                  className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                    frequency === key ? 'bg-cyan-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional lump sum */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-400">
              Starting lump sum
              <span className="ml-1 font-normal text-zinc-600">(optional)</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 select-none">$</span>
              <input type="number" value={lump} onChange={e => setLump(e.target.value)}
                min={0} step={500}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-7 pr-3 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Annual rate + presets */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Expected annual return (%)</label>
            <div className="relative">
              <input type="number" value={rate} onChange={e => setRate(e.target.value)}
                min={0} step={0.5}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-3 pr-8 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 select-none">%</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {RATE_PRESETS.map(p => (
                <button key={p.label} type="button" onClick={() => setRate(p.value)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    activePreset === p.label ? 'bg-cyan-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                  }`}>
                  {p.label} {p.value}%
                </button>
              ))}
            </div>
          </div>

          {/* Period + presets */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-400">Investment period (years)</label>
            <input type="number" value={years} onChange={e => setYears(e.target.value)}
              min={1} step={1}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-3 pr-3 text-sm text-zinc-100 focus:border-cyan-500 focus:outline-none transition-colors"
            />
            <div className="flex flex-wrap gap-1.5">
              {YEAR_PRESETS.map(v => (
                <button key={v} type="button" onClick={() => setYears(v)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                    years === v ? 'bg-cyan-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                  }`}>
                  {v}y
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Results ── */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Final value</p>
                  <p className="mt-1 text-lg font-bold leading-tight text-cyan-400">{usd(result.finalValue)}</p>
                  {(parseInt(age) || 0) > 0 && (
                    <p className="mt-0.5 text-[10px] text-zinc-600">at age {targetAge}</p>
                  )}
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Total invested</p>
                  <p className="mt-1 text-lg font-bold leading-tight text-zinc-200">{usd(result.totalInvested)}</p>
                  <p className="mt-0.5 text-[10px] text-zinc-600">
                    {usd2(parseFloat(contribution) || 0)} {freqInfo.unit}
                  </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Total return</p>
                  <p className="mt-1 text-lg font-bold leading-tight text-amber-400">
                    +{result.returnPct.toFixed(1)}%
                  </p>
                  <p className="mt-0.5 text-[10px] text-zinc-600">{usd(result.totalReturn)} gain</p>
                </div>
              </div>

              {/* DCA vs Lump Sum */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="mb-4 text-sm font-semibold text-zinc-300">
                  DCA vs. Lump Sum — same money, different timing
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {/* DCA side */}
                  <div className={`rounded-lg p-4 ${!lumpWins ? 'border border-cyan-500/30 bg-cyan-500/5' : 'border border-zinc-700 bg-zinc-800/30'}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-zinc-400">DCA Strategy</p>
                      {!lumpWins && (
                        <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
                          WINNER
                        </span>
                      )}
                    </div>
                    <p className={`text-xl font-bold ${!lumpWins ? 'text-cyan-400' : 'text-zinc-300'}`}>
                      {usd(result.finalValue)}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {usd2(parseFloat(contribution) || 0)} {freqInfo.unit} × {years}y
                    </p>
                  </div>

                  {/* Lump Sum side */}
                  <div className={`rounded-lg p-4 ${lumpWins ? 'border border-emerald-500/30 bg-emerald-500/5' : 'border border-zinc-700 bg-zinc-800/30'}`}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-zinc-400">Lump Sum</p>
                      {lumpWins && (
                        <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          WINNER
                        </span>
                      )}
                    </div>
                    <p className={`text-xl font-bold ${lumpWins ? 'text-emerald-400' : 'text-zinc-300'}`}>
                      {usd(result.lumpSumFinal)}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {usd(result.totalInvested)} invested on day 1
                    </p>
                  </div>
                </div>

                {/* Difference + explanation */}
                <div className="mt-3 rounded-lg bg-zinc-800/40 px-4 py-3">
                  <p className="text-[11px] leading-relaxed text-zinc-500">
                    {lumpWins ? (
                      <>
                        <span className="text-emerald-400 font-semibold">
                          Lump sum wins by {usd(diff)}.
                        </span>{' '}
                        In a steadily rising market, money invested earlier has more time to compound — that&apos;s why lump sum often outperforms. DCA&apos;s advantage: you don&apos;t need the full amount upfront, and you avoid the risk of investing everything at a market peak.
                      </>
                    ) : (
                      <>
                        <span className="text-cyan-400 font-semibold">
                          DCA matches lump sum here.
                        </span>{' '}
                        In practice, lump sum usually wins in a consistently rising market. DCA&apos;s real edge is behavioral: it builds the habit, removes market-timing decisions, and lets you start with any amount you have today.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Area chart */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-zinc-300">Portfolio growth over time</p>
                  <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-3 rounded-full bg-cyan-400" /> Balance
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-3 rounded-full bg-cyan-900" /> Invested
                    </span>
                  </div>
                </div>
                <AreaChart rows={result.rows} />
              </div>

              {/* Year-by-year table */}
              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
                <div className="border-b border-zinc-800 px-5 py-3">
                  <p className="text-sm font-semibold text-zinc-300">Year-by-year breakdown</p>
                </div>
                <div className="max-h-72 overflow-y-auto overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-900/95">
                      <tr className="text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                        <th className="px-5 py-2">Year</th>
                        <th className="px-5 py-2 text-right">Balance</th>
                        <th className="px-5 py-2 text-right">Invested</th>
                        <th className="px-5 py-2 text-right">Return</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {result.rows.filter(r => r.year > 0).map((row, i) => (
                        <tr key={i} className="transition-colors hover:bg-zinc-800/30">
                          <td className="px-5 py-2 text-zinc-400">Year {row.year}</td>
                          <td className="px-5 py-2 text-right font-medium text-zinc-200">{usd(row.balance)}</td>
                          <td className="px-5 py-2 text-right text-zinc-400">{usd(row.invested)}</td>
                          <td className="px-5 py-2 text-right text-cyan-400">+{row.returnPct.toFixed(1)}%</td>
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

      {/* SEO section */}
      <section className="mt-14 space-y-5 border-t border-zinc-800 pt-10 text-sm leading-relaxed text-zinc-400">
        <h2 className="text-base font-bold text-zinc-200">What is Dollar-Cost Averaging (DCA)?</h2>
        <p>
          Dollar-Cost Averaging is the strategy of investing a fixed amount at regular intervals —
          weekly, bi-weekly, or monthly — regardless of whether the market is up or down.
          When prices drop, your fixed amount buys <em>more</em> shares. When prices rise, you buy
          fewer. Over time, this naturally lowers your average cost per share compared to trying to
          time the market.
        </p>
        <h2 className="text-base font-bold text-zinc-200">DCA vs. Lump Sum</h2>
        <p>
          Research (including a Vanguard study across US, UK, and Australian markets) shows that
          lump sum investing outperforms DCA roughly{' '}
          <strong className="text-zinc-300">2 out of 3 times</strong> in a trending market —
          because money invested earlier has more time to compound. But this assumes you already
          have the full lump sum available, which most people don&apos;t.
        </p>
        <p>
          DCA&apos;s real advantages: you can start <strong className="text-zinc-300">immediately</strong>{' '}
          with whatever you have; you build a consistent saving habit; and you remove the
          psychological burden of &quot;waiting for the right moment&quot; — a moment that research
          shows investors almost always mis-time.
        </p>
        <h2 className="text-base font-bold text-zinc-200">Weekly vs. monthly DCA</h2>
        <p>
          More frequent contributions slightly reduce the average cost basis by spreading purchases
          across more price points. In practice, the difference between weekly and monthly DCA is
          small. Monthly is most common because it aligns with salary cycles. Bi-weekly aligns with
          US bi-weekly paychecks — a popular choice for automatic payroll investing.
        </p>
        <p className="text-xs text-zinc-600">
          For educational purposes only. Not financial advice. Past returns do not guarantee future results.
        </p>
      </section>
    </div>
  )
}
