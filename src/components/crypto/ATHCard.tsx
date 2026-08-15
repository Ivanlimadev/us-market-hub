'use client'
import type { CryptoDetail } from '@/types/crypto'
import { TrendingUp, TrendingDown } from 'lucide-react'

function fmtPrice(n: number): string {
  if (n >= 1) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  return `$${n.toFixed(8)}`
}

function fmtDate(iso: string): string {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ATHCard({ coin }: { coin: CryptoDetail }) {
  const ath = coin.market_data?.ath
  const athChange = coin.market_data?.ath_change_percentage
  const athDate = coin.market_data?.ath_date

  if (!ath || ath === 0) return null

  const isRecovering = athChange != null && athChange > -20
  const statusColor = isRecovering ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
  const statusText = isRecovering ? 'Recovering' : 'Fallen'
  const statusIcon = isRecovering ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">All-Time High</h3>
      <div className="space-y-0">
        <div className="flex items-center justify-between py-2 border-b border-zinc-800">
          <span className="text-xs text-zinc-500">Peak Price</span>
          <span className="text-xs font-semibold text-zinc-200">{fmtPrice(ath)}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-zinc-800">
          <span className="text-xs text-zinc-500">Date</span>
          <span className="text-xs font-semibold text-zinc-200">{fmtDate(athDate)}</span>
        </div>
        <div className="flex items-center justify-between py-2 border-b border-zinc-800">
          <span className="text-xs text-zinc-500">Distance from Peak</span>
          {athChange != null ? (
            <span className={`text-xs font-semibold tabular-nums ${athChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {athChange >= 0 ? '+' : ''}{athChange.toFixed(2)}%
            </span>
          ) : (
            <span className="text-zinc-700 text-xs">-</span>
          )}
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="text-xs text-zinc-500">Status</span>
          <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${statusColor}`}>
            {statusIcon}
            {statusText}
          </span>
        </div>
      </div>
    </div>
  )
}
