import type { Transaction, Holding, PortfolioSummary, AssetType } from '@/types/portfolio'
import type { MSEod } from '@/types/marketstack'

export interface TickerMeta {
  name: string
  prevClose: number
  currentPrice: number
  asset_type?: AssetType
  coingeckoId?: string
  image?: string
}

// Weighted average cost across all buys (adjusted on sells)
export function computeHoldings(
  transactions: Transaction[],
  quotes: Record<string, TickerMeta>,
  dividends: Record<string, number> = {}
): Holding[] {
  const ledger: Record<
    string,
    { totalShares: number; totalCost: number }
  > = {}

  // Process transactions in chronological order
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  for (const tx of sorted) {
    if (!ledger[tx.symbol]) ledger[tx.symbol] = { totalShares: 0, totalCost: 0 }
    const pos = ledger[tx.symbol]

    if (tx.type === 'buy') {
      pos.totalCost += tx.quantity * tx.pricePerShare + tx.fees
      pos.totalShares += tx.quantity
    } else {
      // Sell: reduce shares, proportionally reduce cost basis
      const sellQty = Math.min(tx.quantity, pos.totalShares)
      const pct = pos.totalShares > 0 ? sellQty / pos.totalShares : 0
      pos.totalCost -= pos.totalCost * pct
      pos.totalShares -= sellQty
    }
  }

  const holdings: Holding[] = []
  let totalPortfolioValue = 0

  for (const [symbol, pos] of Object.entries(ledger)) {
    if (pos.totalShares <= 0) continue
    const meta = quotes[symbol]
    const currentPrice = meta?.currentPrice ?? 0
    const prevClose = meta?.prevClose ?? 0
    const avgCost = pos.totalCost / pos.totalShares
    const currentValue = pos.totalShares * currentPrice
    const unrealizedGain = currentValue - pos.totalCost
    const unrealizedGainPct = pos.totalCost > 0 ? (unrealizedGain / pos.totalCost) * 100 : 0
    const dayChange = (currentPrice - prevClose) * pos.totalShares
    const dayChangePct = prevClose > 0 ? ((currentPrice - prevClose) / prevClose) * 100 : 0

    totalPortfolioValue += currentValue
    holdings.push({
      symbol,
      name: meta?.name ?? symbol,
      totalShares: pos.totalShares,
      avgCost,
      totalCost: pos.totalCost,
      currentPrice,
      currentValue,
      unrealizedGain,
      unrealizedGainPct,
      prevClose,
      dayChange,
      dayChangePct,
      dividendsReceived: dividends[symbol] ?? 0,
      allocationPct: 0,
      asset_type: meta?.asset_type ?? 'stock',
      coingeckoId: meta?.coingeckoId,
      image: meta?.image,
    })
  }

  // Fill allocation %
  for (const h of holdings) {
    h.allocationPct = totalPortfolioValue > 0 ? (h.currentValue / totalPortfolioValue) * 100 : 0
  }

  return holdings.sort((a, b) => b.currentValue - a.currentValue)
}

export function computeSummary(holdings: Holding[]): PortfolioSummary {
  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0)
  const totalCost = holdings.reduce((s, h) => s + h.totalCost, 0)
  const totalUnrealizedGain = totalValue - totalCost
  const totalUnrealizedGainPct = totalCost > 0 ? (totalUnrealizedGain / totalCost) * 100 : 0
  const totalDayChange = holdings.reduce((s, h) => s + h.dayChange, 0)
  const prevValue = holdings.reduce((s, h) => s + h.prevClose * h.totalShares, 0)
  const totalDayChangePct = prevValue > 0 ? (totalDayChange / prevValue) * 100 : 0
  const totalDividends = holdings.reduce((s, h) => s + h.dividendsReceived, 0)

  return {
    totalValue,
    totalCost,
    totalUnrealizedGain,
    totalUnrealizedGainPct,
    totalDayChange,
    totalDayChangePct,
    totalDividends,
    holdings,
  }
}

// Build TickerMeta from Marketstack EOD response array (latest + previous)
export function buildTickerMeta(
  latestBars: MSEod[],
  prevBars: MSEod[]
): Record<string, TickerMeta> {
  const prevMap: Record<string, number> = {}
  for (const bar of prevBars) {
    prevMap[bar.symbol] = bar.adj_close ?? bar.close ?? 0
  }

  const meta: Record<string, TickerMeta> = {}
  for (const bar of latestBars) {
    meta[bar.symbol] = {
      name: (bar as MSEod & { name?: string }).name ?? bar.symbol,
      currentPrice: bar.adj_close ?? bar.close ?? bar.open ?? 0,
      prevClose: prevMap[bar.symbol] ?? 0,
    }
  }
  return meta
}
