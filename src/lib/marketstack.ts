import type {
  MSEodResponse,
  MSIntradayResponse,
  MSTickerResponse,
  MSDividendResponse,
  MSSplitResponse,
} from '@/types/marketstack'

const BASE_URL = 'https://api.marketstack.com/v1'
const API_KEY = process.env.MARKETSTACK_API_KEY!

// In-memory cache to reduce redundant requests
const cache = new Map<string, { data: unknown; expiresAt: number }>()

function getCache<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

function setCache(key: string, data: unknown, ttlSeconds: number) {
  cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 })
}

async function msGet<T>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
  ttlSeconds = 60
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`)
  url.searchParams.set('access_key', API_KEY)

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v))
  }

  const cacheKey = url.toString().replace(API_KEY, 'KEY')

  const cached = getCache<T>(cacheKey)
  if (cached) return cached

  const res = await fetch(url.toString(), { next: { revalidate: ttlSeconds } })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Marketstack ${res.status}: ${body}`)
  }

  const data = (await res.json()) as T
  setCache(cacheKey, data, ttlSeconds)
  return data
}

// ─── Endpoints ────────────────────────────────────────────────────────────────

/** Latest EOD quote for one or more US tickers (comma-separated) */
export async function getEod(
  symbols: string | string[],
  options: { limit?: number; offset?: number; date_from?: string; date_to?: string } = {}
): Promise<MSEodResponse> {
  const sym = Array.isArray(symbols) ? symbols.join(',') : symbols
  return msGet<MSEodResponse>('/eod', { symbols: sym, ...options }, 60)
}

/** Latest EOD — single trading day for multiple tickers */
export async function getLatestEod(symbols: string | string[]): Promise<MSEodResponse> {
  const sym = Array.isArray(symbols) ? symbols.join(',') : symbols
  return msGet<MSEodResponse>('/eod/latest', { symbols: sym }, 60)
}

/** Intraday data (Pro plan required for <15 min intervals) */
export async function getIntraday(
  symbols: string | string[],
  options: {
    interval?: '1min' | '5min' | '10min' | '15min' | '30min' | '1hour'
    date_from?: string
    date_to?: string
    limit?: number
    offset?: number
  } = {}
): Promise<MSIntradayResponse> {
  const sym = Array.isArray(symbols) ? symbols.join(',') : symbols
  return msGet<MSIntradayResponse>(
    '/intraday',
    { symbols: sym, interval: options.interval ?? '5min', ...options },
    60
  )
}

/** Latest intraday snapshot */
export async function getLatestIntraday(
  symbols: string | string[],
  interval: '1min' | '5min' | '10min' | '15min' | '30min' | '1hour' = '5min'
): Promise<MSIntradayResponse> {
  const sym = Array.isArray(symbols) ? symbols.join(',') : symbols
  return msGet<MSIntradayResponse>('/intraday/latest', { symbols: sym, interval }, 60)
}

/** Ticker search / info */
export async function getTickers(
  search?: string,
  options: { exchange?: string; limit?: number; offset?: number } = {}
): Promise<MSTickerResponse> {
  return msGet<MSTickerResponse>('/tickers', { search, ...options }, 3600)
}

/** Single ticker info */
export async function getTicker(symbol: string): Promise<MSTickerResponse> {
  return msGet<MSTickerResponse>(`/tickers/${symbol}`, {}, 3600)
}

/** Dividend history */
export async function getDividends(
  symbols: string | string[],
  options: { date_from?: string; date_to?: string; limit?: number } = {}
): Promise<MSDividendResponse> {
  const sym = Array.isArray(symbols) ? symbols.join(',') : symbols
  return msGet<MSDividendResponse>('/dividends', { symbols: sym, ...options }, 3600)
}

/** Split history */
export async function getSplits(
  symbols: string | string[],
  options: { date_from?: string; date_to?: string; limit?: number } = {}
): Promise<MSSplitResponse> {
  const sym = Array.isArray(symbols) ? symbols.join(',') : symbols
  return msGet<MSSplitResponse>('/splits', { symbols: sym, ...options }, 3600)
}
