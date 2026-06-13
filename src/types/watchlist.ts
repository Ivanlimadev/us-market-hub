export interface WatchlistItem {
  id: string
  symbol: string
  asset_type: 'stock' | 'crypto'
  coingeckoId?: string
  name: string
  image?: string
  addedAt: string
}

export interface PriceAlert {
  id: string
  symbol: string
  asset_type: 'stock' | 'crypto'
  coingeckoId?: string
  name: string
  image?: string
  condition: 'above' | 'below' | 'change_up' | 'change_down'
  targetPrice: number        // for 'above'/'below': absolute price; for 'change_*': referencePrice stored here
  targetPct?: number         // for 'change_up'/'change_down': the % threshold
  referencePrice?: number    // price at alert creation time (for % calculations)
  triggered: boolean
  triggeredAt?: string
  createdAt: string
}
