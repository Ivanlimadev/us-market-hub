'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useBinanceTicker } from '@/lib/hooks/useBinanceTicker'
import type { CryptoMarket, CryptoPeriod } from '@/types/crypto'

const PERIODS: { label: string; key: CryptoPeriod }[] = [
  { label: '1h',  key: '1h' },
  { label: '24h', key: '24h' },
  { label: '7d',  key: '7d' },
  { label: '30d', key: '30d' },
  { label: '1y',  key: '1y' },
]

function pctForPeriod(coin: CryptoMarket, period: CryptoPeriod): number {
  switch (period) {
    case '1h':  return coin.price_change_percentage_1h_in_currency ?? 0
    case '24h': return coin.price_change_percentage_24h ?? 0
    case '7d':  return coin.price_change_percentage_7d_in_currency ?? 0
    case '30d': return coin.price_change_percentage_30d_in_currency ?? 0
    case '1y':  return coin.price_change_percentage_1y_in_currency ?? 0
  }
}

function heatColor(pct: number) {
  if (pct <= -10)  return 'bg-red-800       text-red-100'
  if (pct <= -5)   return 'bg-red-700       text-red-100'
  if (pct <= -2)   return 'bg-red-600/80    text-red-100'
  if (pct <= -0.5) return 'bg-red-500/50    text-red-200'
  if (pct <   0.5) return 'bg-zinc-700/80   text-zinc-300'
  if (pct <   2)   return 'bg-emerald-700/60 text-emerald-100'
  if (pct <   5)   return 'bg-emerald-600/80 text-emerald-100'
  if (pct <   10)  return 'bg-emerald-500    text-white'
  return                   'bg-emerald-400    text-zinc-900'
}

function tileSize(rank: number) {
  if (rank <= 5)  return { width: 110, height: 88, logo: 22 }
  if (rank <= 15) return { width: 88,  height: 72, logo: 18 }
  if (rank <= 30) return { width: 76,  height: 62, logo: 16 }
  return                 { width: 62,  height: 54, logo: 14 }
}

export function CryptoHeatmap() {
  const [period, setPeriod] = useState<CryptoPeriod>('24h')

  const { data, isLoading } = useQuery<CryptoMarket[]>({
    queryKey: ['crypto-markets'],
    queryFn: () => fetch('/api/crypto/markets?limit=100').then((r) => r.json()),
    staleTime: 55_000,
    refetchInterval: 60_000,
  })

  const top50 = (data ?? []).slice(0, 50)

  // Live Binance 24h % — only subscribe when 24h period is active
  const binanceSymbols = period === '24h'
    ? top50.map((c) => `${c.symbol.toUpperCase()}USDT`)
    : []
  const tickers = useBinanceTicker(binanceSymbols)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">Crypto Heatmap</h2>
          <p className="text-[11px] text-zinc-500">Top 50 by market cap</p>
        </div>
        <div className="flex items-center gap-1">
          {PERIODS.map(({ label, key }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                period === key
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {label}
            </button>
          ))}
          {period === '24h' && tickers.size > 0 && (
            <span className="ml-1 flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          )}
        </div>
      </div>

      <div className="p-3">
        {isLoading ? (
          <div className="flex flex-wrap gap-1.5 animate-pulse">
            {Array.from({ length: 50 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-zinc-800/50" style={{ width: 72, height: 56 }} />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {top50.map((coin) => {
              const binSym = `${coin.symbol.toUpperCase()}USDT`
              const live   = tickers.get(binSym)

              // Use Binance live % for 24h, CoinGecko otherwise
              const pct = (period === '24h' && live)
                ? live.priceChangePercent
                : pctForPeriod(coin, period)

              const cls = heatColor(pct)
              const { width, height, logo } = tileSize(coin.market_cap_rank)

              return (
                <Link
                  key={coin.id}
                  href={`/crypto/${coin.id}`}
                  className={`group flex flex-col items-center justify-center rounded-lg transition-all hover:opacity-90 hover:scale-105 ${cls}`}
                  style={{ width, height, padding: '4px 5px', gap: 2 }}
                  title={`${coin.name}: ${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`}
                >
                  <Image
                    src={coin.image}
                    alt={coin.symbol}
                    width={logo}
                    height={logo}
                    className="rounded-full"
                    unoptimized
                  />
                  <span className="text-[10px] font-bold leading-none uppercase">{coin.symbol}</span>
                  <span className="text-[9px] font-semibold opacity-90 leading-none">
                    {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
