'use client'
import { useState, useCallback, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { runBacktest, type Bar, type Strategy, type BacktestResult } from '@/lib/backtest'

const RANGES = ['1y', '2y', '5y', '10y'] as const
type Range = (typeof RANGES)[number]

const BENCHMARK = 'SPY'

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
const pct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`

async function fetchBars(symbol: string, range: Range): Promise<Bar[]> {
  const res = await fetch(`/api/history?symbol=${encodeURIComponent(symbol)}&range=${range}`)
  if (!res.ok) throw new Error('no data')
  const json = await res.json()
  return (json.bars ?? []) as Bar[]
}

export function BacktestCalc() {
  const params = useSearchParams()
  const [symbol, setSymbol] = useState('AAPL')
  const [strategy, setStrategy] = useState<Strategy>('lumpSum')
  const [initial, setInitial] = useState('10000')
  const [monthly, setMonthly] = useState('500')
  const [range, setRange] = useState<Range>('10y')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [benchmark, setBenchmark] = useState<BacktestResult | null>(null)
  const [ranSymbol, setRanSymbol] = useState('')

  // Deep-link prefill: /calculators/backtest?symbol=AAPL (from asset pages).
  useEffect(() => {
    const s = params.get('symbol')
    if (s) setSymbol(s.toUpperCase())
  }, [params])

  const run = useCallback(async () => {
    const sym = symbol.trim().toUpperCase()
    if (!sym) return
    setLoading(true)
    setError(null)
    try {
      const cfg = {
        strategy,
        initial: Math.max(0, Number(initial) || 0),
        monthly: strategy === 'dca' ? Math.max(0, Number(monthly) || 0) : 0,
      }
      const [bars, benchBars] = await Promise.all([
        fetchBars(sym, range),
        fetchBars(BENCHMARK, range),
      ])
      const r = runBacktest(bars, cfg)
      if (!r) {
        setResult(null)
        setBenchmark(null)
        setError(`No historical data for "${sym}". Check the ticker and try again.`)
        return
      }
      setResult(r)
      setBenchmark(runBacktest(benchBars, cfg))
      setRanSymbol(sym)
    } catch {
      setResult(null)
      setBenchmark(null)
      setError(`Could not load data for "${sym}". Check the ticker and try again.`)
    } finally {
      setLoading(false)
    }
  }, [symbol, strategy, initial, monthly, range])

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold sm:text-3xl">Backtest Calculator</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Test how a strategy would have performed on any stock or ETF using real historical data.
        Compare buy &amp; hold or dollar-cost averaging against the S&amp;P 500.
      </p>

      {/* Inputs */}
      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
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
                    range === r
                      ? 'border-[#c8a45d] bg-[#c8a45d]/10 text-[#c8a45d]'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </label>
        </div>

        <div className="mt-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Strategy</span>
          <div className="mt-1 flex gap-1">
            <button
              onClick={() => setStrategy('lumpSum')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                strategy === 'lumpSum'
                  ? 'border-[#c8a45d] bg-[#c8a45d]/10 text-[#c8a45d]'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              Lump Sum (Buy &amp; Hold)
            </button>
            <button
              onClick={() => setStrategy('dca')}
              className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                strategy === 'dca'
                  ? 'border-[#c8a45d] bg-[#c8a45d]/10 text-[#c8a45d]'
                  : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
              }`}
            >
              Dollar-Cost Averaging
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {strategy === 'lumpSum' ? 'Amount invested' : 'Starting amount'}
            </span>
            <input
              type="number"
              value={initial}
              onChange={(e) => setInitial(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#c8a45d]"
            />
          </label>
          {strategy === 'dca' && (
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Monthly contribution</span>
              <input
                type="number"
                value={monthly}
                onChange={(e) => setMonthly(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-[#c8a45d]"
              />
            </label>
          )}
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

      {/* Results */}
      {result && (
        <div className="mt-6 space-y-5">
          <p className="text-sm text-zinc-400">
            {ranSymbol} · {new Date(result.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}{' '}
            to {new Date(result.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </p>

          {/* Headline cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Final Value" value={usd(result.finalValue)} accent />
            <Stat label="Total Invested" value={usd(result.totalInvested)} />
            <Stat label="Total Return" value={pct(result.returnPct)} good={result.returnPct >= 0} />
            <Stat label="Profit" value={usd(result.totalReturn)} good={result.totalReturn >= 0} />
          </div>

          {/* Equity curve vs benchmark */}
          {benchmark && <EquityChart a={result} b={benchmark} label={ranSymbol} />}

          {/* Benchmark comparison */}
          {benchmark && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">
                  Same strategy on <strong className="text-zinc-200">{BENCHMARK}</strong> (S&amp;P 500)
                </span>
                <span className={benchmark.returnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {usd(benchmark.finalValue)} ({pct(benchmark.returnPct)})
                </span>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {ranSymbol} {result.returnPct >= benchmark.returnPct ? 'beat' : 'trailed'} the S&amp;P 500 by{' '}
                {Math.abs(result.returnPct - benchmark.returnPct).toFixed(1)} percentage points over this period.
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Asset CAGR" value={pct(result.cagr)} good={result.cagr >= 0} small />
            <Stat label="Max Drawdown" value={`${result.maxDrawdown.toFixed(1)}%`} good={false} small />
            <Stat label="Volatility" value={`${result.volatility.toFixed(1)}%`} small />
            <Stat
              label="Best / Worst Yr"
              value={
                result.bestYear && result.worstYear
                  ? `${pct(result.bestYear.pct)} / ${pct(result.worstYear.pct)}`
                  : '-'
              }
              small
            />
          </div>

          {/* Year-by-year */}
          <div className="overflow-hidden rounded-2xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-2 text-left">Year</th>
                  <th className="px-4 py-2 text-right">Invested</th>
                  <th className="px-4 py-2 text-right">Value</th>
                  <th className="px-4 py-2 text-right">Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {result.rows.map((r) => (
                  <tr key={r.year}>
                    <td className="px-4 py-2">{r.year}</td>
                    <td className="px-4 py-2 text-right text-zinc-400">{usd(r.invested)}</td>
                    <td className="px-4 py-2 text-right">{usd(r.value)}</td>
                    <td className={`px-4 py-2 text-right ${r.returnPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pct(r.returnPct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 text-xs leading-relaxed text-zinc-500">
            <strong className="text-zinc-400">Important:</strong> This backtest is for educational purposes
            only and is not financial advice or a prediction of future results. It uses split- and
            dividend-adjusted closing prices but does <strong>not</strong> account for trading fees, taxes,
            slippage or bid/ask spreads. Historical data is delayed and may contain errors. Past performance
            does not guarantee future results. Always do your own research before investing.
          </p>

          <div className="flex flex-wrap gap-3 text-sm">
            <Link href={`/stocks/${ranSymbol.toLowerCase()}`} className="text-[#c8a45d] hover:underline">
              View {ranSymbol} analysis →
            </Link>
            <Link href="/screener" className="text-[#c8a45d] hover:underline">
              Find stocks with our Screener →
            </Link>
            <Link href="/calculators/dca" className="text-[#c8a45d] hover:underline">
              DCA Calculator →
            </Link>
          </div>
        </div>
      )}
    </main>
  )
}

function Stat({
  label,
  value,
  accent,
  good,
  small,
}: {
  label: string
  value: string
  accent?: boolean
  good?: boolean
  small?: boolean
}) {
  const color =
    good === true ? 'text-emerald-400' : good === false ? 'text-red-400' : accent ? 'text-[#c8a45d]' : 'text-zinc-100'
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`mt-1 font-bold ${small ? 'text-base' : 'text-lg'} ${color}`}>{value}</div>
    </div>
  )
}

/** Minimal, dependency-free SVG line chart of two equity curves (normalized width). */
function EquityChart({ a, b, label }: { a: BacktestResult; b: BacktestResult; label: string }) {
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
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded bg-[#c8a45d]" /> {label}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded bg-zinc-500" /> S&amp;P 500 (SPY)
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        <path d={path(b.equity)} fill="none" stroke="#71717a" strokeWidth="1.5" />
        <path d={path(a.equity)} fill="none" stroke="#c8a45d" strokeWidth="2" />
      </svg>
    </div>
  )
}
