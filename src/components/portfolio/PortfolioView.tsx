'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Wallet } from 'lucide-react'
import { usePortfolio } from '@/lib/hooks/usePortfolio'
import { ChangeBadge, ChangeText } from '@/components/ui/change-badge'
import { AddTransactionModal } from './AddTransactionModal'
import type { Holding } from '@/types/portfolio'

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

function HoldingRow({ h }: { h: Holding }) {
  return (
    <tr className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/40">
      <td className="px-4 py-3">
        <Link href={`/stocks/${h.symbol}`} className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-zinc-800">
            <Image
              src={`https://assets.parqet.com/logos/symbol/${h.symbol}?format=png`}
              alt={h.symbol}
              width={32}
              height={32}
              className="object-contain"
              onError={(e) => {
                const t = e.target as HTMLImageElement
                t.style.display = 'none'
                t.parentElement!.innerHTML = `<span class="text-xs font-bold text-zinc-400">${h.symbol.slice(0, 2)}</span>`
              }}
              unoptimized
            />
          </div>
          <div>
            <p className="font-semibold text-white">{h.symbol}</p>
            <p className="max-w-[100px] truncate text-xs text-zinc-400">{h.name}</p>
          </div>
        </Link>
      </td>
      <td className="px-4 py-3 text-right font-mono font-semibold">${h.currentPrice.toFixed(2)}</td>
      <td className="px-4 py-3 text-right">
        <ChangeBadge value={h.dayChangePct} />
      </td>
      <td className="px-4 py-3 text-right font-mono text-zinc-300">{h.totalShares.toLocaleString()}</td>
      <td className="hidden px-4 py-3 text-right font-mono text-zinc-400 sm:table-cell">${h.avgCost.toFixed(2)}</td>
      <td className="px-4 py-3 text-right font-mono font-semibold">{fmt(h.currentValue)}</td>
      <td className="hidden px-4 py-3 text-right sm:table-cell">
        <ChangeText value={h.unrealizedGainPct} suffix="%" />
        <p className="text-xs text-zinc-500">{fmt(h.unrealizedGain)}</p>
      </td>
      <td className="hidden px-4 py-3 text-right font-mono text-zinc-400 md:table-cell">
        {h.allocationPct.toFixed(1)}%
      </td>
    </tr>
  )
}

export function PortfolioView() {
  const [showModal, setShowModal] = useState(false)
  const { summary, isLoading, symbols } = usePortfolio()

  if (!symbols.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 py-20 text-center">
        <Wallet className="mb-4 h-12 w-12 text-zinc-600" />
        <h2 className="mb-1 text-lg font-semibold text-zinc-300">Your portfolio is empty</h2>
        <p className="mb-6 text-sm text-zinc-500">Add your first transaction to get started</p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" /> Add Transaction
        </button>
        {showModal && <AddTransactionModal onClose={() => setShowModal(false)} />}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Portfolio Value" value={fmt(summary.totalValue)} />
          <SummaryCard
            label="Total Gain"
            value={fmt(summary.totalUnrealizedGain)}
            pct={summary.totalUnrealizedGainPct}
          />
          <SummaryCard
            label="Day Change"
            value={fmt(summary.totalDayChange)}
            pct={summary.totalDayChangePct}
          />
          <SummaryCard label="Dividends Received" value={fmt(summary.totalDividends)} />
        </div>
      )}

      {/* Holdings table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-200">Holdings</h2>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25"
          >
            <Plus className="h-3.5 w-3.5" /> Add Transaction
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                <th className="px-4 py-2.5 text-left">Asset</th>
                <th className="px-4 py-2.5 text-right">Price</th>
                <th className="px-4 py-2.5 text-right">Day</th>
                <th className="px-4 py-2.5 text-right">Shares</th>
                <th className="hidden px-4 py-2.5 text-right sm:table-cell">Avg Cost</th>
                <th className="px-4 py-2.5 text-right">Value</th>
                <th className="hidden px-4 py-2.5 text-right sm:table-cell">Gain/Loss</th>
                <th className="hidden px-4 py-2.5 text-right md:table-cell">Allocation</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? symbols.map((s) => (
                    <tr key={s} className="border-b border-zinc-800/50">
                      {[...Array(5)].map((_, i) => (
                        <td key={i} className="px-4 py-3">
                          <div className="h-4 animate-pulse rounded bg-zinc-800" />
                        </td>
                      ))}
                    </tr>
                  ))
                : (summary?.holdings ?? []).map((h) => <HoldingRow key={h.symbol} h={h} />)}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <AddTransactionModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

function SummaryCard({ label, value, pct }: { label: string; value: string; pct?: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className="mt-1 text-lg font-bold tabular-nums text-white">{value}</p>
      {pct !== undefined && (
        <div className="mt-1">
          <ChangeBadge value={pct} />
        </div>
      )}
    </div>
  )
}
