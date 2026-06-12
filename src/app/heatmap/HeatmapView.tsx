'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPollInterval, isMarketOpen } from '@/lib/market-hours'
import { STOCK_UNIVERSE, ALL_SYMBOLS } from '@/lib/stock-universe'
import { useYahooTicker } from '@/lib/hooks/useYahooTicker'
import type { YFBatchQuote } from '@/lib/yahoo-finance'

function heatColor(pct: number): string {
  if (pct <= -3)   return 'bg-red-700        text-red-100'
  if (pct <= -1.5) return 'bg-red-600/80     text-red-100'
  if (pct <= -0.5) return 'bg-red-500/60     text-red-100'
  if (pct <  0.5)  return 'bg-zinc-700       text-zinc-300'
  if (pct <  1.5)  return 'bg-emerald-600/60 text-emerald-100'
  if (pct <  3)    return 'bg-emerald-600/80 text-emerald-100'
  return                   'bg-emerald-700    text-emerald-50'
}

function StockLogo({ symbol, size = 24 }: { symbol: string; size?: number }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://assets.parqet.com/logos/symbol/${symbol}?format=png`}
      alt=""
      width={size}
      height={size}
      className="rounded-full object-contain"
      onError={() => setFailed(true)}
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  )
}

export function HeatmapView() {
  const open = isMarketOpen()

  const { data, isLoading } = useQuery<YFBatchQuote[]>({
    queryKey:        ['screener'],
    queryFn:         () => fetch('/api/screener').then((r) => r.json()),
    staleTime:       25_000,
    refetchInterval: getPollInterval,
  })

  const quoteMap = Object.fromEntries((data ?? []).map((q) => [q.symbol, q]))

  // Live WebSocket — only open during market hours
  const liveSymbols = open ? ALL_SYMBOLS : []
  const liveTickers = useYahooTicker(liveSymbols)
  const isLive = open && liveTickers.size > 0

  const legend = [
    { label: '< -3%',  cls: 'bg-red-700' },
    { label: '-1.5%',  cls: 'bg-red-600/80' },
    { label: '-0.5%',  cls: 'bg-red-500/60' },
    { label: '±0',     cls: 'bg-zinc-700' },
    { label: '+0.5%',  cls: 'bg-emerald-600/60' },
    { label: '+1.5%',  cls: 'bg-emerald-600/80' },
    { label: '> +3%',  cls: 'bg-emerald-700' },
  ]

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          <span className="text-zinc-500 mr-1">Scale:</span>
          {legend.map((l) => (
            <div key={l.label} className="flex items-center gap-1">
              <div className={`h-3 w-3 rounded-sm ${l.cls}`} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          {isLive ? (
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live · Yahoo Finance WebSocket
            </span>
          ) : !open ? (
            <span className="text-zinc-600">Market closed · prices from last session</span>
          ) : (
            <span className="text-zinc-600">Connecting…</span>
          )}
        </div>
      </div>

      {/* Sectors */}
      {Object.entries(STOCK_UNIVERSE).map(([sector, symbols]) => (
        <div key={sector}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">{sector}</h2>
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {symbols.map((sym) => {
              const rest = quoteMap[sym]
              const live = liveTickers.get(sym)

              const price = live?.price ?? rest?.price
              const pct   = live?.changePercent ?? rest?.changePct ?? 0
              const cls   = heatColor(pct)

              return (
                <Link
                  key={sym}
                  href={`/stocks/${sym}`}
                  className={`group flex flex-col items-center justify-center rounded-lg p-2 transition-all hover:opacity-90 hover:scale-105 ${cls} ${isLoading && !live ? 'animate-pulse' : ''}`}
                  style={{ minHeight: 80, gap: 3 }}
                >
                  <StockLogo symbol={sym} size={24} />
                  <span className="text-xs font-bold leading-none">{sym}</span>
                  {price != null && (
                    <>
                      <span className="text-[10px] font-mono opacity-90 leading-none">
                        ${price.toFixed(2)}
                        {live && <span className="ml-0.5 text-[8px] text-emerald-300 opacity-70">●</span>}
                      </span>
                      <span className="text-[10px] font-semibold opacity-80 leading-none">
                        {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                      </span>
                    </>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
