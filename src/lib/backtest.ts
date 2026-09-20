// Pure, dependency-free backtesting logic. No fetch, no React - just math on a
// series of daily bars so it is trivially testable. Always uses adj_close, which
// accounts for dividends and splits (raw close would silently understate returns).

export interface Bar {
  date: string
  adj_close: number
  close?: number
}

export type Strategy = 'lumpSum' | 'dca'

export interface BacktestConfig {
  strategy: Strategy
  /** Lump-sum amount invested once at the start (also allowed as a starting seed for DCA). */
  initial: number
  /** Monthly contribution (DCA only), invested on the first trading day of each month. */
  monthly: number
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
  /** Asset annualized return (price-based CAGR from first to last bar). */
  cagr: number
  /** Largest peak-to-trough decline of the portfolio equity curve (negative %). */
  maxDrawdown: number
  /** Annualized volatility of the asset's daily returns (%). */
  volatility: number
  bestYear: { year: number; pct: number } | null
  worstYear: { year: number; pct: number } | null
  years: number
  startDate: string
  endDate: string
  equity: { date: string; value: number }[]
  rows: YearRow[]
}

/** Keep only usable bars (positive adj_close), sorted ascending by date. */
function cleanBars(bars: Bar[]): Bar[] {
  return bars
    .filter((b) => b && typeof b.adj_close === 'number' && b.adj_close > 0 && b.date)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Indexes of the first trading day of each calendar month. */
function monthStartIndexes(bars: Bar[]): number[] {
  const out: number[] = []
  let lastKey = ''
  for (let i = 0; i < bars.length; i++) {
    const key = bars[i].date.slice(0, 7) // YYYY-MM
    if (key !== lastKey) {
      out.push(i)
      lastKey = key
    }
  }
  return out
}

export function runBacktest(rawBars: Bar[], cfg: BacktestConfig): BacktestResult | null {
  const bars = cleanBars(rawBars)
  if (bars.length < 2) return null
  if (cfg.initial < 0 || cfg.monthly < 0) return null
  if (cfg.strategy === 'lumpSum' && cfg.initial <= 0) return null
  if (cfg.strategy === 'dca' && cfg.monthly <= 0 && cfg.initial <= 0) return null

  const price = (i: number) => bars[i].adj_close

  // Build the invested-cash schedule (how much new money enters at each bar index).
  const contribAt = new Array(bars.length).fill(0)
  contribAt[0] += cfg.initial // seed lump (both strategies allow it)
  if (cfg.strategy === 'dca' && cfg.monthly > 0) {
    for (const idx of monthStartIndexes(bars)) {
      // idx 0 already carries the seed; still add the first monthly contribution there.
      contribAt[idx] += cfg.monthly
    }
  }

  // Walk the series: convert each contribution into shares at that day's price,
  // then mark the portfolio to market on every bar to build the equity curve.
  let shares = 0
  let invested = 0
  const equity: { date: string; value: number }[] = []
  for (let i = 0; i < bars.length; i++) {
    if (contribAt[i] > 0) {
      shares += contribAt[i] / price(i)
      invested += contribAt[i]
    }
    equity.push({ date: bars[i].date, value: shares * price(i) })
  }

  const finalValue = equity[equity.length - 1].value
  const totalInvested = invested
  const totalReturn = finalValue - totalInvested
  const returnPct = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0

  // Elapsed years from first to last bar (actual calendar span).
  const msPerYear = 365.25 * 24 * 3600 * 1000
  const years =
    (new Date(bars[bars.length - 1].date).getTime() - new Date(bars[0].date).getTime()) / msPerYear
  const safeYears = years > 0 ? years : 1

  // Asset CAGR (price-based, buy-and-hold annualized) - clean and strategy-independent.
  const cagr = (Math.pow(price(bars.length - 1) / price(0), 1 / safeYears) - 1) * 100

  // Max drawdown of the equity curve.
  let peak = -Infinity
  let maxDd = 0
  for (const p of equity) {
    if (p.value > peak) peak = p.value
    if (peak > 0) {
      const dd = (p.value - peak) / peak
      if (dd < maxDd) maxDd = dd
    }
  }
  const maxDrawdown = maxDd * 100

  // Annualized volatility of the asset's daily returns.
  const rets: number[] = []
  for (let i = 1; i < bars.length; i++) rets.push(price(i) / price(i - 1) - 1)
  const mean = rets.reduce((a, b) => a + b, 0) / (rets.length || 1)
  const variance = rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length || 1)
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100

  // Calendar-year asset returns (first vs last bar of each year) + year-by-year rows.
  const byYear = new Map<number, { first: number; last: number; value: number; invested: number }>()
  let investedRunning = 0
  let sharesRunning = 0
  for (let i = 0; i < bars.length; i++) {
    if (contribAt[i] > 0) {
      sharesRunning += contribAt[i] / price(i)
      investedRunning += contribAt[i]
    }
    const y = new Date(bars[i].date).getUTCFullYear()
    const cur = byYear.get(y)
    if (!cur) {
      byYear.set(y, { first: price(i), last: price(i), value: sharesRunning * price(i), invested: investedRunning })
    } else {
      cur.last = price(i)
      cur.value = sharesRunning * price(i)
      cur.invested = investedRunning
    }
  }

  const rows: YearRow[] = []
  let best: { year: number; pct: number } | null = null
  let worst: { year: number; pct: number } | null = null
  for (const [year, v] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    const yearPct = v.first > 0 ? (v.last / v.first - 1) * 100 : 0
    if (!best || yearPct > best.pct) best = { year, pct: yearPct }
    if (!worst || yearPct < worst.pct) worst = { year, pct: yearPct }
    rows.push({
      year,
      value: v.value,
      invested: v.invested,
      returnPct: v.invested > 0 ? (v.value / v.invested - 1) * 100 : 0,
    })
  }

  return {
    finalValue,
    totalInvested,
    totalReturn,
    returnPct,
    cagr,
    maxDrawdown,
    volatility,
    bestYear: best,
    worstYear: worst,
    years: safeYears,
    startDate: bars[0].date,
    endDate: bars[bars.length - 1].date,
    equity,
    rows,
  }
}
