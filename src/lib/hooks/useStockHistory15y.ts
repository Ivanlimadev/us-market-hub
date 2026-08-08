'use client'
import { useQuery } from '@tanstack/react-query'
import { fetchHistoryBars, type RawBar } from './useHistoryBars'

export interface HistoryBar {
  date: string
  close: number // always non-null after filtering
}

export interface PeriodReturn {
  key: string
  label: string
  startDate: string
  endDate: string
  startPrice: number
  endPrice: number
  pct: number
  hasData: boolean
}

// Periods to calculate - in days from today
const PERIODS = [
  { key: '1m',  label: '1 Month',   days: 30  },
  { key: '3m',  label: '3 Months',  days: 91  },
  { key: '6m',  label: '6 Months',  days: 182 },
  { key: '1y',  label: '1 Year',    days: 365 },
  { key: '2y',  label: '2 Years',   days: 730 },
  { key: '5y',  label: '5 Years',   days: 1825},
  { key: '10y', label: '10 Years',  days: 3650},
]

export function useStockHistory15y(symbol: string) {
  // Shares the canonical `['stock-history', symbol, '10y']` cache entry with the
  // growth-comparison chart, so the page's own symbol is fetched only once.
  // `select` maps the raw bars to this hook's split/dividend-adjusted shape
  // without touching the shared cache.
  return useQuery<RawBar[], Error, HistoryBar[]>({
    queryKey: ['stock-history', symbol, '10y'],
    queryFn: () => fetchHistoryBars(symbol, '10y'),
    select: (bars) =>
      bars
        .map((b) => ({ date: b.date, close: b.adjClose }))
        .filter((b) => b.close > 0),
    enabled: !!symbol,
    staleTime: 5 * 60_000,
    retry: 2,
  })
}

// Find the bar closest to N days ago
function findClosestBar(bars: HistoryBar[], daysAgo: number): HistoryBar | null {
  if (!bars.length) return null
  const target = new Date()
  target.setDate(target.getDate() - daysAgo)
  const targetMs = target.getTime()

  let best: HistoryBar | null = null
  let bestDiff = Infinity

  for (const b of bars) {
    const diff = Math.abs(new Date(b.date).getTime() - targetMs)
    if (diff < bestDiff) {
      bestDiff = diff
      best = b
    }
  }
  return best
}

export function calcPeriodReturns(bars: HistoryBar[]): PeriodReturn[] {
  if (!bars.length) return PERIODS.map((p) => ({ ...p, startDate: '', endDate: '', startPrice: 0, endPrice: 0, pct: 0, hasData: false }))

  const lastBar = bars[bars.length - 1]

  return PERIODS.map((p) => {
    const startBar = findClosestBar(bars, p.days)
    if (!startBar || startBar.date === lastBar.date) {
      return { ...p, startDate: '', endDate: '', startPrice: 0, endPrice: 0, pct: 0, hasData: false }
    }
    const pct = ((lastBar.close - startBar.close) / startBar.close) * 100
    return {
      ...p,
      startDate: startBar.date,
      endDate: lastBar.date,
      startPrice: startBar.close,
      endPrice: lastBar.close,
      pct,
      hasData: true,
    }
  })
}

export function calcSimulatorForDays(
  bars: HistoryBar[],
  dividendBars: Array<{ date: string; dividend: number }>,
  amount: number,
  daysAgo: number
): { withoutDiv: number | null; withDiv: number | null } {
  if (!bars.length || !amount) return { withoutDiv: null, withDiv: null }
  const lastBar = bars[bars.length - 1]
  const startBar = findClosestBar(bars, daysAgo)
  if (!startBar || startBar.date === lastBar.date) return { withoutDiv: null, withDiv: null }

  const withoutDiv = (lastBar.close / startBar.close) * amount

  const startDate = new Date(startBar.date)
  const relevantDivs = dividendBars.filter((d) => new Date(d.date) >= startDate)
  let shares = amount / startBar.close
  const priceMap = Object.fromEntries(bars.map((b) => [b.date, b.close]))
  for (const div of relevantDivs) {
    const divDate = div.date.split('T')[0]
    const price = priceMap[divDate] ?? lastBar.close
    if (price > 0) shares += (shares * div.dividend) / price
  }
  const withDiv = shares * lastBar.close

  return { withoutDiv, withDiv }
}

export function calcSimulator(
  bars: HistoryBar[],
  dividendBars: Array<{ date: string; dividend: number }>,
  amount: number
) {
  if (!bars.length || !amount) return null
  const lastBar = bars[bars.length - 1]

  return PERIODS.filter((p) => p.days <= 5475).map((p) => {
    const startBar = findClosestBar(bars, p.days)
    if (!startBar || startBar.date === lastBar.date) {
      return { ...p, withoutDiv: null, withDiv: null }
    }

    // Price only
    const withoutDiv = (lastBar.close / startBar.close) * amount

    // With dividend reinvestment
    const startDate = new Date(startBar.date)
    const relevantDivs = dividendBars.filter((d) => new Date(d.date) >= startDate)

    let shares = amount / startBar.close
    const priceMap = Object.fromEntries(bars.map((b) => [b.date, b.close]))

    for (const div of relevantDivs) {
      const divDate = div.date.split('T')[0]
      const price = priceMap[divDate] ?? lastBar.close
      if (price > 0) shares += (shares * div.dividend) / price
    }
    const withDiv = shares * lastBar.close

    return { ...p, withoutDiv, withDiv }
  })
}
