export type TransactionType = 'buy' | 'sell'

export interface Transaction {
  id: string
  symbol: string
  type: TransactionType
  quantity: number
  pricePerShare: number
  date: string // ISO date string
  fees: number
}

export interface Holding {
  symbol: string
  name: string
  totalShares: number
  avgCost: number       // weighted average cost per share
  totalCost: number     // totalShares * avgCost
  currentPrice: number
  currentValue: number  // totalShares * currentPrice
  unrealizedGain: number
  unrealizedGainPct: number
  prevClose: number
  dayChange: number     // (currentPrice - prevClose) * totalShares
  dayChangePct: number
  dividendsReceived: number
  allocationPct: number // % of total portfolio value
}

export interface PortfolioSummary {
  totalValue: number
  totalCost: number
  totalUnrealizedGain: number
  totalUnrealizedGainPct: number
  totalDayChange: number
  totalDayChangePct: number
  totalDividends: number
  holdings: Holding[]
}
