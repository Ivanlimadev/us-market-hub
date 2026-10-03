'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { getPollInterval } from '@/lib/market-hours'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { YFBatchQuote } from '@/lib/yahoo-finance'

export const SECTOR_PEERS: Record<string, string[]> = {
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

export const DEFAULT_PEERS = ['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'META', 'TSLA', 'JPM']

// Brazilian (B3 `.SA`) peers, keyed by Yahoo's sector strings, so a BR stock
// shows BR peers instead of US ones.
export const BR_SECTOR_PEERS: Record<string, string[]> = {
  Energy: ['PETR4.SA', 'PRIO3.SA', 'VBBR3.SA', 'RECV3.SA', 'CSAN3.SA', 'UGPA3.SA'],
  'Basic Materials': ['VALE3.SA', 'GGBR4.SA', 'CSNA3.SA', 'SUZB3.SA', 'KLBN11.SA', 'BRKM5.SA'],
  'Financial Services': ['ITUB4.SA', 'BBDC4.SA', 'BBAS3.SA', 'BPAC11.SA', 'B3SA3.SA', 'SANB11.SA'],
  Utilities: ['ELET3.SA', 'EQTL3.SA', 'ENGI11.SA', 'CMIG4.SA', 'SBSP3.SA', 'EGIE3.SA'],
  'Consumer Defensive': ['ABEV3.SA', 'JBSS3.SA', 'BRFS3.SA', 'ASAI3.SA', 'PCAR3.SA', 'MRFG3.SA'],
  'Consumer Cyclical': ['MGLU3.SA', 'LREN3.SA', 'RENT3.SA', 'VIVA3.SA', 'CRFB3.SA', 'AZZA3.SA'],
  Healthcare: ['RDOR3.SA', 'HAPV3.SA', 'FLRY3.SA', 'HYPE3.SA', 'RADL3.SA', 'QUAL3.SA'],
  Industrials: ['WEGE3.SA', 'EMBR3.SA', 'RAIL3.SA', 'CCRO3.SA', 'AZUL4.SA', 'POMO4.SA'],
  Technology: ['TOTS3.SA', 'POSI3.SA', 'INTB3.SA', 'LWSA3.SA', 'CASH3.SA'],
  'Communication Services': ['VIVT3.SA', 'TIMS3.SA'],
  'Real Estate': ['MULT3.SA', 'IGTI11.SA', 'ALOS3.SA', 'CYRE3.SA', 'MRVE3.SA', 'EZTC3.SA'],
}

export const DEFAULT_BR_PEERS = ['PETR4.SA', 'VALE3.SA', 'ITUB4.SA', 'BBDC4.SA', 'ABEV3.SA', 'B3SA3.SA', 'WEGE3.SA', 'BBAS3.SA']

// Pick the peer pool matching the asset's market: B3 `.SA` tickers get Brazilian
// peers, everything else gets the US pool.
export function getPeerPool(symbol: string, sector: string | null): string[] {
  if (symbol.toUpperCase().endsWith('.SA')) {
    return (sector ? BR_SECTOR_PEERS[sector] : undefined) ?? DEFAULT_BR_PEERS
  }
  return (sector ? SECTOR_PEERS[sector] : undefined) ?? DEFAULT_PEERS
}

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
  const pool = getPeerPool(symbol, sector)
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
                  href={`/stocks/${q.symbol.toLowerCase()}`}
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
