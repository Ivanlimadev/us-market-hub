'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  createChart,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
  type AreaSeriesOptions,
  type UTCTimestamp,
} from 'lightweight-charts'
import { useQuery } from '@tanstack/react-query'
import { useStockHistory } from '@/lib/hooks/useStockDetail'

const PERIODS = [
  { key: '1d',  label: '1D'  },
  { key: '1w',  label: '1W'  },
  { key: '1m',  label: '1M'  },
  { key: '3m',  label: '3M'  },
  { key: '6m',  label: '6M'  },
  { key: 'ytd', label: 'YTD' },
  { key: '1y',  label: '1Y'  },
  { key: '2y',  label: '2Y'  },
  { key: '5y',  label: '5Y'  },
  { key: '10y', label: '10Y' },
  { key: '15y', label: '15Y' },
]

interface IntradayBar { timestamp: number; value: number }
interface EodBar { date: string; adj_close?: number | null; close?: number | null }

interface Props {
  symbol: string
  currentPrice: number
  prevClose: number
}

function useIntraday(symbol: string, enabled: boolean) {
  return useQuery({
    queryKey: ['intraday-chart', symbol],
    queryFn: async (): Promise<IntradayBar[]> => {
      const res = await fetch(`/api/stocks/${symbol}/intraday?interval=5min`)
      const data = await res.json() as { bars?: Array<{ timestamp: number; value: number }> }
      return data.bars ?? []
    },
    enabled,
    staleTime: 55_000,
    refetchInterval: enabled ? 60_000 : false,
  })
}

export function PriceChart({ symbol, currentPrice, prevClose }: Props) {
  const [period, setPeriod] = useState('1y')
  const chartRef   = useRef<HTMLDivElement>(null)
  const chartApi   = useRef<IChartApi | null>(null)
  const seriesRef  = useRef<ISeriesApi<'Area'> | null>(null)

  const is1D = period === '1d'
  const { data: intraday, isLoading: intradayLoading } = useIntraday(symbol, is1D)
  const { data: history,  isLoading: histLoading }     = useStockHistory(symbol, is1D ? '1m' : period)

  const isLoading = is1D ? intradayLoading : histLoading
  const isUp  = currentPrice >= prevClose
  const color = isUp ? '#10b981' : '#ef4444'

  const updateSeries = useCallback(() => {
    if (!seriesRef.current) return

    if (is1D && intraday?.length) {
      // Intraday: time must be UTCTimestamp (seconds since epoch)
      const chartData = intraday.map((b) => ({
        time: b.timestamp as UTCTimestamp,
        value: b.value,
      }))
      seriesRef.current.setData(chartData)
      chartApi.current?.timeScale().fitContent()
      return
    }

    if (!is1D && history?.bars?.length) {
      // EOD: time must be 'yyyy-mm-dd' string — extract date part only
      const chartData = (history.bars as EodBar[])
        .filter((b) => (b.adj_close ?? b.close) != null)
        .map((b) => ({
          time: b.date.split('T')[0] as `${number}-${number}-${number}`,
          value: (b.adj_close ?? b.close) as number,
        }))
      seriesRef.current.setData(chartData)
      chartApi.current?.timeScale().fitContent()
    }
  }, [is1D, intraday, history])

  // Init chart once
  useEffect(() => {
    if (!chartRef.current) return
    const chart = createChart(chartRef.current, {
      layout: { background: { color: 'transparent' }, textColor: '#71717a' },
      grid:   { vertLines: { color: '#27272a' }, horzLines: { color: '#27272a' } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#3f3f46' },
      timeScale: { borderColor: '#3f3f46', timeVisible: false, secondsVisible: false },
    })

    const series = chart.addSeries(AreaSeries, {
      lineColor:    color,
      topColor:     `${color}40`,
      bottomColor:  `${color}05`,
      lineWidth:    2,
      priceLineVisible: false,
    } as Partial<AreaSeriesOptions>)

    chartApi.current = chart
    seriesRef.current = series

    const ro = new ResizeObserver(() => {
      if (chartRef.current)
        chart.resize(chartRef.current.clientWidth, chartRef.current.clientHeight)
    })
    ro.observe(chartRef.current)

    return () => { ro.disconnect(); chart.remove() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Toggle timeVisible for intraday vs EOD
  useEffect(() => {
    chartApi.current?.applyOptions({
      timeScale: { timeVisible: is1D, secondsVisible: false },
    })
  }, [is1D])

  // Update series color on trend change
  useEffect(() => {
    seriesRef.current?.applyOptions({
      lineColor:   color,
      topColor:    `${color}40`,
      bottomColor: `${color}05`,
    } as Partial<AreaSeriesOptions>)
  }, [color])

  // Push new data whenever period or data changes
  useEffect(() => { updateSeries() }, [updateSeries])

  const hasData = is1D ? (intraday?.length ?? 0) > 0 : (history?.count ?? 0) > 0

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      {/* Period buttons */}
      <div className="mb-3 flex flex-wrap gap-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              period === p.key
                ? 'bg-zinc-700 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="relative h-64 sm:h-80">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-500" />
          </div>
        )}
        {!isLoading && !hasData && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
            No data available for this period
          </div>
        )}
        <div ref={chartRef} className="h-full w-full" />
      </div>
    </div>
  )
}
