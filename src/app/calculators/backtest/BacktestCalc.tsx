'use client'
import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { runBacktest, type Bar, type Strategy, type BacktestConfig, type BacktestResult } from '@/lib/backtest'

const RANGES = ['1y', '2y', '5y', '10y'] as const
type Range = (typeof RANGES)[number]
const BENCHMARK = 'SPY'

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`

// Which configurable condition fields each strategy exposes.
type Field = { key: keyof BacktestConfig; label: string; def: number }
const STRATEGIES: { id: Strategy; name: string; blurb: string; fields: Field[] }[] = [
  { id: 'lumpSum', name: 'Buy & Hold', blurb: 'Invest once and hold the whole time.', fields: [] },
  { id: 'dca', name: 'Dollar-Cost Averaging', blurb: 'Invest a fixed amount every month.', fields: [{ key: 'monthly', label: 'Monthly ($)', def: 500 }] },
  {
    id: 'maCrossover',
    name: 'Moving Average Crossover',
    blurb: 'Buy when the fast average crosses above the slow one; sell when it crosses back below.',
    fields: [
      { key: 'fastPeriod', label: 'Fast MA (days)', def: 50 },
      { key: 'slowPeriod', label: 'Slow MA (days)', def: 200 },
    ],
  },
  {
    id: 'trendFilter',
    name: 'Trend Filter',
    blurb: 'Hold while price is above a long moving average; move to cash when it drops below.',
    fields: [{ key: 'maPeriod', label: 'MA period (days)', def: 200 }],
  },
  {
    id: 'buyDip',
    name: 'Buy the Dip',
    blurb: 'Buy when price falls a set % below its peak; sell when it recovers a set % above your entry.',
    fields: [
      { key: 'dipPct', label: 'Dip to buy (%)', def: 10 },
      { key: 'exitPct', label: 'Gain to sell (%)', def: 15 },
    ],
  },
  {
    id: 'rsi',
    name: 'RSI (Oversold / Overbought)',
    blurb: 'Buy when RSI falls below the oversold level; sell when it rises above the overbought level.',
    fields: [
      { key: 'rsiPeriod', label: 'RSI period', def: 14 },
      { key: 'rsiOversold', label: 'Buy below', def: 30 },
      { key: 'rsiOverbought', label: 'Sell above', def: 70 },
    ],
  },
]

async function fetchBars(symbol: string, range: Range): Promise<Bar[]> {
  const res = await fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&range=${range}`)
  if (!res.ok) throw new Error('no data')
  const json = await res.json()
  return (json.bars ?? []) as Bar[]
}

export function BacktestCalc() {
  const params = useSearchParams()
  const [symbol, setSymbol] = useState('AAPL')
  const [strategyId, setStrategyId] = useState<Strategy>('lumpSum')
  const [range, setRange] = useState<Range>('10y')
  const [initial, setInitial] = useState('10000')
  // condition params keyed by field name, seeded with each strategy's defaults
  const [conds, setConds] = useState<Record<string, number>>({})

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [benchSpy, setBenchSpy] = useState<BacktestResult | null>(null)
  const [benchHold, setBenchHold] = useState<BacktestResult | null>(null)
  const [ranSymbol, setRanSymbol] = useState('')
  const [ranStrategy, setRanStrategy] = useState<Strategy>('lumpSum')

  const strat = STRATEGIES.find((s) => s.id === strategyId)!
  const isSignal = !['lumpSum', 'dca'].includes(strategyId)

  useEffect(() => {
    const s = params.get('symbol')
    if (s) setSymbol(s.toUpperCase())
  }, [params])

  // Seed condition defaults whenever the strategy changes.
  useEffect(() => {
    const next: Record<string, number> = {}
    for (const f of strat.fields) next[f.key as string] = f.def
    setConds(next)
  }, [strategyId]) // eslint-disable-line react-hooks/exhaustive-deps

  const buildCfg = useCallback((): BacktestConfig => {
    const cfg: BacktestConfig = { strategy: strategyId, initial: Math.max(0, Number(initial) || 0) }
    for (const f of strat.fields) (cfg as unknown as Record<string, number>)[f.key as string] = Number(conds[f.key as string] ?? f.def)
    return cfg
  }, [strategyId, initial, conds, strat])

  const run = useCallback(async () => {
    const sym = symbol.trim().toUpperCase()
    if (!sym) return
    setLoading(true)
    setError(null)
    try {
      const cfg = buildCfg()
      const [bars, spyBars] = await Promise.all([fetchBars(sym, range), fetchBars(BENCHMARK, range)])
      const r = runBacktest(bars, cfg)
      if (!r) {
        setResult(null)
        setError(`No historical data for "${sym}". Check the ticker and try again.`)
        return
      }
      setResult(r)
      // Benchmarks: buy & hold the same asset (the key "did timing beat holding?" line)
      // and buy & hold the S&P 500, both with the same starting capital.
      setBenchHold(runBacktest(bars, { strategy: 'lumpSum', initial: cfg.initial }))
      setBenchSpy(runBacktest(spyBars, { strategy: 'lumpSum', initial: cfg.initial }))
      setRanSymbol(sym)
      setRanStrategy(cfg.strategy)
    } catch {
      setResult(null)
      setError(`Could not load data for "${sym}". Check the ticker and try again.`)
    } finally {
      setLoading(false)
    }
  }, [symbol, range, buildCfg])

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Backtest Calculator</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Test any stock or ETF against a real strategy using historical data. Pick a rule, set the conditions,
        and see how it would have performed versus simply buying and holding.
      </p>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
        {/* Ticker + period */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Ticker</span>
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && run()}
              placeholder="AAPL, VOO, NVDA..."
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#c8a45d]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Period</span>
            <div className="mt-1 flex gap-1">
              {RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`flex-1 rounded-lg border px-2 py-2 text-sm ${
                    range === r ? 'border-[#c8a45d] bg-[#c8a45d]/10 text-[#c8a45d]' : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </label>
        </div>

        {/* Strategy select */}
        <div className="mt-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Strategy</span>
          <select
            value={strategyId}
            onChange={(e) => setStrategyId(e.target.value as Strategy)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#c8a45d]"
          >
            {STRATEGIES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-zinc-500">{strat.blurb}</p>
        </div>

        {/* Amount + condition params */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {strategyId === 'dca' ? 'Starting ($)' : 'Amount ($)'}
            </span>
            <input
              type="number"
              value={initial}
              onChange={(e) => setInitial(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#c8a45d]"
            />
          </label>
          {strat.fields.map((f) => (
            <label key={f.key as string} className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">{f.label}</span>
              <input
                type="number"
                value={conds[f.key as string] ?? f.def}
                onChange={(e) => setConds((c) => ({ ...c, [f.key as string]: Number(e.target.value) }))}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#c8a45d]"
              />
            </label>
          ))}
        </div>

        <button
          onClick={run}
          disabled={loading}
          className="mt-5 w-full rounded-lg bg-[#c8a45d] px-4 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-[#d9b86e] disabled:opacity-60"
        >
          {loading ? 'Running backtest...' : 'Run Backtest'}
        </button>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </div>

      {result && (
        <div className="mt-6 space-y-5">
          <p className="text-sm text-zinc-400">
            {ranSymbol} · {STRATEGIES.find((s) => s.id === ranStrategy)?.name} ·{' '}
            {new Date(result.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} to{' '}
            {new Date(result.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Final Value" value={usd(result.finalValue)} accent />
            <Stat label="Total Invested" value={usd(result.totalInvested)} />
            <Stat label="Total Return" value={pct(result.returnPct)} good={result.returnPct >= 0} />
            <Stat label="Profit" value={usd(result.totalReturn)} good={result.totalReturn >= 0} />
          </div>

          {benchHold && <EquityChart a={result} b={benchHold} label={`${ranSymbol} strategy`} bLabel={`Buy & Hold ${ranSymbol}`} />}

          {/* Benchmarks */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm">
            {benchHold && ['maCrossover', 'buyDip', 'rsi', 'trendFilter', 'dca'].includes(ranStrategy) && (
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-zinc-400">
                  vs just buying &amp; holding <strong className="text-zinc-200">{ranSymbol}</strong>
                </span>
                <span className={benchHold.returnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {usd(benchHold.finalValue)} ({pct(benchHold.returnPct)})
                </span>
              </div>
            )}
            {benchSpy && (
              <div className="flex items-center justify-between pt-2">
                <span className="text-zinc-400">
                  vs Buy &amp; Hold <strong className="text-zinc-200">S&amp;P 500</strong>
                </span>
                <span className={benchSpy.returnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {usd(benchSpy.finalValue)} ({pct(benchSpy.returnPct)})
                </span>
              </div>
            )}
            {benchHold && isSignal && (
              <p className="mt-2 text-xs text-zinc-500">
                Your {STRATEGIES.find((s) => s.id === ranStrategy)?.name} strategy{' '}
                {result.returnPct >= benchHold.returnPct ? 'beat' : 'trailed'} simply holding {ranSymbol} by{' '}
                {Math.abs(result.returnPct - benchHold.returnPct).toFixed(1)} points. Most timing strategies
                struggle to beat buy &amp; hold after you account for the days they sit in cash.
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="CAGR" value={pct(result.cagr)} good={result.cagr >= 0} small />
            <Stat label="Max Drawdown" value={`${result.maxDrawdown.toFixed(1)}%`} good={false} small />
            <Stat label="Volatility" value={`${result.volatility.toFixed(1)}%`} small />
            {isSignal ? (
              <Stat label="Trades" value={`${result.trades ?? 0}`} small />
            ) : (
              <Stat
                label="Best / Worst Yr"
                value={result.bestYear && result.worstYear ? `${pct(result.bestYear.pct)} / ${pct(result.worstYear.pct)}` : '-'}
                small
              />
            )}
          </div>

          {isSignal && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Win Rate" value={result.winRatePct != null ? `${result.winRatePct.toFixed(0)}%` : '-'} small />
              <Stat label="Time in Market" value={`${(result.timeInMarketPct ?? 0).toFixed(0)}%`} small />
              <Stat
                label="Best / Worst Yr"
                value={result.bestYear && result.worstYear ? `${pct(result.bestYear.pct)} / ${pct(result.worstYear.pct)}` : '-'}
                small
              />
            </div>
          )}

          {/* Year-by-year */}
          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-2 text-left">Year</th>
                  {!isSignal && <th className="px-4 py-2 text-right">Invested</th>}
                  <th className="px-4 py-2 text-right">Value</th>
                  <th className="px-4 py-2 text-right">Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {result.rows.map((r) => (
                  <tr key={r.year}>
                    <td className="px-4 py-2">{r.year}</td>
                    {!isSignal && <td className="px-4 py-2 text-right text-zinc-400">{usd(r.invested)}</td>}
                    <td className="px-4 py-2 text-right">{usd(r.value)}</td>
                    <td className={`px-4 py-2 text-right ${r.returnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{pct(r.returnPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-xs leading-relaxed text-zinc-500">
            <strong className="text-zinc-400">Important:</strong> This backtest is for educational purposes only
            and is not financial advice or a prediction of future results. It uses split- and dividend-adjusted
            closing prices but does <strong>not</strong> account for trading fees, taxes, slippage or bid/ask
            spreads, which hit active strategies hardest. Historical data is delayed and may contain errors.
            Past performance does not guarantee future results.
          </p>

          <div className="flex flex-wrap gap-3 text-sm">
            <Link href={`/stocks/${ranSymbol.toLowerCase()}`} className="text-[#c8a45d] hover:underline">
              View {ranSymbol} analysis →
            </Link>
            <Link href="/blog/how-to-backtest-a-stock-beginners-guide-2026" className="text-[#c8a45d] hover:underline">
              How to backtest a stock →
            </Link>
            <Link href="/screener" className="text-[#c8a45d] hover:underline">
              Stock Screener →
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}

function Stat({ label, value, accent, good, small }: { label: string; value: string; accent?: boolean; good?: boolean; small?: boolean }) {
  const color = good === true ? 'text-emerald-400' : good === false ? 'text-red-400' : accent ? 'text-[#c8a45d]' : 'text-zinc-100'
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`mt-1 font-bold ${small ? 'text-base' : 'text-lg'} ${color}`}>{value}</div>
    </div>
  )
}

function EquityChart({ a, b, label, bLabel }: { a: BacktestResult; b: BacktestResult; label: string; bLabel: string }) {
  const W = 640
  const H = 180
  const pad = 4
  const all = [...a.equity.map((p) => p.value), ...b.equity.map((p) => p.value)]
  const max = Math.max(...all, 1)
  const min = Math.min(...all, 0)
  const span = max - min || 1
  const path = (eq: { value: number }[]) => {
    const n = eq.length
    if (n < 2) return ''
    return eq
      .map((p, i) => {
        const x = pad + (i / (n - 1)) * (W - 2 * pad)
        const y = H - pad - ((p.value - min) / span) * (H - 2 * pad)
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
  }
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4">
      <div className="mb-2 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded bg-[#c8a45d]" /> {label}</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded bg-zinc-500" /> {bLabel}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        <path d={path(b.equity)} fill="none" stroke="#71717a" strokeWidth="1.5" />
        <path d={path(a.equity)} fill="none" stroke="#c8a45d" strokeWidth="2" />
      </svg>
    </div>
  )
}
