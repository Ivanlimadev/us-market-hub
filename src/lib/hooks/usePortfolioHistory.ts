'use client'
import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { usePortfolioStore } from '@/lib/store/portfolio-store'
import type { Transaction } from '@/types/portfolio'
import type { YFChartBar } from '@/lib/yahoo-finance'

export type HistoryPeriod = '1M' | '3M' | '6M' | '1Y' | 'ALL'

export interface PortfolioHistoryPoint {
  date: string  // 'YYYY-MM-DD'
  value: number
  cost: number
}

const YF_RANGE: Record<HistoryPeriod, string> = {
  '1M': '1mo', '3M': '3mo', '6M': '6mo', '1Y': '1y', 'ALL': '2y',
}

const CG_DAYS: Record<HistoryPeriod, number> = {
  '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'ALL': 730,
}

interface CryptoBar { time: number; price: number }
interface CryptoAsset { symbol: string; coingeckoId: string }

function unixToDate(unixSec: number): string {
  return new Date(unixSec * 1000).toISOString().split('T')[0]
}

// Fill price backwards for weekends/holidays
function getLatestPrice(
  priceMap: Record<string, number>,
  date: string,
): number | undefined {
  if (priceMap[date] != null) return priceMap[date]
  const d = new Date(date + 'T12:00:00Z')
  for (let i = 1; i <= 7; i++) {
    d.setUTCDate(d.getUTCDate() - 1)
    const prev = d.toISOString().split('T')[0]
    if (priceMap[prev] != null) return priceMap[prev]
  }
  return undefined
}

function applyTx(
  ledger: Record<string, { totalShares: number; totalCost: number }>,
  tx: Transaction,
) {
  if (!ledger[tx.symbol]) ledger[tx.symbol] = { totalShares: 0, totalCost: 0 }
  const pos = ledger[tx.symbol]
  if (tx.type === 'buy') {
    pos.totalCost   += tx.quantity * tx.pricePerShare + (tx.fees ?? 0)
    pos.totalShares += tx.quantity
  } else {
    const qty = Math.min(tx.quantity, pos.totalShares)
    const pct = pos.totalShares > 0 ? qty / pos.totalShares : 0
    pos.totalCost   -= pos.totalCost * pct
    pos.totalShares -= qty
  }
}

function computeHistory(
  transactions: Transaction[],
  stockPrices: Record<string, Record<string, number>>,
  cryptoPrices: Record<string, Record<string, number>>,
  period: HistoryPeriod,
): PortfolioHistoryPoint[] {
  if (!transactions.length) return []

  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))

  // Start date
  const firstTxDate = sorted[0].date
  let startDate: string
  if (period === 'ALL') {
    startDate = firstTxDate
  } else {
    const days = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365 }[period as Exclude<HistoryPeriod, 'ALL'>]
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - days)
    startDate = d.toISOString().split('T')[0]
    if (startDate < firstTxDate) startDate = firstTxDate
  }

  // Symbol metadata (first occurrence wins)
  const symbolMeta: Record<string, { asset_type: 'stock' | 'crypto'; coingeckoId?: string }> = {}
  for (const tx of sorted) {
    if (!symbolMeta[tx.symbol]) {
      symbolMeta[tx.symbol] = { asset_type: tx.asset_type ?? 'stock', coingeckoId: tx.coingeckoId }
    }
  }

  // Build ledger state up to (but not including) startDate
  const ledger: Record<string, { totalShares: number; totalCost: number }> = {}
  let txIdx = 0
  while (txIdx < sorted.length && sorted[txIdx].date < startDate) {
    applyTx(ledger, sorted[txIdx++])
  }

  // Iterate each day from startDate to today
  const result: PortfolioHistoryPoint[] = []
  const cur = new Date(startDate + 'T12:00:00Z')
  const end = new Date()
  end.setUTCHours(12, 0, 0, 0)

  while (cur <= end) {
    const dateStr = cur.toISOString().split('T')[0]

    // Apply transactions on this date
    while (txIdx < sorted.length && sorted[txIdx].date <= dateStr) {
      applyTx(ledger, sorted[txIdx++])
    }

    let value = 0
    let cost  = 0

    for (const [symbol, pos] of Object.entries(ledger)) {
      if (pos.totalShares <= 0) continue
      const meta = symbolMeta[symbol]
      const price = meta.asset_type === 'crypto'
        ? getLatestPrice(cryptoPrices[symbol] ?? {}, dateStr)
        : getLatestPrice(stockPrices[symbol] ?? {}, dateStr)
      if (price != null) {
        value += pos.totalShares * price
        cost  += pos.totalCost
      }
    }

    if (value > 0) result.push({ date: dateStr, value, cost })

    cur.setUTCDate(cur.getUTCDate() + 1)
  }

  return result
}

export function usePortfolioHistory(period: HistoryPeriod) {
  const transactions = usePortfolioStore((s) => s.transactions)

  const stockSymbols: string[] = useMemo(() => [...new Set(
    transactions
      .filter((t) => (t.asset_type ?? 'stock') === 'stock')
      .map((t) => t.symbol),
  )], [transactions])

  const cryptoAssets: CryptoAsset[] = useMemo(() => {
    const seen = new Map<string, CryptoAsset>()
    for (const t of transactions) {
      if (t.asset_type === 'crypto' && t.coingeckoId && !seen.has(t.symbol)) {
        seen.set(t.symbol, { symbol: t.symbol, coingeckoId: t.coingeckoId })
      }
    }
    return [...seen.values()]
  }, [transactions])

  const yfRange = YF_RANGE[period]
  const cgDays  = CG_DAYS[period]

  // Fetch all stock histories in parallel
  const stockResults = useQueries({
    queries: stockSymbols.map((symbol) => ({
      queryKey: ['stock-history', symbol, yfRange],
      queryFn: (): Promise<YFChartBar[]> =>
        fetch(`/api/stock-history?symbol=${symbol}&range=${yfRange}`)
          .then((r) => r.json()),
      staleTime: 60 * 60_000,
    })),
  })

  // Fetch all crypto histories in parallel
  const cryptoResults = useQueries({
    queries: cryptoAssets.map(({ coingeckoId }) => ({
      queryKey: ['crypto-history-pf', coingeckoId, cgDays],
      queryFn: (): Promise<CryptoBar[]> =>
        fetch(`/api/crypto/${coingeckoId}/history?days=${cgDays}`)
          .then((r) => r.json()),
      staleTime: 60 * 60_000,
    })),
  })

  const isLoading =
    stockResults.some((r) => r.isLoading) ||
    cryptoResults.some((r) => r.isLoading)

  const allFetched =
    stockResults.every((r) => r.isFetched) &&
    cryptoResults.every((r) => r.isFetched)

  const data = useMemo(() => {
    if (!allFetched || !transactions.length) return []

    // Build stock price maps: symbol → { date → price }
    const stockPrices: Record<string, Record<string, number>> = {}
    stockSymbols.forEach((symbol, i) => {
      const bars = stockResults[i].data ?? []
      stockPrices[symbol] = {}
      for (const bar of bars) {
        stockPrices[symbol][bar.date] = bar.adj_close
      }
    })

    // Build crypto price maps: symbol → { date → price }
    const cryptoPrices: Record<string, Record<string, number>> = {}
    cryptoAssets.forEach(({ symbol }, i) => {
      const bars = (cryptoResults[i].data ?? []) as CryptoBar[]
      cryptoPrices[symbol] = {}
      for (const bar of bars) {
        const date = unixToDate(bar.time)
        // Keep the last price for each date (CoinGecko may return hourly for some ranges)
        cryptoPrices[symbol][date] = bar.price
      }
    })

    return computeHistory(transactions, stockPrices, cryptoPrices, period)
  }, [allFetched, transactions, stockSymbols, cryptoAssets, period])  // eslint-disable-line react-hooks/exhaustive-deps

  return { data, isLoading }
}
