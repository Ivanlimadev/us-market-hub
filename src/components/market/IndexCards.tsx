'use client'
import { useQuery } from '@tanstack/react-query'
import { ChangeBadge } from '@/components/ui/change-badge'
import { getPollInterval } from '@/lib/market-hours'
import type { YFBatchQuote } from '@/lib/yahoo-finance'

const INDICES = [
  { symbol: '^DJI',  label: 'Dow Jones'    },
  { symbol: '^IXIC', label: 'Nasdaq'       },
  { symbol: '^RUT',  label: 'Russell 2000' },
  { symbol: '^VIX',  label: 'VIX'          },
]

const SYMBOLS = INDICES.map((i) => i.symbol).join(',')

function useIndexQuotes() {
  return useQuery<YFBatchQuote[]>({
    queryKey: ['index-quotes'],
    queryFn: async () => {
      const r = await fetch(`/api/batch-quotes?symbols=${encodeURIComponent(SYMBOLS)}`)
      if (!r.ok) throw new Error(`${r.status}`)
      return r.json()
    },
    refetchInterval: getPollInterval,
    staleTime: 55_000,
  })
}

export function IndexCards() {
  const { data: quotes, isLoading } = useIndexQuotes()

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {INDICES.map((idx) => (
          <div key={idx.symbol} className="h-20 animate-pulse rounded-xl bg-zinc-800" />
        ))}
      </div>
    )
  }

  const quoteMap = Object.fromEntries((quotes ?? []).map((q) => [q.symbol, q]))

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {INDICES.map((idx) => {
        const q = quoteMap[idx.symbol]
        return (
          <div key={idx.symbol} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <p className="text-xs font-medium text-zinc-400">{idx.label}</p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {q ? q.price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '-'}
            </p>
            <div className="mt-1">
              {q ? (
                <ChangeBadge value={q.changePct} />
              ) : (
                <span className="text-xs text-zinc-500">-</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
