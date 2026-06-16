'use client'
import { useQuery } from '@tanstack/react-query'
import { getPollInterval } from '@/lib/market-hours'

export interface StockDetailData {
  symbol: string
  name: string
  currentPrice: number
  prevClose: number
  change: number
  changePct: number
  latestEod: {
    open: number; high: number; low: number; close: number
    volume: number; adj_close: number; date: string
  } | null
  recentEod: Array<{
    open: number; high: number; low: number; close: number
    adj_close: number; volume: number; date: string
  }>
  dividends: Array<{ date: string; dividend: number; symbol: string }>
  splits: Array<{ date: string; split_factor: number; symbol: string }>
  info: {
    sector: string | null; industry: string | null; description: string | null
    website: string | null; employees: number | null; country: string | null
    city: string | null; marketCap: number | null; pe: number | null
    eps: number | null; priceToBook: number | null; forwardPE: number | null
    pegRatio: number | null; beta: number | null; week52High: number | null
    week52Low: number | null; avgVolume3m: number | null; dividendYield: number | null
    dividendRate: number | null; exDividendDate: string | null; dividendDate: string | null; payoutRatio: number | null
    nextEarningsDate: string | null; bookValue: number | null
    profitMargin: number | null; operatingMargin: number | null; roe: number | null
    roa: number | null; revenueGrowth: number | null; earningsGrowth: number | null
    totalRevenue: number | null; totalDebt: number | null; debtToEquity: number | null
    currentRatio: number | null; freeCashflow: number | null
  } | null
  exchange: string | null
}

export interface HistoryData {
  period: string
  bars: Array<{
    date: string; open: number; high: number; low: number
    close: number; adj_close: number; volume: number
  }>
  count: number
}

export function useStockDetail(symbol: string, initialData?: StockDetailData) {
  return useQuery<StockDetailData>({
    queryKey: ['stock-detail', symbol],
    queryFn: () => fetch(`/api/stocks/${symbol}`).then((r) => r.json()),
    refetchInterval: getPollInterval,
    staleTime: 55_000,
    enabled: !!symbol,
    initialData,
    // treat SSR data as 55 s old so client refetches on mount without flash
    initialDataUpdatedAt: initialData ? Date.now() - 55_000 : undefined,
  })
}

export function useStockHistory(symbol: string, period: string) {
  return useQuery<HistoryData>({
    queryKey: ['stock-history', symbol, period],
    queryFn: () =>
      fetch(`/api/stocks/${symbol}/history?period=${period}`).then((r) => r.json()),
    staleTime: period === '1d' ? 55_000 : 5 * 60_000,
    enabled: !!symbol,
  })
}
