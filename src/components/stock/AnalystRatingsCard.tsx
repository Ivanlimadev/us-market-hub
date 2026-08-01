'use client'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { StockDetailData } from '@/lib/hooks/useStockDetail'

function fmt$(n: number) {
  return `$${n.toFixed(2)}`
}

const RATING: Record<string, { label: string; cls: string }> = {
  strong_buy: { label: 'Strong Buy', cls: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400' },
  buy: { label: 'Buy', cls: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-400' },
  hold: { label: 'Hold', cls: 'border-amber-500/30 bg-amber-500/15 text-amber-400' },
  underperform: { label: 'Underperform', cls: 'border-red-500/30 bg-red-500/15 text-red-400' },
  sell: { label: 'Sell', cls: 'border-red-500/30 bg-red-500/15 text-red-400' },
  strong_sell: { label: 'Strong Sell', cls: 'border-red-500/30 bg-red-500/15 text-red-400' },
}

/**
 * Wall Street analyst consensus + 12-month price target, straight from the Yahoo
 * summary we already fetch (recommendationKey + targetMean/Low/High + count).
 * Shows the consensus rating, the mean target with upside/downside, and a range
 * bar placing the current price between the low and high analyst targets.
 */
export function AnalystRatingsCard({ data }: { data: StockDetailData }) {
  const info = data.info
  const price = data.currentPrice
  const n = info?.numberOfAnalystOpinions ?? 0
  const mean = info?.targetMeanPrice ?? 0
  if (!info || n < 1 || !(mean > 0) || !(price > 0)) return null

  const rating = info.recommendationKey ? RATING[info.recommendationKey] : null
  const low = info.targetLowPrice ?? 0
  const high = info.targetHighPrice ?? 0
  const upside = ((mean - price) / price) * 100
  const isUp = upside >= 0
  const Icon = Math.abs(upside) < 1 ? Minus : isUp ? TrendingUp : TrendingDown

  const span = high > low ? high - low : 1
  const pos = (v: number) => Math.max(0, Math.min(100, ((v - low) / span) * 100))

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-300">Analyst Ratings</h3>
        {rating && (
          <span className={`rounded-md border px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${rating.cls}`}>
            {rating.label}
          </span>
        )}
      </div>
      <p className="mt-0.5 text-xs text-zinc-500">
        Wall Street consensus from {n} analyst{n > 1 ? 's' : ''}
      </p>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">
            12-Month Price Target
          </p>
          <p className="mt-0.5 font-mono text-2xl font-bold text-white">{fmt$(mean)}</p>
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
          <Icon className="h-4 w-4" />
          {isUp ? '+' : ''}
          {upside.toFixed(1)}% {isUp ? 'upside' : 'downside'}
        </div>
      </div>

      {high > low && (
        <div className="mt-5">
          <div className="relative h-1.5 rounded-full bg-gradient-to-r from-red-500/30 via-zinc-700 to-emerald-500/30">
            <div
              className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-zinc-900 bg-emerald-400"
              style={{ left: `${pos(mean)}%` }}
              title={`Avg target ${fmt$(mean)}`}
            />
            <div
              className="absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-zinc-900 bg-white"
              style={{ left: `${pos(price)}%` }}
              title={`Current ${fmt$(price)}`}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-zinc-500">
            <span>Low {fmt$(low)}</span>
            <span>High {fmt$(high)}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-white" /> Current {fmt$(price)}
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" /> Avg target {fmt$(mean)}
            </span>
          </div>
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-zinc-600">
        Based on analyst estimates; price targets are opinions, not guarantees.
      </p>
    </div>
  )
}
