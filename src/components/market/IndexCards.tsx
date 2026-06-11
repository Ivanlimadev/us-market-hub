'use client'
import { useQuotes } from '@/lib/hooks/useQuotes'
import { ChangeBadge } from '@/components/ui/change-badge'

const INDICES = [
  { symbol: 'DJI.INDX', label: 'Dow Jones' },
  { symbol: 'IXIC.INDX', label: 'Nasdaq' },
  { symbol: 'RUT.INDX', label: 'Russell 2000' },
  { symbol: 'VIX.INDX', label: 'VIX' },
]

export function IndexCards() {
  const symbols = INDICES.map((i) => i.symbol)
  const { data: quotes, isLoading } = useQuotes(symbols)

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
              {q ? q.price.toLocaleString('en-US', { maximumFractionDigits: 2 }) : '—'}
            </p>
            <div className="mt-1">
              {q ? (
                <ChangeBadge value={q.changePct} />
              ) : (
                <span className="text-xs text-zinc-500">—</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
