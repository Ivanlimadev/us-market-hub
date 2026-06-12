'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { CryptoMarket, CryptoPeriod } from '@/types/crypto'

type Tab = 'gainers' | 'losers'

const PERIODS: { label: string; key: CryptoPeriod }[] = [
  { label: '1h',  key: '1h'  },
  { label: '24h', key: '24h' },
  { label: '7d',  key: '7d'  },
  { label: '30d', key: '30d' },
]

function pct(coin: CryptoMarket, period: CryptoPeriod): number {
  switch (period) {
    case '1h':  return coin.price_change_percentage_1h_in_currency  ?? 0
    case '24h': return coin.price_change_percentage_24h              ?? 0
    case '7d':  return coin.price_change_percentage_7d_in_currency  ?? 0
    case '30d': return coin.price_change_percentage_30d_in_currency ?? 0
    default:    return coin.price_change_percentage_24h              ?? 0
  }
}

function fmtPrice(n: number) {
  if (n >= 1)    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (n >= 0.01) return `$${n.toFixed(4)}`
  return `$${n.toFixed(8)}`
}

export function CryptoGainersLosers() {
  const [tab,    setTab]    = useState<Tab>('gainers')
  const [period, setPeriod] = useState<CryptoPeriod>('24h')

  const { data, isLoading } = useQuery<CryptoMarket[]>({
    queryKey: ['crypto-markets'],
    queryFn:  () => fetch('/api/crypto/markets?limit=250').then((r) => r.json()),
    staleTime: 55_000,
    refetchInterval: 60_000,
  })

  const sorted = [...(data ?? [])]
    .filter((c) => pct(c, period) !== 0)
    .sort((a, b) =>
      tab === 'gainers'
        ? pct(b, period) - pct(a, period)
        : pct(a, period) - pct(b, period)
    )
    .slice(0, 10)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 px-4 py-3">
        <div className="flex rounded-lg border border-zinc-700 overflow-hidden text-xs">
          <button
            onClick={() => setTab('gainers')}
            className={`flex items-center gap-1 px-3 py-1.5 font-medium transition-colors ${
              tab === 'gainers' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <TrendingUp className="h-3 w-3" /> Gainers
          </button>
          <button
            onClick={() => setTab('losers')}
            className={`flex items-center gap-1 border-l border-zinc-700 px-3 py-1.5 font-medium transition-colors ${
              tab === 'losers' ? 'bg-red-500/20 text-red-400' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <TrendingDown className="h-3 w-3" /> Losers
          </button>
        </div>

        <div className="flex items-center gap-1">
          {PERIODS.map(({ label, key }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                period === key
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-zinc-800/50">
        {isLoading
          ? Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                <div className="h-7 w-7 rounded-full bg-zinc-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-28 rounded bg-zinc-800" />
                  <div className="h-2.5 w-16 rounded bg-zinc-800" />
                </div>
                <div className="h-3 w-16 rounded bg-zinc-800" />
              </div>
            ))
          : sorted.map((coin, i) => {
              const change = pct(coin, period)
              const pos    = change >= 0
              return (
                <Link
                  key={coin.id}
                  href={`/crypto/${coin.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/40 transition-colors"
                >
                  <span className="w-4 text-[11px] text-zinc-600 font-mono shrink-0">{i + 1}</span>
                  <Image src={coin.image} alt={coin.name} width={28} height={28} className="rounded-full" unoptimized />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-200 truncate leading-none">{coin.name}</p>
                    <p className="text-[10px] text-zinc-500 uppercase mt-0.5">{coin.symbol}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-zinc-200">{fmtPrice(coin.current_price)}</p>
                    <p className={`text-[10px] font-bold mt-0.5 ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
                      {pos ? '+' : ''}{change.toFixed(2)}%
                    </p>
                  </div>
                </Link>
              )
            })}
      </div>
    </div>
  )
}
