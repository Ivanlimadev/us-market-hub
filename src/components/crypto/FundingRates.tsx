'use client'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import type { FundingRateItem } from '@/app/api/crypto/funding/route'

function fmtCountdown(ms: number): string {
  const diff = ms - Date.now()
  if (diff <= 0) return '-'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function Sentiment({ ratePct }: { ratePct: number }) {
  if (ratePct >  0.03) return <span className="text-[10px] font-semibold text-red-400">Overheated</span>
  if (ratePct >  0.003) return <span className="text-[10px] font-semibold text-amber-400">Long bias</span>
  if (ratePct >= -0.003) return <span className="text-[10px] font-semibold text-zinc-500">Neutral</span>
  return <span className="text-[10px] font-semibold text-emerald-400">Short bias</span>
}

function RateBar({ ratePct }: { ratePct: number }) {
  const MAX = 0.12 // ±0.12% = full bar
  const fill = Math.min(Math.abs(ratePct) / MAX, 1) * 50 // max 50% of half-bar
  const positive = ratePct >= 0
  return (
    <div className="flex h-1.5 w-24 items-center gap-px">
      {/* left half (negative / green) */}
      <div className="flex flex-1 justify-end">
        <div
          className="h-full rounded-l-full bg-emerald-500 transition-all"
          style={{ width: positive ? '0%' : `${fill * 100}%` }}
        />
      </div>
      {/* center divider */}
      <div className="h-2.5 w-px shrink-0 bg-zinc-700" />
      {/* right half (positive / red) */}
      <div className="flex flex-1 justify-start">
        <div
          className="h-full rounded-r-full bg-red-500 transition-all"
          style={{ width: positive ? `${fill * 100}%` : '0%' }}
        />
      </div>
    </div>
  )
}

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
  PEPE: 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
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
  PEPE: 'pepe',
}

export function FundingRates() {
  const { data, isLoading, isError, refetch } = useQuery<FundingRateItem[]>({
    queryKey: ['crypto-funding'],
    queryFn:  () => fetch('/api/crypto/funding').then(r => {
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
          <h3 className="text-sm font-semibold text-zinc-200">Funding Rates</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">Perpetuals via OKX · 8h intervals</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-zinc-600">
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />Short bias
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-500" />Neutral
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />Long bias
          </span>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="divide-y divide-zinc-800/50 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <div className="h-6 w-6 rounded-full bg-zinc-800 shrink-0" />
              <div className="h-3 w-12 rounded bg-zinc-800" />
              <div className="flex-1" />
              <div className="h-3 w-16 rounded bg-zinc-800" />
              <div className="h-3 w-10 rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-xs text-zinc-500">Failed to load funding rates</p>
          <button onClick={() => refetch()} className="text-[11px] text-emerald-400 hover:underline">Try again</button>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && data && (
        <div className="divide-y divide-zinc-800/30">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-x-4 px-5 py-2 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
            <span>Coin</span>
            <span className="text-right w-20">Rate / 8h</span>
            <span className="hidden sm:block w-24">Direction</span>
            <span className="text-right w-20">Annual</span>
            <span className="text-right w-16">Next</span>
          </div>
          {data.map(item => {
            const rateColor =
              item.ratePct >  0.03  ? 'text-red-400' :
              item.ratePct >  0.003 ? 'text-amber-400' :
              item.ratePct >= -0.003 ? 'text-zinc-400' :
              'text-emerald-400'

            const coinId = SYMBOL_TO_ID[item.symbol] || item.symbol.toLowerCase()
            return (
              <Link
                key={item.symbol}
                href={`/crypto/${coinId}`}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-x-4 px-5 py-2.5 hover:bg-zinc-800/30 transition-colors"
              >
                {/* Coin */}
                <div className="flex items-center gap-2 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={COIN_ICONS[item.symbol] ?? ''}
                    alt={item.symbol}
                    width={24}
                    height={24}
                    className="h-6 w-6 shrink-0 rounded-full"
                  />
                  <span className="text-sm font-bold text-zinc-200">{item.symbol}</span>
                  <span className="hidden sm:inline">
                    <Sentiment ratePct={item.ratePct} />
                  </span>
                </div>

                {/* Rate/8h */}
                <span className={`w-20 text-right text-sm font-semibold tabular-nums ${rateColor}`}>
                  {item.ratePct >= 0 ? '+' : ''}{item.ratePct.toFixed(4)}%
                </span>

                {/* Bar */}
                <div className="hidden sm:flex w-24 justify-center">
                  <RateBar ratePct={item.ratePct} />
                </div>

                {/* Annual */}
                <span className={`w-20 text-right text-xs tabular-nums ${rateColor}`}>
                  {item.annualPct >= 0 ? '+' : ''}{item.annualPct.toFixed(1)}%
                </span>

                {/* Countdown */}
                <span className="w-16 text-right text-xs text-zinc-500 tabular-nums">
                  {fmtCountdown(item.nextFunding)}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
