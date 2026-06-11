'use client'
import { useMemo } from 'react'
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import type { StockDetailData } from '@/lib/hooks/useStockDetail'

type Status = 'pass' | 'fail' | 'na'

interface Criterion {
  label: string
  detail: string
  status: Status
  value?: string
}

function CriterionRow({ c }: { c: Criterion }) {
  const Icon  = c.status === 'pass' ? CheckCircle2 : c.status === 'fail' ? XCircle : MinusCircle
  const color = c.status === 'pass' ? 'text-emerald-400' : c.status === 'fail' ? 'text-red-400' : 'text-zinc-500'
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-zinc-800/60 last:border-0">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${color}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-zinc-200">{c.label}</p>
          {c.value && (
            <span className={`font-mono text-xs font-semibold shrink-0 ${color}`}>{c.value}</span>
          )}
        </div>
        <p className="text-xs text-zinc-500">{c.detail}</p>
      </div>
    </div>
  )
}

export function BuyHoldChecklist({ data }: { data: StockDetailData }) {
  const criteria = useMemo<Criterion[]>(() => {
    const info  = data.info
    const divs  = data.dividends ?? []
    const price = data.currentPrice

    function check(val: number | null | undefined, min: number): Status {
      if (val === null || val === undefined) return 'na'
      return val >= min ? 'pass' : 'fail'
    }

    // 1. Pays dividends
    const paysDivs = divs.length > 0
    const divYears = (() => {
      if (!divs.length) return 0
      const oldest = new Date(divs[divs.length - 1].date)
      return new Date().getFullYear() - oldest.getFullYear()
    })()

    // 2. Dividend consistency (5+ years)
    const divConsistent: Status = divYears >= 5 ? 'pass' : paysDivs ? 'fail' : 'na'

    // 3. ROE > 10%
    const roe = info?.roe !== null && info?.roe !== undefined ? info.roe * 100 : null

    // 4. Positive profit margin
    const margin = info?.profitMargin !== null && info?.profitMargin !== undefined
      ? info.profitMargin * 100 : null

    // 5. Revenue growth positive
    const revGrowth = info?.revenueGrowth !== null && info?.revenueGrowth !== undefined
      ? info.revenueGrowth * 100 : null

    // 6. Earnings growth positive
    const epsGrowth = info?.earningsGrowth !== null && info?.earningsGrowth !== undefined
      ? info.earningsGrowth * 100 : null

    // 7. Debt / Equity < 2
    const de = info?.debtToEquity ?? null

    // 8. Current ratio > 1
    const cr = info?.currentRatio ?? null

    // 9. Daily liquidity > $5M (avgVolume × price)
    const liquidity = info?.avgVolume3m !== null && info?.avgVolume3m !== undefined && price > 0
      ? info.avgVolume3m * price : null
    const liquidityStatus: Status = liquidity === null ? 'na' : liquidity >= 5_000_000 ? 'pass' : 'fail'
    const liquidityLabel = liquidity !== null
      ? liquidity >= 1e9 ? `$${(liquidity / 1e9).toFixed(1)}B/day`
      : liquidity >= 1e6 ? `$${(liquidity / 1e6).toFixed(0)}M/day`
      : `$${(liquidity / 1e3).toFixed(0)}K/day`
      : undefined

    // 10. DY > 0%
    const dy = info?.dividendYield !== null && info?.dividendYield !== undefined
      ? info.dividendYield * 100 : null

    return [
      {
        label: 'Pays dividends',
        detail: paysDivs ? `${divYears}+ years of dividend history` : 'No dividend history found',
        status: paysDivs ? 'pass' : 'fail',
        value: paysDivs ? `${divYears}Y hist.` : undefined,
      },
      {
        label: 'Dividend consistency (5Y+)',
        detail: 'Uninterrupted dividend payments for at least 5 years',
        status: divConsistent,
        value: divYears > 0 ? `${divYears} yrs` : undefined,
      },
      {
        label: 'ROE > 10%',
        detail: 'Return on equity — measures how efficiently capital is used',
        status: check(roe, 10),
        value: roe !== null ? `${roe.toFixed(1)}%` : undefined,
      },
      {
        label: 'Positive profit margin',
        detail: 'Company must be consistently profitable',
        status: check(margin, 0),
        value: margin !== null ? `${margin.toFixed(1)}%` : undefined,
      },
      {
        label: 'Revenue growth (YoY)',
        detail: 'Year-over-year revenue must be increasing',
        status: check(revGrowth, 0),
        value: revGrowth !== null ? `${revGrowth >= 0 ? '+' : ''}${revGrowth.toFixed(1)}%` : undefined,
      },
      {
        label: 'Earnings growth (YoY)',
        detail: 'Year-over-year earnings must be increasing',
        status: check(epsGrowth, 0),
        value: epsGrowth !== null ? `${epsGrowth >= 0 ? '+' : ''}${epsGrowth.toFixed(1)}%` : undefined,
      },
      {
        label: 'Debt/Equity < 2×',
        detail: 'Low leverage reduces financial risk',
        status: de === null ? 'na' : de <= 2 ? 'pass' : 'fail',
        value: de !== null ? `${de.toFixed(2)}×` : undefined,
      },
      {
        label: 'Current ratio > 1',
        detail: 'Short-term assets must cover short-term liabilities',
        status: check(cr, 1),
        value: cr !== null ? `${cr.toFixed(2)}×` : undefined,
      },
      {
        label: 'Daily liquidity > $5M',
        detail: 'High trading volume ensures easy entry and exit',
        status: liquidityStatus,
        value: liquidityLabel,
      },
      {
        label: 'Dividend yield > 0%',
        detail: 'Asset must reward shareholders with income',
        status: check(dy, 0.01),
        value: dy !== null ? `${dy.toFixed(2)}%` : undefined,
      },
    ]
  }, [data])

  const passed = criteria.filter((c) => c.status === 'pass').length
  const total  = criteria.filter((c) => c.status !== 'na').length
  const score  = total > 0 ? Math.round((passed / total) * 100) : 0

  const scoreColor =
    score >= 70 ? 'text-emerald-400' :
    score >= 40 ? 'text-amber-400'  :
    'text-red-400'

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-300">Buy &amp; Hold Checklist</h3>
          <p className="mt-0.5 text-xs text-zinc-500">Quality criteria for long-term holding</p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-extrabold tabular-nums ${scoreColor}`}>{passed}/{total}</p>
          <p className={`text-xs font-semibold ${scoreColor}`}>{score}% score</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-800">
        <div
          className={`h-full transition-all ${score >= 70 ? 'bg-emerald-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="px-5 py-1">
        {criteria.map((c, i) => <CriterionRow key={i} c={c} />)}
      </div>
    </div>
  )
}
