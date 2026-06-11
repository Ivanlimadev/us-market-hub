// Marketstack API — US Market types

export interface MSPagination {
  limit: number
  offset: number
  count: number
  total: number
}

export interface MSEod {
  open: number
  high: number
  low: number
  close: number
  volume: number
  adj_high: number | null
  adj_low: number | null
  adj_close: number
  adj_open: number | null
  adj_volume: number | null
  split_factor: number
  dividend: number
  symbol: string
  exchange: string
  date: string // ISO 8601
}

export interface MSIntraday {
  open: number
  high: number
  low: number
  last: number
  close: number
  volume: number
  date: string
  symbol: string
  exchange: string
}

export interface MSTicker {
  name: string
  symbol: string
  has_intraday: boolean
  has_eod: boolean
  country: string | null
  stock_exchange: MSExchange
}

export interface MSExchange {
  name: string
  acronym: string
  mic: string
  country: string
  country_code: string
  city: string
  website: string
}

export interface MSSplit {
  date: string
  split_factor: number
  symbol: string
  exchange: string
}

export interface MSDividend {
  date: string
  dividend: number
  symbol: string
  exchange: string
}

export interface MSEodResponse {
  pagination: MSPagination
  data: MSEod[]
}

export interface MSIntradayResponse {
  pagination: MSPagination
  data: MSIntraday[]
}

export interface MSTickerResponse {
  pagination: MSPagination
  data: MSTicker[]
}

export interface MSSplitResponse {
  pagination: MSPagination
  data: MSSplit[]
}

export interface MSDividendResponse {
  pagination: MSPagination
  data: MSDividend[]
}

export interface MSError {
  error: {
    code: string
    message: string
    context?: Record<string, unknown>
  }
}

// Internal normalized types used by the site
export interface Quote {
  symbol: string
  name: string
  price: number
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjClose: number
  date: string
  exchange: string
  change: number
  changePercent: number
}

export interface HistoricalBar {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface IntradayBar {
  date: string
  open: number
  high: number
  low: number
  last: number
  volume: number
}
