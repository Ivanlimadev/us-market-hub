'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getPollInterval } from '@/lib/market-hours'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { YFBatchQuote } from '@/lib/yahoo-finance'

const SECTOR_PEERS: Record<string, string[]> = {
  Technology: ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AVGO', 'AMD', 'CRM'],
  'Consumer Electronics': ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'META', 'AMZN', 'SONY', 'QCOM'],
  'Communication Services': ['GOOGL', 'META', 'NFLX', 'DIS', 'T', 'VZ', 'CMCSA', 'SNAP'],
  'Consumer Discretionary': ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'SBUX', 'LOW', 'TGT'],
  'Consumer Staples': ['PG', 'KO', 'PEP', 'WMT', 'COST', 'CL', 'MO', 'PM'],
  Healthcare: ['UNH', 'JNJ', 'LLY', 'ABBV', 'MRK', 'TMO', 'ABT', 'PFE'],
  Financials: ['JPM', 'BAC', 'WFC', 'GS', 'MS', 'V', 'MA', 'BRK-B'],
  Energy: ['XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PSX', 'PXD', 'OXY'],
  Industrials: ['GE', 'CAT', 'HON', 'UPS', 'BA', 'RTX', 'DE', 'MMM'],
  'Real Estate': ['PLD', 'AMT', 'EQIX', 'O', 'VICI', 'SPG', 'CCI', 'PSA'],
  Utilities: ['NEE', 'DUK', 'SO', 'D', 'AEP', 'EXC', 'XEL', 'SRE'],
  Materials: ['LIN', 'APD', 'ECL', 'NEM', 'FCX', 'NUE', 'ALB', 'PPG'],
}

const DEFAULT_PEERS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'JPM']

interface Props {
  symbol: string
  sector: string | null
}

function StockLogo({ symbol }: { symbol: string }) {
  return (
    <div className="relative h-9 w-9 shrink-0">
      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-zinc-800">
        <Image
          src={`https://assets.parqet.com/logos/symbol/${symbol}?format=png`}
          alt={symbol}
          width={36}
          height={36}
          className="object-contain"
          onError={(e) => {
            const t = e.target as HTMLImageElement
            t.style.display = 'none'
            if (t.parentElement) {
              t.parentElement.innerHTML = `<span class="text-xs font-bold text-zinc-400">${symbol.slice(0, 2)}</span>`
            }
          }}
          unoptimized
        />
      </div>
    </div>
  )
}

export function RelatedAssets({ symbol, sector }: Props) {
  const pool = sector ? (SECTOR_PEERS[sector] ?? DEFAULT_PEERS) : DEFAULT_PEERS
  const related = pool.filter((s) => s !== symbol).slice(0, 6)

  const { data: quotes, isLoading } = useQuery<YFBatchQuote[]>({
    queryKey: ['related-assets', related.join(',')],
    queryFn: () => fetch(`/api/batch-quotes?symbols=${related.join(',')}`).then(r => r.json()),
    staleTime: 55_000,
    refetchInterval: getPollInterval,
    enabled: related.length > 0,
  })

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="border-b border-zinc-800 px-4 py-3">
        <h3 className="text-sm font-semibold text-zinc-300">Related Assets</h3>
        {sector && <p className="text-xs text-zinc-500">{sector}</p>}
      </div>

      <div className="divide-y divide-zinc-800/50">
        {isLoading
          ? related.map((s) => (
              <div key={s} className="flex items-center gap-3 px-4 py-3">
                <div className="h-9 w-9 animate-pulse rounded-xl bg-zinc-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
                  <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
                </div>
                <div className="space-y-1.5 text-right">
                  <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
                  <div className="h-3 w-10 animate-pulse rounded bg-zinc-800" />
                </div>
              </div>
            ))
          : (quotes ?? []).map((q) => {
              const pct = q.changePct ?? 0
              const isUp = pct > 0
              const isDown = pct < 0
              const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus
              const color = isUp ? 'text-emerald-400' : isDown ? 'text-red-400' : 'text-zinc-500'

              return (
                <Link
                  key={q.symbol}
                  href={`/stocks/${q.symbol}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-800/50"
                >
                  <StockLogo symbol={q.symbol} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{q.symbol}</p>
                    <p className="truncate text-xs text-zinc-500">{q.name ?? q.symbol}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-semibold text-white">
                      ${(q.price ?? 0).toFixed(2)}
                    </p>
                    <p className={`flex items-center justify-end gap-0.5 text-xs font-medium ${color}`}>
                      <Icon className="h-3 w-3" />
                      {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
                    </p>
                  </div>
                </Link>
              )
            })}
      </div>
    </div>
  )
}
