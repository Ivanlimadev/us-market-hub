'use client'
import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { StockDetailData } from '@/lib/hooks/useStockDetail'
import { splitAdjustDividends, avgAnnualDPS } from '@/lib/dividend-utils'

function fmt$(n: number) {
  return `$${n.toFixed(2)}`
}

function Upside({ price, fair }: { price: number; fair: number }) {
  const pct = ((fair - price) / price) * 100
  const isUp = pct >= 0
  const Icon = Math.abs(pct) < 1 ? Minus : isUp ? TrendingUp : TrendingDown
  return (
    <div className={`flex items-center gap-1 text-sm font-semibold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
      <Icon className="h-3.5 w-3.5" />
      {isUp ? '+' : ''}{pct.toFixed(1)}% {isUp ? 'upside' : 'downside'}
    </div>
  )
}

function FairRow({
  label, formula, fairPrice, currentPrice, description,
}: {
  label: string
  formula: string
  fairPrice: number | null
  currentPrice: number
  description: string
}) {
  return (
    <div className="rounded-lg border border-zinc-700/60 bg-zinc-800/40 p-4">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-zinc-200">{label}</p>
          <p className="text-[11px] text-zinc-500">{formula}</p>
        </div>
        {fairPrice !== null && fairPrice > 0 ? (
          <div className="text-right shrink-0">
            <p className="font-mono text-lg font-bold text-white">{fmt$(fairPrice)}</p>
            <Upside price={currentPrice} fair={fairPrice} />
          </div>
        ) : (
          <p className="font-mono text-sm text-zinc-600">N/A</p>
        )}
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
    </div>
  )
}

export function FairValueCard({ data }: { data: StockDetailData }) {
  const price = data.currentPrice
  const info  = data.info

  const { graham, bazin } = useMemo(() => {
    // Graham: √(22.5 × EPS × BVS)
    const eps = info?.eps ?? null
    const bvs = info?.bookValue ?? (info?.priceToBook && price ? price / info.priceToBook : null)
    const graham =
      eps !== null && eps > 0 && bvs !== null && bvs > 0
        ? Math.sqrt(22.5 * eps * bvs)
        : null

    // Bazin: avg annual DPS (last 5 completed years, split-adjusted) / 0.06
    const adjDivs = splitAdjustDividends(data.dividends ?? [], data.splits ?? [])
    const dpaAvg  = avgAnnualDPS(adjDivs)
    const bazin   = dpaAvg !== null && dpaAvg > 0 ? dpaAvg / 0.06 : null

    return { graham, bazin }
  }, [data.dividends, data.splits, info, price])

  if (!info) return null

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="border-b border-zinc-800 px-5 py-4">
        <h3 className="text-sm font-semibold text-zinc-300">Fair Value Estimates</h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          Current price: <span className="font-mono font-semibold text-white">{fmt$(price)}</span>
        </p>
      </div>

      <div className="space-y-3 p-4">
        <FairRow
          label="Graham Number"
          formula="√(22.5 × EPS × Book Value)"
          fairPrice={graham}
          currentPrice={price}
          description="Benjamin Graham's intrinsic value formula. Assumes a fair stock trades at no more than 22.5× the product of EPS and book value per share."
        />
        <FairRow
          label="Bazin Ceiling Price"
          formula="Avg. Annual DPS (5Y) ÷ 6%"
          fairPrice={bazin}
          currentPrice={price}
          description="Décio Bazin's dividend-based ceiling. The max price you should pay so that dividends alone deliver at least 6% annual yield on your cost basis."
        />
      </div>

      <div className="border-t border-zinc-800 px-5 py-2.5">
        <p className="text-[11px] text-zinc-600">
          These are simplified estimates. Not financial advice.
        </p>
      </div>
    </div>
  )
}
