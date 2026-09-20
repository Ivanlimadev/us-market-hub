// Pure, dependency-free backtesting engine. No fetch, no React - just math on a
// series of daily bars so it is trivially testable. Always uses adj_close, which
// accounts for dividends and splits (raw close would silently understate returns).
//
// Two families of strategy:
//  - Contribution strategies (lumpSum, dca): money flows in, always fully invested.
//  - Signal strategies (maCrossover, buyDip, rsi, trendFilter): a fixed amount is
//    deployed, and the engine moves fully in/out of the market on buy/sell rules.

export interface Bar {
  date: string
  adj_close: number
  close?: number
}

export type Strategy = 'lumpSum' | 'dca' | 'maCrossover' | 'buyDip' | 'rsi' | 'trendFilter'

export interface BacktestConfig {
  strategy: Strategy
  /** Amount invested up front (lumpSum / signal strategies) or a starting seed (dca). */
  initial: number
  /** DCA: monthly contribution. */
  monthly?: number
  /** MA crossover: fast / slow moving-average periods (days). */
  fastPeriod?: number
  slowPeriod?: number
  /** Buy the dip: buy when price is this % below its running peak; sell when this % above entry. */
  dipPct?: number
  exitPct?: number
  /** RSI: period and oversold/overbought thresholds. */
  rsiPeriod?: number
  rsiOversold?: number
  rsiOverbought?: number
  /** Trend filter: hold while price is above this moving average, else cash. */
  maPeriod?: number
}

export interface YearRow {
  year: number
  value: number
  invested: number
  returnPct: number
}

export interface BacktestResult {
  finalValue: number
  totalInvested: number
  totalReturn: number
  returnPct: number
  cagr: number
  maxDrawdown: number
  volatility: number
  bestYear: { year: number; pct: number } | null
  worstYear: { year: number; pct: number } | null
  years: number
  startDate: string
  endDate: string
  equity: { date: string; value: number }[]
  rows: YearRow[]
  // Signal-strategy extras (null / undefined for buy & hold / DCA).
  trades?: number
  winRatePct?: number | null
  timeInMarketPct?: number
}

function cleanBars(bars: Bar[]): Bar[] {
  return bars
    .filter((b) => b && typeof b.adj_close === 'number' && b.adj_close > 0 && b.date)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
}

function monthStartIndexes(bars: Bar[]): number[] {
  const out: number[] = []
  let lastKey = ''
  for (let i = 0; i < bars.length; i++) {
    const key = bars[i].date.slice(0, 7)
    if (key !== lastKey) {
      out.push(i)
      lastKey = key
    }
  }
  return out
}

/** Simple moving average of the last `period` values ending at index i (null if not enough data). */
function sma(vals: number[], period: number, i: number): number | null {
  if (period < 1 || i < period - 1) return null
  let s = 0
  for (let k = i - period + 1; k <= i; k++) s += vals[k]
  return s / period
}

/** Classic RSI (simple average of gains/losses over `period`), null until enough data. */
function rsiSeries(vals: number[], period: number): (number | null)[] {
  const out: (number | null)[] = new Array(vals.length).fill(null)
  if (vals.length <= period) return out
  for (let i = period; i < vals.length; i++) {
    let gain = 0
    let loss = 0
    for (let k = i - period + 1; k <= i; k++) {
      const ch = vals[k] - vals[k - 1]
      if (ch >= 0) gain += ch
      else loss -= ch
    }
    const avgGain = gain / period
    const avgLoss = loss / period
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return out
}

/** Elapsed calendar years between first and last bar. */
function elapsedYears(bars: Bar[]): number {
  const ms =
    new Date(bars[bars.length - 1].date).getTime() - new Date(bars[0].date).getTime()
  const y = ms / (365.25 * 24 * 3600 * 1000)
  return y > 0 ? y : 1
}

function maxDrawdownPct(equity: { value: number }[]): number {
  let peak = -Infinity
  let mdd = 0
  for (const p of equity) {
    if (p.value > peak) peak = p.value
    if (peak > 0) {
      const dd = (p.value - peak) / peak
      if (dd < mdd) mdd = dd
    }
  }
  return mdd * 100
}

function annualizedVol(prices: number[]): number {
  const rets: number[] = []
  for (let i = 1; i < prices.length; i++) rets.push(prices[i] / prices[i - 1] - 1)
  if (!rets.length) return 0
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / rets.length
  return Math.sqrt(variance) * Math.sqrt(252) * 100
}

/** Calendar-year value/invested rows + best/worst year (based on strategy equity where possible). */
function yearRows(
  bars: Bar[],
  valueAt: (i: number) => number,
  investedAt: (i: number) => number,
): { rows: YearRow[]; best: { year: number; pct: number } | null; worst: { year: number; pct: number } | null } {
  const byYear = new Map<number, { firstVal: number; firstInv: number; value: number; invested: number }>()
  for (let i = 0; i < bars.length; i++) {
    const y = new Date(bars[i].date).getUTCFullYear()
    const v = valueAt(i)
    const inv = investedAt(i)
    const cur = byYear.get(y)
    if (!cur) byYear.set(y, { firstVal: v, firstInv: inv, value: v, invested: inv })
    else {
      cur.value = v
      cur.invested = inv
    }
  }
  const rows: YearRow[] = []
  let best: { year: number; pct: number } | null = null
  let worst: { year: number; pct: number } | null = null
  for (const [year, v] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    const denom = v.invested > 0 ? v.invested : v.firstVal
    const pct = denom > 0 ? (v.value / denom - 1) * 100 : 0
    if (!best || pct > best.pct) best = { year, pct }
    if (!worst || pct < worst.pct) worst = { year, pct }
    rows.push({ year, value: v.value, invested: v.invested, returnPct: pct })
  }
  return { rows, best, worst }
}

export function runBacktest(rawBars: Bar[], cfg: BacktestConfig): BacktestResult | null {
  const bars = cleanBars(rawBars)
  if (bars.length < 2) return null
  if ((cfg.initial ?? 0) < 0) return null

  const prices = bars.map((b) => b.adj_close)
  const years = elapsedYears(bars)

  // ---- Contribution strategies: lumpSum & dca ----
  if (cfg.strategy === 'lumpSum' || cfg.strategy === 'dca') {
    const monthly = cfg.strategy === 'dca' ? Math.max(0, cfg.monthly ?? 0) : 0
    if (cfg.strategy === 'lumpSum' && cfg.initial <= 0) return null
    if (cfg.strategy === 'dca' && monthly <= 0 && cfg.initial <= 0) return null

    const contribAt = new Array(bars.length).fill(0)
    contribAt[0] += cfg.initial
    if (monthly > 0) for (const idx of monthStartIndexes(bars)) contribAt[idx] += monthly

    let shares = 0
    let invested = 0
    const sharesAt: number[] = []
    const investedArr: number[] = []
    const equity: { date: string; value: number }[] = []
    for (let i = 0; i < bars.length; i++) {
      if (contribAt[i] > 0) {
        shares += contribAt[i] / prices[i]
        invested += contribAt[i]
      }
      sharesAt.push(shares)
      investedArr.push(invested)
      equity.push({ date: bars[i].date, value: shares * prices[i] })
    }

    const finalValue = equity[equity.length - 1].value
    const totalReturn = finalValue - invested
    const { rows, best, worst } = yearRows(bars, (i) => sharesAt[i] * prices[i], (i) => investedArr[i])
    return {
      finalValue,
      totalInvested: invested,
      totalReturn,
      returnPct: invested > 0 ? (totalReturn / invested) * 100 : 0,
      cagr: (Math.pow(prices[bars.length - 1] / prices[0], 1 / years) - 1) * 100,
      maxDrawdown: maxDrawdownPct(equity),
      volatility: annualizedVol(prices),
      bestYear: best,
      worstYear: worst,
      years,
      startDate: bars[0].date,
      endDate: bars[bars.length - 1].date,
      equity,
      rows,
    }
  }

  // ---- Signal strategies: deploy `initial`, move fully in/out on rules ----
  const initial = cfg.initial > 0 ? cfg.initial : 10000
  const rsi = cfg.strategy === 'rsi' ? rsiSeries(prices, Math.max(2, cfg.rsiPeriod ?? 14)) : []
  let runningPeak = -Infinity

  let cash = initial
  let shares = 0
  let inMarket = false
  let entryPrice = 0
  let daysInMarket = 0
  const trades: number[] = []
  const equity: { date: string; value: number }[] = []
  const sharesAt: number[] = []

  for (let i = 0; i < bars.length; i++) {
    const price = prices[i]
    if (price > runningPeak) runningPeak = price

    let buy = false
    let sell = false
    switch (cfg.strategy) {
      case 'maCrossover': {
        const fp = Math.max(2, cfg.fastPeriod ?? 50)
        const sp = Math.max(fp + 1, cfg.slowPeriod ?? 200)
        const f = sma(prices, fp, i)
        const s = sma(prices, sp, i)
        const fPrev = sma(prices, fp, i - 1)
        const sPrev = sma(prices, sp, i - 1)
        if (f != null && s != null && fPrev != null && sPrev != null) {
          buy = fPrev <= sPrev && f > s
          sell = fPrev >= sPrev && f < s
        }
        break
      }
      case 'trendFilter': {
        const mp = Math.max(2, cfg.maPeriod ?? 200)
        const m = sma(prices, mp, i)
        if (m != null) {
          buy = price > m
          sell = price < m
        }
        break
      }
      case 'buyDip': {
        const dip = Math.max(1, cfg.dipPct ?? 10)
        const exit = Math.max(1, cfg.exitPct ?? 15)
        buy = runningPeak > 0 && price <= runningPeak * (1 - dip / 100)
        sell = inMarket && price >= entryPrice * (1 + exit / 100)
        break
      }
      case 'rsi': {
        const os = cfg.rsiOversold ?? 30
        const ob = cfg.rsiOverbought ?? 70
        const r = rsi[i]
        if (r != null) {
          buy = r < os
          sell = r > ob
        }
        break
      }
    }

    if (!inMarket && buy && cash > 0) {
      shares = cash / price
      cash = 0
      inMarket = true
      entryPrice = price
    } else if (inMarket && sell) {
      cash = shares * price
      trades.push(price / entryPrice - 1)
      shares = 0
      inMarket = false
    }

    if (inMarket) daysInMarket++
    sharesAt.push(shares)
    equity.push({ date: bars[i].date, value: cash + shares * price })
  }

  // Close any open position at the final price so win rate counts it.
  if (inMarket) trades.push(prices[bars.length - 1] / entryPrice - 1)

  const finalValue = equity[equity.length - 1].value
  const totalReturn = finalValue - initial
  const wins = trades.filter((t) => t > 0).length
  const { rows, best, worst } = yearRows(
    bars,
    (i) => equity[i].value,
    () => initial,
  )

  return {
    finalValue,
    totalInvested: initial,
    totalReturn,
    returnPct: (totalReturn / initial) * 100,
    cagr: (Math.pow(finalValue / initial, 1 / years) - 1) * 100,
    maxDrawdown: maxDrawdownPct(equity),
    volatility: annualizedVol(prices),
    bestYear: best,
    worstYear: worst,
    years,
    startDate: bars[0].date,
    endDate: bars[bars.length - 1].date,
    equity,
    rows,
    trades: trades.length,
    winRatePct: trades.length ? (wins / trades.length) * 100 : null,
    timeInMarketPct: (daysInMarket / bars.length) * 100,
  }
}
