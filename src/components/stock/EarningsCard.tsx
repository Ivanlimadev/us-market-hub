'use client'
import { useMemo } from 'react'
import { Calendar, Clock } from 'lucide-react'
import type { StockDetailData } from '@/lib/hooks/useStockDetail'

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const today  = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function EarningsCard({ data }: { data: StockDetailData }) {
  const nextDate = data.info?.nextEarningsDate ?? null
  const eps      = data.info?.eps ?? null
  const forwardPE = data.info?.forwardPE ?? null
  const pe        = data.info?.pe ?? null

  const daysLeft = useMemo(() => nextDate ? daysUntil(nextDate) : null, [nextDate])

  if (!nextDate && eps === null) return null

  const urgency =
    daysLeft !== null && daysLeft <= 7  ? 'text-amber-400 border-amber-500/40 bg-amber-500/5' :
    daysLeft !== null && daysLeft <= 21 ? 'text-zinc-300 border-zinc-700 bg-zinc-800/40' :
    'text-zinc-400 border-zinc-700 bg-zinc-800/30'

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-4">
        <Calendar className="h-4 w-4 text-zinc-400" />
        <h3 className="text-sm font-semibold text-zinc-300">Earnings</h3>
      </div>

      <div className="p-4 space-y-3">
        {nextDate && daysLeft !== null && daysLeft >= 0 && (
          <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${urgency}`}>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <div>
                <p className="text-sm font-semibold">Next Earnings</p>
                <p className="text-xs opacity-70">{fmtDate(nextDate)}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-extrabold tabular-nums">{daysLeft}</p>
              <p className="text-xs opacity-70">{daysLeft === 1 ? 'day' : 'days'}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-zinc-800/50 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">EPS (TTM)</p>
            <p className="mt-0.5 font-mono text-sm font-bold text-white">
              {eps !== null ? `$${eps.toFixed(2)}` : '—'}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">P/E (TTM)</p>
            <p className="mt-0.5 font-mono text-sm font-bold text-white">
              {pe !== null ? pe.toFixed(1) : '—'}
            </p>
          </div>
          <div className="rounded-lg bg-zinc-800/50 px-3 py-2.5">
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">Fwd P/E</p>
            <p className="mt-0.5 font-mono text-sm font-bold text-white">
              {forwardPE !== null ? forwardPE.toFixed(1) : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
