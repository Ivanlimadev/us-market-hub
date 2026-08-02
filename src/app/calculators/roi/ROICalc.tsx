'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'

type Mode = 'value' | 'stock'

// ── Formatters ────────────────────────────────────────────────────────────────
const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)

const pctFmt = (n: number, digits = 2) =>
  `${n >= 0 ? '+' : ''}${n.toFixed(digits)}%`

// ── Calculation ───────────────────────────────────────────────────────────────
interface CalcResult {
  initialValue:   number
  finalValue:     number
  totalGain:      number
  roi:            number        // total %
  cagr:           number | null // annualized - null if no period
  multiple:       number        // FV / IV
  yearsDecimal:   number
  spReturn:       number | null // S&P 500 total return for same period (10%/yr)
  beatMarket:     boolean | null
  outperformance: number | null // roi - spReturn (pp)
  breakEven:      number | null // recovery % needed if roi < 0
}

function calc(
  mode: Mode,
  iv: number,       // initial investment OR buy price/share
  fv: number,       // final value OR sell price/share
  years: number,
  months: number,
  shares: number,   // stock mode only
  dividends: number // stock mode only
): CalcResult | null {
  let pv: number, ev: number

  if (mode === 'stock') {
    if (shares <= 0 || iv <= 0) return null
    pv = iv * shares
    ev = fv * shares + dividends
  } else {
    if (iv <= 0) return null
    pv = iv
    ev = fv
  }

  const totalGain     = ev - pv
  const roi           = (totalGain / pv) * 100
  const multiple      = ev / pv
  const yearsDecimal  = years + months / 12
  const breakEven     = roi < 0 ? (pv / ev - 1) * 100 : null

  let cagr: number | null           = null
  let spReturn: number | null       = null
  let beatMarket: boolean | null    = null
  let outperformance: number | null = null

  if (yearsDecimal >= 1 / 12) {  // at least 1 month
    cagr     = (Math.pow(ev / pv, 1 / yearsDecimal) - 1) * 100
    spReturn = (Math.pow(1.10, yearsDecimal) - 1) * 100
    beatMarket     = roi > spReturn
    outperformance = roi - spReturn
  }

  return {
    initialValue: pv, finalValue: ev,
    totalGain, roi, cagr, multiple, yearsDecimal,
    spReturn, beatMarket, outperformance, breakEven,
  }
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-zinc-400">{children}</label>
}

function NumberInput({ value, onChange, pre, suf, step = 1, min = 0, placeholder }: {
  value: string; onChange: (v: string) => void
  pre?: string; suf?: string; step?: number; min?: number; placeholder?: string
}) {
  return (
    <div className="relative flex items-center">
      {pre && <span className="absolute left-3 text-sm text-zinc-400 select-none">{pre}</span>}
      <input
        type="number" value={value} onChange={e => onChange(e.target.value)}
        min={min} step={step} placeholder={placeholder}
        className={`w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-orange-500 focus:outline-none transition-colors ${pre ? 'pl-7' : 'pl-3'} ${suf ? 'pr-10' : 'pr-3'}`}
      />
      {suf && <span className="absolute right-3 text-sm text-zinc-400 select-none">{suf}</span>}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function ROICalc() {
  const [mode,      setMode]      = useState<Mode>('value')

  // investment value mode
  const [iv,        setIv]        = useState('10000')
  const [fv,        setFv]        = useState('15000')

  // stock mode
  const [buyPrice,  setBuyPrice]  = useState('150')
  const [sellPrice, setSellPrice] = useState('220')
  const [shares,    setShares]    = useState('100')
  const [dividends, setDividends] = useState('0')

  // shared
  const [yrs, setYrs] = useState('3')
  const [mos, setMos] = useState('0')

  const result = useMemo(() => calc(
    mode,
    parseFloat(mode === 'value' ? iv       : buyPrice)  || 0,
    parseFloat(mode === 'value' ? fv       : sellPrice) || 0,
    parseInt(yrs) || 0,
    parseInt(mos) || 0,
    parseFloat(shares)    || 1,
    parseFloat(dividends) || 0,
  ), [mode, iv, fv, buyPrice, sellPrice, shares, dividends, yrs, mos])

  const isPositive  = result ? result.roi >= 0 : true
  const roiColor    = isPositive ? 'text-emerald-400' : 'text-red-400'
  const gainColor   = isPositive ? 'text-emerald-400' : 'text-red-400'
  const borderColor = isPositive ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-red-500/25 bg-red-500/5'

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <nav className="mb-6 text-xs text-zinc-500">
        <Link href="/calculators" className="hover:text-zinc-300 transition-colors">Calculators</Link>
        <span className="mx-1.5">›</span>
        <span className="text-zinc-300">ROI Calculator</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold text-zinc-100">ROI Calculator</h1>
      <p className="mb-8 max-w-2xl text-zinc-400 leading-relaxed">
        Calculate your Return on Investment for any asset. Enter an investment value or a specific
        stock trade - and see your annualized return (CAGR) compared against the S&P 500.
      </p>

      {/* Mode toggle */}
      <div className="mb-8 flex rounded-xl border border-zinc-700 overflow-hidden max-w-xs">
        {([
          { value: 'value' as Mode, label: 'Investment Value' },
          { value: 'stock' as Mode, label: 'Stock Trade'      },
        ] as const).map(o => (
          <button key={o.value} type="button" onClick={() => setMode(o.value)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
              mode === o.value ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}>
            {o.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">

        {/* ── Inputs ── */}
        <div className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-sm font-semibold text-zinc-300">
            {mode === 'value' ? 'Investment details' : 'Trade details'}
          </h2>

          {mode === 'value' ? (
            <>
              <div className="flex flex-col gap-1">
                <Label>Initial investment ($)</Label>
                <NumberInput value={iv} onChange={setIv} pre="$" step={100} placeholder="10000" />
              </div>
              <div className="flex flex-col gap-1">
                <Label>Final value ($)</Label>
                <NumberInput value={fv} onChange={setFv} pre="$" step={100} placeholder="15000" />
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <Label>Buy price / share</Label>
                  <NumberInput value={buyPrice} onChange={setBuyPrice} pre="$" step={0.01} min={0.01} placeholder="150" />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>Current / sell price</Label>
                  <NumberInput value={sellPrice} onChange={setSellPrice} pre="$" step={0.01} min={0.01} placeholder="220" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label>Number of shares</Label>
                <NumberInput value={shares} onChange={setShares} step={1} min={1} placeholder="100" />
              </div>
              <div className="flex flex-col gap-1">
                <Label>
                  Dividends received ($)
                  <span className="ml-1 font-normal text-zinc-600">(optional)</span>
                </Label>
                <NumberInput value={dividends} onChange={setDividends} pre="$" step={0.01} placeholder="0" />
              </div>
            </>
          )}

          {/* Holding period - shared */}
          <div className="flex flex-col gap-1.5">
            <Label>
              Holding period
              <span className="ml-1 font-normal text-zinc-600">(for CAGR & benchmark)</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <NumberInput value={yrs} onChange={setYrs} suf="yr"  step={1} min={0} placeholder="3" />
              <NumberInput value={mos} onChange={setMos} suf="mo" step={1} min={0} placeholder="0" />
            </div>
            {/* Period quick picks */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '6mo',  y: '0', m: '6'  },
                { label: '1y',   y: '1', m: '0'  },
                { label: '3y',   y: '3', m: '0'  },
                { label: '5y',   y: '5', m: '0'  },
                { label: '10y',  y: '10', m: '0' },
              ].map(p => {
                const active = yrs === p.y && mos === p.m
                return (
                  <button key={p.label} type="button"
                    onClick={() => { setYrs(p.y); setMos(p.m) }}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      active ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
                    }`}>
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Stock mode summary */}
          {mode === 'stock' && result && (
            <div className="rounded-lg bg-zinc-800/50 px-4 py-3 text-xs text-zinc-500 space-y-0.5">
              <div className="flex justify-between">
                <span>Cost basis</span>
                <span className="text-zinc-300">{usd(result.initialValue)}</span>
              </div>
              <div className="flex justify-between">
                <span>Current value</span>
                <span className="text-zinc-300">{usd(result.finalValue - (parseFloat(dividends) || 0))}</span>
              </div>
              {(parseFloat(dividends) || 0) > 0 && (
                <div className="flex justify-between">
                  <span>+ Dividends</span>
                  <span className="text-emerald-400">{usd(parseFloat(dividends) || 0)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Results ── */}
        <div className="min-w-0 space-y-4">
          {result ? (
            <>
              {/* Hero ROI */}
              <div className={`rounded-xl border p-6 text-center ${borderColor}`}>
                <p className="text-[11px] uppercase tracking-widest font-semibold text-zinc-500 mb-2">
                  Return on Investment
                </p>
                <p className={`text-6xl font-extrabold leading-none ${roiColor}`}>
                  {pctFmt(result.roi, 2)}
                </p>
                {result.cagr !== null && (
                  <p className="mt-2 text-sm text-zinc-400">
                    <span className={`font-semibold ${roiColor}`}>
                      {pctFmt(result.cagr, 2)} / yr
                    </span>
                    {' '}annualized (CAGR)
                  </p>
                )}
              </div>

              {/* KPI row */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900 p-3 sm:p-4">
                  <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-[10px]">
                    {result.totalGain >= 0 ? 'Total gain' : 'Total loss'}
                  </p>
                  <p className={`mt-1 truncate text-sm font-bold leading-tight tabular-nums sm:text-lg ${gainColor}`}>
                    {result.totalGain >= 0 ? '+' : ''}{usd(result.totalGain)}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900 p-3 sm:p-4">
                  <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-[10px]">Money multiple</p>
                  <p className={`mt-1 text-sm font-bold leading-tight tabular-nums sm:text-lg ${isPositive ? 'text-zinc-200' : 'text-red-400'}`}>
                    {result.multiple.toFixed(2)}x
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-zinc-600">
                    {usd(result.initialValue)} → {usd(result.finalValue)}
                  </p>
                </div>
                <div className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-900 p-3 sm:p-4">
                  <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-zinc-500 sm:text-[10px]">
                    {result.cagr !== null ? 'CAGR' : 'Period'}
                  </p>
                  {result.cagr !== null ? (
                    <>
                      <p className={`mt-1 text-sm font-bold leading-tight tabular-nums sm:text-lg ${roiColor}`}>
                        {pctFmt(result.cagr, 2)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-zinc-600">per year</p>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-zinc-500">Add period for CAGR</p>
                  )}
                </div>
              </div>

              {/* S&P 500 Benchmark */}
              {result.spReturn !== null && result.outperformance !== null && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-zinc-300">vs. S&P 500 benchmark</p>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      result.beatMarket
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-red-500/15 text-red-400'
                    }`}>
                      {result.beatMarket ? '✓ Beat market' : '✗ Lagged market'}
                    </span>
                  </div>

                  {/* Comparison bars */}
                  {(() => {
                    const maxVal = Math.max(Math.abs(result.roi), Math.abs(result.spReturn!), 0.1)
                    const yourW  = Math.min((Math.abs(result.roi)         / maxVal) * 100, 100)
                    const spW    = Math.min((Math.abs(result.spReturn!)   / maxVal) * 100, 100)
                    return (
                      <div className="space-y-3">
                        {[
                          { label: 'Your investment', value: result.roi,        w: yourW, color: isPositive ? 'bg-orange-500' : 'bg-red-500' },
                          { label: 'S&P 500 (10%/yr)', value: result.spReturn!, w: spW,   color: 'bg-zinc-600' },
                        ].map(bar => (
                          <div key={bar.label}>
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="text-zinc-400">{bar.label}</span>
                              <span className={`font-semibold ${bar.label === 'Your investment' ? (isPositive ? 'text-orange-400' : 'text-red-400') : 'text-zinc-400'}`}>
                                {pctFmt(bar.value)}
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${bar.color}`}
                                style={{ width: `${Math.max(bar.w, 2)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        <p className="pt-1 text-[11px] text-zinc-500">
                          {result.beatMarket
                            ? `You outperformed the S&P 500 by ${Math.abs(result.outperformance!).toFixed(2)} percentage points over this period.`
                            : `You underperformed the S&P 500 by ${Math.abs(result.outperformance!).toFixed(2)} percentage points. An S&P 500 index fund would have returned ${usd((result.initialValue * result.spReturn! / 100))} more.`
                          }
                        </p>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Break-even panel - only when loss */}
              {result.breakEven !== null && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5">
                  <p className="mb-1 text-sm font-semibold text-red-400">Break-even recovery needed</p>
                  <p className="text-3xl font-bold text-red-400">
                    +{Math.abs(result.breakEven).toFixed(2)}%
                  </p>
                  <p className="mt-1.5 text-[12px] text-zinc-500 leading-relaxed">
                    Your investment is at {usd(result.finalValue)}. To recover to your original{' '}
                    {usd(result.initialValue)}, it needs to rise{' '}
                    <strong className="text-zinc-300">+{Math.abs(result.breakEven).toFixed(2)}%</strong> from
                    its current value. Losses always require a larger percentage gain to recover -
                    a 50% drop needs a 100% gain just to break even.
                  </p>
                </div>
              )}

              {/* No period hint */}
              {result.spReturn === null && (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 text-sm text-zinc-500">
                  Add a holding period above to see your annualized return (CAGR) and how you compared to the S&P 500.
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/50 p-16 text-sm text-zinc-600">
              Enter values above to calculate your ROI
            </div>
          )}
        </div>
      </div>

      {/* SEO section */}
      <section className="mt-14 space-y-5 border-t border-zinc-800 pt-10 text-sm leading-relaxed text-zinc-400">
        <h2 className="text-base font-bold text-zinc-200">What is ROI?</h2>
        <p>
          Return on Investment (ROI) measures how much money you made (or lost) relative to what
          you put in:{' '}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-orange-300">
            ROI = (Final Value − Initial Value) / Initial Value × 100
          </code>.
          A 50% ROI means you turned $10,000 into $15,000. Simple - but it doesn&apos;t tell you
          how <em>fast</em> you got there.
        </p>

        <h2 className="text-base font-bold text-zinc-200">Why CAGR matters more than total ROI</h2>
        <p>
          Compound Annual Growth Rate (CAGR) normalizes returns across time:{' '}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-orange-300">
            CAGR = (FV / IV)^(1/years) − 1
          </code>.
          A 50% total ROI over 10 years is a modest 4.1%/yr CAGR.
          The same 50% over 2 years is a 22.5%/yr CAGR - an exceptional performance.
          CAGR lets you compare any investment on an equal footing.
        </p>

        <h2 className="text-base font-bold text-zinc-200">Beating the S&P 500</h2>
        <p>
          The S&P 500 has returned roughly 10%/yr before inflation over long periods. This is the
          benchmark most professional fund managers fail to beat consistently. If your CAGR exceeds
          10%, you&apos;re outperforming the market - and likely most actively managed funds.
          If not, a low-cost index ETF (like VOO or SPY) may be worth considering.
        </p>

        <h2 className="text-base font-bold text-zinc-200">The asymmetry of losses</h2>
        <p>
          One of the most important and counterintuitive facts in investing: losses and gains are
          not symmetric. Lose 50% and you need a 100% gain just to break even. Lose 20% and you
          need +25%. This asymmetry is why protecting against large drawdowns matters as much as
          chasing large gains.
        </p>
        <p className="text-xs text-zinc-600">
          For educational purposes only. Not financial advice. Past returns do not guarantee future results.
        </p>
      </section>
    </div>
  )
}
