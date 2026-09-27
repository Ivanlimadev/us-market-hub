import { getYFChart } from '@/lib/yahoo-finance'
import {
  runBacktest,
  type Bar,
  type Strategy,
  type BacktestConfig,
  type BacktestResult,
} from '@/lib/backtest'
import {
  OracleParamError,
  OracleFetchError,
  type OracleAdapter,
} from '@/lib/oracle/types'

// compute.backtest — runs a strategy over a symbol's adjusted-close history and
// returns the DERIVED result (CAGR, Sharpe/volatility, max drawdown, equity
// curve). Green: the price series (yellow, Yahoo) is only an internal input;
// what we return is our own computation, not the raw vendor feed. Raw bars are
// deliberately NOT included in the response.

const STRATEGIES = new Set<Strategy>([
  'lumpSum', 'dca', 'maCrossover', 'buyDip', 'rsi', 'trendFilter',
])
const RANGES = new Set(['1mo', '3mo', '6mo', 'ytd', '1y', '2y', '5y', '10y', 'max'])

function num(v: string | undefined): number | undefined {
  if (v == null || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

interface BacktestParams {
  symbol?: string
  strategy?: string
  range?: string
  initial?: string
  monthly?: string
  fastPeriod?: string
  slowPeriod?: string
  dipPct?: string
  exitPct?: string
  rsiPeriod?: string
  rsiOversold?: string
  rsiOverbought?: string
  maPeriod?: string
}

export const backtestAdapter: OracleAdapter<BacktestParams, BacktestResult> = {
  key: 'compute.backtest',
  meta: {
    title: 'Strategy backtest (CAGR, drawdown, volatility, equity curve)',
    category: 'derived',
    source: 'compute:backtest',
    license: 'green',
    status: 'live',
    params: [
      { name: 'symbol', required: true, type: 'string' },
      { name: 'strategy', required: true, type: 'lumpSum|dca|maCrossover|buyDip|rsi|trendFilter' },
      { name: 'range', required: false, type: '1y|2y|5y|10y|max (default 5y)' },
      { name: 'initial', required: false, type: 'number (default 10000)' },
      { name: 'monthly', required: false, type: 'number (dca)' },
    ],
  },
  async fetch(p) {
    if (!p.symbol) throw new OracleParamError('symbol required')
    const strategy = p.strategy as Strategy
    if (!strategy || !STRATEGIES.has(strategy)) {
      throw new OracleParamError('strategy required: lumpSum|dca|maCrossover|buyDip|rsi|trendFilter')
    }
    const range = p.range && RANGES.has(p.range) ? p.range : '5y'

    let bars: Bar[]
    try {
      bars = (await getYFChart(p.symbol, range, '1d')) as Bar[]
    } catch {
      throw new OracleFetchError('price history unavailable', 502)
    }
    if (!bars?.length) throw new OracleFetchError(`no history for ${p.symbol}`, 404)

    const cfg: BacktestConfig = {
      strategy,
      initial: num(p.initial) ?? 10000,
      monthly: num(p.monthly),
      fastPeriod: num(p.fastPeriod),
      slowPeriod: num(p.slowPeriod),
      dipPct: num(p.dipPct),
      exitPct: num(p.exitPct),
      rsiPeriod: num(p.rsiPeriod),
      rsiOversold: num(p.rsiOversold),
      rsiOverbought: num(p.rsiOverbought),
      maPeriod: num(p.maPeriod),
    }

    const result = runBacktest(bars, cfg)
    if (!result) throw new OracleParamError('backtest could not run with these params')

    const asOf = result.endDate
      ? new Date(result.endDate).toISOString()
      : new Date().toISOString()
    return { data: result, asOf }
  },
}
