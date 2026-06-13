import type {
  MSEodResponse,
  MSIntradayResponse,
  MSTickerResponse,
  MSDividendResponse,
  MSSplitResponse,
} from '@/types/marketstack'
import { withRetry, HttpError } from '@/lib/retry'

const BASE_URL = 'https://api.marketstack.com/v1'
const API_KEY = process.env.MARKETSTACK_API_KEY!

// In-memory cache — expired entries are kept as stale fallback on API failure
const cache = new Map<string, { data: unknown; expiresAt: number }>()

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

  // Check cache — keep expired entry in map so it can serve as stale fallback
  const entry = cache.get(cacheKey)
  if (entry && Date.now() <= entry.expiresAt) return entry.data as T

  try {
    const data = await withRetry(async () => {
      const res = await fetch(url.toString(), { next: { revalidate: ttlSeconds } })
      if (!res.ok) {
        const body = await res.text()
        throw new HttpError(res.status, `Marketstack ${res.status}: ${body}`)
      }
      return res.json() as Promise<T>
    })
    setCache(cacheKey, data, ttlSeconds)
    return data
  } catch (err) {
    // API failed — serve stale data if available rather than crashing
    if (entry) {
      console.warn(`[Marketstack] stale fallback for ${endpoint}:`, (err as Error).message)
      return entry.data as T
    }
    throw err
  }
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
