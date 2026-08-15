'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import type { LongShortItem } from '@/app/api/crypto/longshort/route'

const COIN_ICONS: Record<string, string> = {
  BTC:  'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH:  'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  SOL:  'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  BNB:  'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  XRP:  'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  ADA:  'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  AVAX: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  LINK: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  TON:  'https://assets.coingecko.com/coins/images/17980/small/ton_symbol.png',
  SUI:  'https://assets.coingecko.com/coins/images/26375/small/sui-ocean-square.png',
}

const SYMBOL_TO_ID: Record<string, string> = {
  BTC:  'bitcoin',
  ETH:  'ethereum',
  SOL:  'solana',
  BNB:  'binancecoin',
  XRP:  'ripple',
  DOGE: 'dogecoin',
  ADA:  'cardano',
  AVAX: 'avalanche-2',
  LINK: 'chainlink',
  TON:  'the-open-network',
  SUI:  'sui',
}

function Sentiment({ longPct }: { longPct: number }) {
  if (longPct >= 70) return <span className="text-[10px] font-semibold text-red-400">Heavily Long</span>
  if (longPct >= 60) return <span className="text-[10px] font-semibold text-amber-400">Long Bias</span>
  if (longPct >= 45) return <span className="text-[10px] font-semibold text-zinc-400">Neutral</span>
  return <span className="text-[10px] font-semibold text-emerald-400">Short Bias</span>
}

export function LongShortRatio() {
  const { data, isLoading, isError, refetch } = useQuery<LongShortItem[]>({
    queryKey: ['crypto-longshort'],
    queryFn:  () => fetch('/api/crypto/longshort').then(r => {
      if (!r.ok) throw new Error(`${r.status}`)
      return r.json()
    }),
    staleTime: 4 * 60_000,
    refetchInterval: 5 * 60_000,
    retry: 2,
  })

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Long / Short Ratio</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">Account positions via OKX · 5m</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-zinc-600">
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />Long
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />Short
          </span>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="divide-y divide-zinc-800/50 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="h-6 w-6 rounded-full bg-zinc-800 shrink-0" />
              <div className="h-3 w-10 rounded bg-zinc-800" />
              <div className="flex-1 h-3 rounded bg-zinc-800 mx-2" />
              <div className="h-3 w-20 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-xs text-zinc-500">Failed to load long/short data</p>
          <button onClick={() => refetch()} className="text-[11px] text-emerald-400 hover:underline">Try again</button>
        </div>
      )}

      {/* Rows */}
      {!isLoading && !isError && data && (
        <div className="divide-y divide-zinc-800/30">
          {/* Column headers */}
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 px-5 py-2 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
            <span className="w-28">Coin</span>
            <span>Long vs Short</span>
            <span className="w-28 text-right">Ratio</span>
          </div>

          {data.map(item => {
            const coinId = SYMBOL_TO_ID[item.symbol] || item.symbol.toLowerCase()
            return (
            <Link
              key={item.symbol}
              href={`/crypto/${coinId}`}
              className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 px-5 py-2.5 hover:bg-zinc-800/30 transition-colors"
            >
              {/* Coin + sentiment */}
              <div className="flex items-center gap-2 w-28">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={COIN_ICONS[item.symbol] ?? ''}
                  alt={item.symbol}
                  width={22}
                  height={22}
                  className="h-5.5 w-5.5 rounded-full shrink-0"
                />
                <div>
                  <p className="text-sm font-bold text-zinc-200 leading-none">{item.symbol}</p>
                  <Sentiment longPct={item.longPct} />
                </div>
              </div>

              {/* Split bar */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] tabular-nums text-emerald-400 w-10 text-right shrink-0">
                  {item.longPct.toFixed(1)}%
                </span>
                <div className="flex-1 flex h-2.5 overflow-hidden rounded-full">
                  <div
                    className="h-full bg-emerald-500/70 transition-all duration-500"
                    style={{ width: `${item.longPct}%` }}
                  />
                  <div
                    className="h-full bg-red-500/70 transition-all duration-500"
                    style={{ width: `${item.shortPct}%` }}
                  />
                </div>
                <span className="text-[11px] tabular-nums text-red-400 w-10 shrink-0">
                  {item.shortPct.toFixed(1)}%
                </span>
              </div>

              {/* Ratio */}
              <div className="w-28 text-right">
                <span className={`text-sm font-semibold tabular-nums ${
                  item.ratio >= 1 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {item.ratio.toFixed(2)}
                </span>
                <span className="text-[10px] text-zinc-600 ml-1">L/S</span>
              </div>
            </Link>
          )
          })}
        </div>
      )}
    </div>
  )
}
