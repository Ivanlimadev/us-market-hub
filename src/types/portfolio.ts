export type TransactionType = 'buy' | 'sell'
export type AssetType = 'stock' | 'crypto'

export interface Transaction {
  id: string
  symbol: string
  type: TransactionType
  quantity: number
  pricePerShare: number
  date: string // ISO date string
  fees: number
  asset_type?: AssetType
  coingeckoId?: string
}

export interface Holding {
  symbol: string
  name: string
  totalShares: number
  avgCost: number
  totalCost: number
  currentPrice: number
  currentValue: number
  unrealizedGain: number
  unrealizedGainPct: number
  prevClose: number
  dayChange: number
  dayChangePct: number
  dividendsReceived: number
  allocationPct: number
  asset_type: AssetType
  coingeckoId?: string
  image?: string
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
