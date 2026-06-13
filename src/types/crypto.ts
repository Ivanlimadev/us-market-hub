export interface CryptoMarket {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  market_cap: number
  market_cap_rank: number
  fully_diluted_valuation: number | null
  total_volume: number
  high_24h: number
  low_24h: number
  price_change_24h: number
  price_change_percentage_24h: number
  price_change_percentage_1h_in_currency: number | null
  price_change_percentage_7d_in_currency: number | null
  price_change_percentage_30d_in_currency: number | null
  price_change_percentage_1y_in_currency: number | null
  market_cap_change_percentage_24h: number
  circulating_supply: number
  total_supply: number | null
  max_supply: number | null
  ath: number
  ath_change_percentage: number
  ath_date: string
  atl: number
  atl_change_percentage: number
  atl_date: string
  last_updated: string
}

export interface CryptoGlobal {
  active_cryptocurrencies: number
  markets: number
  total_market_cap_usd: number
  total_volume_usd: number
  market_cap_change_percentage_24h: number
  btc_dominance: number
  eth_dominance: number
  top_dominances: { symbol: string; pct: number }[]
}

export interface CryptoDetail {
  id: string
  symbol: string
  name: string
  image: { thumb: string; small: string; large: string }
  description: string
  categories: string[]
  homepage: string
  market_data: {
    current_price: number
    market_cap: number
    market_cap_rank: number
    total_volume: number
    high_24h: number
    low_24h: number
    price_change_24h: number
    price_change_percentage_24h: number
    price_change_percentage_7d: number
    price_change_percentage_14d: number
    price_change_percentage_30d: number
    price_change_percentage_60d: number
    price_change_percentage_1y: number
    circulating_supply: number
    total_supply: number | null
    max_supply: number | null
    ath: number
    ath_change_percentage: number
    ath_date: string
    atl: number
    atl_change_percentage: number
    atl_date: string
  }
}

export interface CryptoHistoryBar {
  time: number   // Unix seconds
  price: number
  volume: number
}

export type CryptoPeriod = '1h' | '24h' | '7d' | '30d' | '1y'

// Binance WebSocket ticker message
export interface BinanceTicker {
  s: string   // symbol e.g. BTCUSDT
  c: string   // last price
  p: string   // price change
  P: string   // price change percent
  h: string   // high
  l: string   // low
  v: string   // base volume
  q: string   // quote volume
}
