'use client'
import { useState } from 'react'
import type { StockDetailData } from '@/lib/hooks/useStockDetail'

function fmtUsd(n: number, max = 2): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: max,
  })
}

/**
 * Compact "what would I earn in dividends" calculator, shown in the right column
 * of the Dividends & Income section (fills the space next to the payout history).
 * Uses the stock's own annual dividend rate + price — no extra data fetch.
 */
export function DividendCalculator({ data }: { data: StockDetailData }) {
  const [amount, setAmount] = useState('10000')

  const price = data.currentPrice
  const divs = data.dividends ?? []
  const rate = data.info?.dividendRate ?? 0
  // Fallback for the annual dividend per share: sum of the last 4 payments (TTM
  // for a quarterly payer) when a clean rate isn't provided.
  const ttm = divs.slice(0, 4).reduce((s, d) => s + (d.dividend || 0), 0)
  const annualPerShare = rate > 0 ? rate : ttm

  // Non-payers (or missing price) get nothing — the column just shows Magic Number.
  if (!(annualPerShare > 0) || !(price > 0)) return null

  const numAmount = Math.max(parseFloat(amount) || 0, 0)
  const yieldPct = (annualPerShare / price) * 100
  const shares = numAmount / price
  const annualIncome = shares * annualPerShare
  const monthlyIncome = annualIncome / 12

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-300">Dividend Calculator</h3>
        <span className="ml-auto rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
          {yieldPct.toFixed(2)}% yield
        </span>
      </div>
      <p className="mt-0.5 text-xs text-zinc-500">
        Estimate {data.symbol} dividend income at the current rate.
      </p>

      <label className="mt-4 block text-xs font-medium text-zinc-400">If you invest</label>
      <div className="mt-1 flex h-10 w-full items-center overflow-hidden rounded-lg border border-zinc-700 bg-zinc-800 focus-within:border-emerald-500">
        <span className="flex h-full items-center border-r border-zinc-700 px-3 text-sm font-medium text-zinc-400">$</span>
        <input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-full w-full bg-transparent px-3 text-sm font-mono font-semibold text-white focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Per year</p>
          <p className="mt-0.5 font-mono text-lg font-bold text-emerald-400">{fmtUsd(annualIncome)}</p>
        </div>
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Per month</p>
          <p className="mt-0.5 font-mono text-lg font-bold text-white">{fmtUsd(monthlyIncome)}</p>
        </div>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
        ≈ {shares.toLocaleString('en-US', { maximumFractionDigits: 1 })} shares at {fmtUsd(annualPerShare)}/share a year.
        Estimate only — dividends can be cut or raised.
      </p>
    </div>
  )
}
