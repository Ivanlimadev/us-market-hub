'use client'
import Link from 'next/link'
import { Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { usePortfolio } from '@/lib/hooks/usePortfolio'
import { usePortfolioDividends } from '@/lib/hooks/usePortfolioDividends'

function fmtUsd(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

export function PortfolioWidget() {
  const { summary, symbols } = usePortfolio()
  const { thisMonthTotal }   = usePortfolioDividends()

  if (!symbols.length) return null

  const gainUp    = (summary?.totalUnrealizedGain ?? 0) >= 0
  const dayUp     = (summary?.totalDayChange ?? 0) >= 0

  return (
    <Link
      href="/portfolio"
      className="block rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-600 group"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
            <Wallet className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-sm font-semibold text-zinc-300 transition-colors group-hover:text-white">
            My Portfolio
          </span>
        </div>
        <span className="text-xs text-zinc-500 transition-colors group-hover:text-zinc-300">
          View details →
        </span>
      </div>

      {summary ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* Total value */}
          <div>
            <p className="text-[11px] text-zinc-500">Total Value</p>
            <p className="text-lg font-bold tabular-nums text-white">{fmtUsd(summary.totalValue)}</p>
            <p className="text-[10px] text-zinc-600">
              Invested: {fmtUsd(summary.totalCost)}
            </p>
          </div>

          {/* Total gain */}
          <div>
            <p className="text-[11px] text-zinc-500">Total Gain</p>
            <p className={`text-lg font-bold tabular-nums ${gainUp ? 'text-emerald-400' : 'text-red-400'}`}>
              {summary.totalUnrealizedGainPct >= 0 ? '+' : ''}{summary.totalUnrealizedGainPct.toFixed(2)}%
            </p>
            <p className={`text-[10px] ${gainUp ? 'text-emerald-600' : 'text-red-600'}`}>
              {gainUp ? '+' : ''}{fmtUsd(summary.totalUnrealizedGain)}
            </p>
          </div>

          {/* Day change */}
          <div>
            <p className="text-[11px] text-zinc-500">Today</p>
            <div className="flex items-center gap-1">
              {dayUp
                ? <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                : <TrendingDown className="h-3.5 w-3.5 text-red-400" />
              }
              <p className={`text-lg font-bold tabular-nums ${dayUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {summary.totalDayChangePct >= 0 ? '+' : ''}{summary.totalDayChangePct.toFixed(2)}%
              </p>
            </div>
            <p className={`text-[10px] ${dayUp ? 'text-emerald-600' : 'text-red-600'}`}>
              {dayUp ? '+' : ''}{fmtUsd(summary.totalDayChange)}
            </p>
          </div>

          {/* Dividends this month */}
          <div>
            <p className="text-[11px] text-zinc-500">Dividends (month)</p>
            <p className="text-lg font-bold tabular-nums text-emerald-400">{fmtUsd(thisMonthTotal)}</p>
            <p className="text-[10px] text-zinc-600">{symbols.length} holding{symbols.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-1">
              <div className="h-2.5 w-14 animate-pulse rounded bg-zinc-800" />
              <div className="h-5 w-20 animate-pulse rounded bg-zinc-800" />
            </div>
          ))}
        </div>
      )}
    </Link>
  )
}
