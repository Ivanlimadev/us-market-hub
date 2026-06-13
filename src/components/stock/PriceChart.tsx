'use client'
import { useEffect, useRef, useState, useMemo } from 'react'
import {
  createChart,
  AreaSeries,
  CandlestickSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from 'lightweight-charts'
import { useStockHistory } from '@/lib/hooks/useStockDetail'
import { useQuery } from '@tanstack/react-query'

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

type ChartType = 'candle' | 'area'

interface IntradayBar { timestamp: number; value: number }
interface EodBar {
  date: string; open: number; high: number; low: number
  close: number; adj_close?: number | null; volume: number
}
interface Props { symbol: string; currentPrice: number; prevClose: number }

function useIntraday(symbol: string, enabled: boolean) {
  return useQuery({
    queryKey:        ['intraday-chart', symbol],
    queryFn:         async (): Promise<IntradayBar[]> => {
      const r = await fetch(`/api/stocks/${symbol}/intraday?interval=5min`)
      const d = await r.json() as { bars?: IntradayBar[] }
      return d.bars ?? []
    },
    enabled,
    staleTime:       55_000,
    refetchInterval: enabled ? 60_000 : false,
  })
}

export function PriceChart({ symbol, currentPrice, prevClose }: Props) {
  const [period,    setPeriod]    = useState('1y')
  const [chartType, setChartType] = useState<ChartType>('candle')

  const containerRef = useRef<HTMLDivElement>(null)
  // holds refs that belong to the *current* chart instance
  const instanceRef = useRef<{
    chart:  IChartApi
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    main:   ISeriesApi<any>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vol:    ISeriesApi<any> | null
  } | null>(null)

  const is1D = period === '1d'
  const { data: intraday, isLoading: intradayLoading } = useIntraday(symbol, is1D)
  const { data: history,  isLoading: histLoading }     = useStockHistory(symbol, is1D ? '1m' : period)

  const isLoading = is1D ? intradayLoading : histLoading
  const isUp      = currentPrice >= prevClose
  const UP   = '#10b981'
  const DOWN = '#ef4444'
  const lineColor = isUp ? UP : DOWN

  // ── Prepare chart-ready data ──────────────────────────────────────────
  const chartData = useMemo(() => {
    if (is1D && Array.isArray(intraday) && intraday.length) {
      const area = intraday.map((b) => ({ time: b.timestamp as UTCTimestamp, value: b.value }))
      if (currentPrice > 0) area[area.length - 1].value = currentPrice
      return { area, candle: [], vol: [] }
    }

    const bars = Array.isArray(history?.bars) ? (history!.bars as EodBar[]) : []
    if (!bars.length) return { area: [], candle: [], vol: [] }

    const candle = bars.map((b) => {
      const adjFactor = (b.adj_close && b.close > 0) ? b.adj_close / b.close : 1
      return {
        time:  b.date.split('T')[0] as `${number}-${number}-${number}`,
        open:  b.open  * adjFactor,
        high:  b.high  * adjFactor,
        low:   b.low   * adjFactor,
        close: b.adj_close ?? b.close,
      }
    })
    const area = bars.map((b) => ({
      time:  b.date.split('T')[0] as `${number}-${number}-${number}`,
      value: b.adj_close ?? b.close,
    }))
    const vol = bars.map((b) => ({
      time:  b.date.split('T')[0] as `${number}-${number}-${number}`,
      value: b.volume,
      color: (b.adj_close ?? b.close) >= b.open ? `${UP}55` : `${DOWN}55`,
    }))

    // Pin last bar to live price
    if (currentPrice > 0 && candle.length) {
      const today = new Date().toISOString().split('T')[0] as `${number}-${number}-${number}`
      const lc = candle[candle.length - 1]
      const la = area[candle.length - 1]
      if (lc.time === today) {
        lc.close = currentPrice; lc.high = Math.max(lc.high, currentPrice); lc.low = Math.min(lc.low, currentPrice)
        la.value = currentPrice
      } else {
        const prev = lc.close
        candle.push({ time: today, open: prev, high: Math.max(prev, currentPrice), low: Math.min(prev, currentPrice), close: currentPrice })
        area.push({ time: today, value: currentPrice })
        vol.push({ time: today, value: 0, color: `${UP}30` })
      }
    }
    return { area, candle, vol }
  }, [is1D, intraday, history, currentPrice, UP, DOWN])

  // ── Create / recreate chart when type changes ─────────────────────────
  // We intentionally recreate the whole chart (not just the series) to avoid
  // stale-series issues with React StrictMode double-invocation.
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout:    { background: { color: 'transparent' }, textColor: '#71717a' },
      grid:      { vertLines: { color: '#27272a' }, horzLines: { color: '#27272a' } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#3f3f46' },
      timeScale: { borderColor: '#3f3f46', timeVisible: is1D, secondsVisible: false },
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let main: ISeriesApi<any>
    if (chartType === 'candle') {
      main = chart.addSeries(CandlestickSeries, {
        upColor: UP, downColor: DOWN,
        borderUpColor: UP, borderDownColor: DOWN,
        wickUpColor: UP, wickDownColor: DOWN,
        priceLineVisible: false,
      })
    } else {
      main = chart.addSeries(AreaSeries, {
        lineColor, topColor: `${lineColor}40`, bottomColor: `${lineColor}05`,
        lineWidth: 2, priceLineVisible: false,
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let vol: ISeriesApi<any> | null = null
    if (!is1D) {
      vol = chart.addSeries(HistogramSeries, {
        priceFormat:  { type: 'volume' },
        priceScaleId: 'volume',
      })
      chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 }, borderVisible: false })
    }

    instanceRef.current = { chart, main, vol }

    const ro = new ResizeObserver(() => {
      if (containerRef.current)
        chart.resize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      instanceRef.current = null   // null BEFORE chart.remove() so data effect is safe
      chart.remove()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType, is1D])

  // ── Push data whenever chart or data changes ──────────────────────────
  useEffect(() => {
    const inst = instanceRef.current
    if (!inst) return
    const { main, vol } = inst

    if (chartType === 'candle' && chartData.candle.length) {
      main.setData(chartData.candle)
      vol?.setData(chartData.vol)
    } else if (chartType === 'area' && chartData.area.length) {
      main.setData(chartData.area)
      vol?.setData(chartData.vol)
    }

    inst.chart.timeScale().fitContent()
  }, [chartData, chartType])

  // ── Keep area color in sync with trend ────────────────────────────────
  useEffect(() => {
    if (chartType !== 'area') return
    instanceRef.current?.main.applyOptions({
      lineColor, topColor: `${lineColor}40`, bottomColor: `${lineColor}05`,
    })
  }, [lineColor, chartType])

  const hasData = is1D ? (intraday?.length ?? 0) > 0 : (history?.count ?? 0) > 0

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      {/* Controls */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                period === p.key ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex overflow-hidden rounded-lg border border-zinc-700 text-xs">
          <button
            onClick={() => setChartType('candle')}
            className={`px-3 py-1.5 font-medium transition-colors ${
              chartType === 'candle' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Candle
          </button>
          <button
            onClick={() => setChartType('area')}
            className={`border-l border-zinc-700 px-3 py-1.5 font-medium transition-colors ${
              chartType === 'area' ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Area
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-72 sm:h-96">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-500" />
          </div>
        )}
        {!isLoading && !hasData && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
            No data available
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  )
}
