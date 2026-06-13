'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Plus, Wallet, LayoutGrid, List, DollarSign, BarChart2, Newspaper } from 'lucide-react'
import { usePortfolio } from '@/lib/hooks/usePortfolio'
import { usePortfolioDividends } from '@/lib/hooks/usePortfolioDividends'
import { usePortfolioSync } from '@/lib/hooks/usePortfolioSync'
import { ChangeBadge } from '@/components/ui/change-badge'
import { AddTransactionModal } from './AddTransactionModal'
import { DividendBarChart } from './DividendBarChart'
import { PortfolioHistoryChart } from './PortfolioHistoryChart'
import { PortfolioNews } from './PortfolioNews'
import type { Holding } from '@/types/portfolio'

type Tab = 'overview' | 'holdings' | 'dividends' | 'history' | 'news'

const ALLOC_COLORS = [
  'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500',
  'bg-teal-500', 'bg-orange-500', 'bg-indigo-500', 'bg-pink-500',
  'bg-cyan-500', 'bg-lime-500',
]

function fmt(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
}

// ---- sub-components ----

function SummaryCard({
  label, value, pct, sub, valueColor,
}: { label: string; value: string; pct?: number; sub?: string; valueColor?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs font-medium text-zinc-400">{label}</p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${valueColor ?? 'text-white'}`}>{value}</p>
      {pct !== undefined && <div className="mt-1"><ChangeBadge value={pct} /></div>}
      {sub && <p className="mt-0.5 text-[11px] text-zinc-500">{sub}</p>}
    </div>
  )
}

function AllocationBar({ holdings }: { holdings: Holding[] }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-300">Portfolio Allocation</h3>
      <div className="flex h-3 overflow-hidden rounded-full">
        {holdings.map((h, i) => (
          <div
            key={h.symbol}
            className={`${ALLOC_COLORS[i % ALLOC_COLORS.length]} transition-all`}
            style={{ width: `${h.allocationPct}%` }}
            title={`${h.symbol}: ${h.allocationPct.toFixed(1)}%`}
          />
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-3 lg:grid-cols-5">
        {holdings.slice(0, 10).map((h, i) => (
          <Link
            key={h.symbol}
            href={h.asset_type === 'crypto' ? (h.coingeckoId ? `/crypto/${h.coingeckoId}` : '/crypto') : `/stocks/${h.symbol}`}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
          >
            <div className={`h-2 w-2 shrink-0 rounded-full ${ALLOC_COLORS[i % ALLOC_COLORS.length]}`} />
            <span className="text-xs font-medium text-zinc-300">{h.symbol}</span>
            <span className="text-xs text-zinc-500">{h.allocationPct.toFixed(1)}%</span>
          </Link>
        ))}
        {holdings.length > 10 && (
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 shrink-0 rounded-full bg-zinc-700" />
            <span className="text-xs text-zinc-500">+{holdings.length - 10} mais</span>
          </div>
        )}
      </div>
    </div>
  )
}

function HoldingCard({ h, divThisMonth, divAllTime }: {
  h: Holding
  divThisMonth: number
  divAllTime: number
}) {
  const gainUp  = h.unrealizedGain >= 0
  const isCrypto = h.asset_type === 'crypto'
  const href     = isCrypto ? `/crypto/${h.coingeckoId}` : `/stocks/${h.symbol}`

  function fmtPrice(n: number) {
    if (n >= 1)    return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    if (n >= 0.01) return `$${n.toFixed(4)}`
    return `$${n.toFixed(8)}`
  }

  function fmtAmount(n: number) {
    if (isCrypto) {
      if (n >= 1)    return n.toLocaleString('en-US', { maximumFractionDigits: 8 })
      return n.toFixed(8)
    }
    return n.toLocaleString()
  }

  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition-colors hover:border-zinc-600"
    >
      {/* Header: logo + name + allocation badge */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-zinc-800">
          {isCrypto && h.image ? (
            <Image src={h.image} alt={h.symbol} width={44} height={44} className="rounded-full object-contain" unoptimized />
          ) : (
            <Image
              src={`https://assets.parqet.com/logos/symbol/${h.symbol}?format=png`}
              alt={h.symbol} width={44} height={44} className="object-contain" unoptimized
              onError={(e) => {
                const t = e.target as HTMLImageElement
                t.style.display = 'none'
                t.parentElement!.innerHTML = `<span class="text-sm font-bold text-zinc-400">${h.symbol.slice(0, 2)}</span>`
              }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-white leading-tight">{h.symbol}</p>
            {isCrypto && (
              <span className="rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-orange-400">Crypto</span>
            )}
          </div>
          <p className="truncate text-xs text-zinc-500">{h.name}</p>
        </div>
        <span className="shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
          {h.allocationPct.toFixed(1)}%
        </span>
      </div>

      {/* Price row */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Current Price</p>
          <p className="text-lg font-bold tabular-nums text-white">{fmtPrice(h.currentPrice)}</p>
        </div>
        <ChangeBadge value={h.dayChangePct} />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2 border-t border-zinc-800 pt-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Avg Cost</p>
          <p className="text-sm font-semibold tabular-nums text-zinc-200">{fmtPrice(h.avgCost)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">{isCrypto ? 'Amount' : 'Shares'}</p>
          <p className="text-sm font-semibold tabular-nums text-zinc-200">{fmtAmount(h.totalShares)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Total Value</p>
          <p className="text-sm font-semibold tabular-nums text-white">{fmt(h.currentValue)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Gain / Loss</p>
          <p className={`text-sm font-semibold tabular-nums ${gainUp ? 'text-emerald-400' : 'text-red-400'}`}>
            {gainUp ? '+' : ''}{h.unrealizedGainPct.toFixed(2)}%
          </p>
          <p className={`text-[10px] ${gainUp ? 'text-emerald-600' : 'text-red-600'}`}>
            {gainUp ? '+' : ''}{fmt(h.unrealizedGain)}
          </p>
        </div>
      </div>

      {/* Dividends row — stocks only */}
      {!isCrypto && (
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-3 py-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-emerald-600">Div. This Month</p>
            <p className="text-sm font-bold tabular-nums text-emerald-400">{fmt(divThisMonth)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-emerald-600">Div. All-Time</p>
            <p className="text-sm font-bold tabular-nums text-emerald-400">{fmt(divAllTime)}</p>
          </div>
        </div>
      )}
    </Link>
  )
}

// ---- main component ----

export function PortfolioView() {
  const [tab, setTab]           = useState<Tab>('holdings')
  const [showModal, setShowModal] = useState(false)

  usePortfolioSync()

  const { summary, isLoading, symbols } = usePortfolio()
  const dividends = usePortfolioDividends()

  if (!symbols.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-700 py-20 text-center">
        <Wallet className="mb-4 h-12 w-12 text-zinc-600" />
        <h2 className="mb-1 text-lg font-semibold text-zinc-300">Your portfolio is empty</h2>
        <p className="mb-6 text-sm text-zinc-500">Add your first asset to get started</p>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" /> Add Asset
        </button>
        {showModal && <AddTransactionModal onClose={() => setShowModal(false)} />}
      </div>
    )
  }

  const TABS = [
    { key: 'overview'  as Tab, label: 'Overview',   icon: LayoutGrid },
    { key: 'holdings'  as Tab, label: 'Holdings',   icon: List },
    { key: 'history'   as Tab, label: 'History',    icon: BarChart2  },
    { key: 'dividends' as Tab, label: 'Dividends',  icon: DollarSign },
    { key: 'news'      as Tab, label: 'News',       icon: Newspaper  },
  ]

  return (
    <div className="space-y-5">
      {/* Tab bar + action */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-1 gap-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-zinc-700 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" /> Add Asset
        </button>
      </div>

      {/* ---- OVERVIEW ---- */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {isLoading && !summary ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-800" />
              ))}
            </div>
          ) : summary ? (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryCard
                  label="Portfolio Value"
                  value={fmt(summary.totalValue)}
                  sub={`Invested: ${fmt(summary.totalCost)}`}
                />
                <SummaryCard
                  label="Total Gain"
                  value={fmt(Math.abs(summary.totalUnrealizedGain))}
                  pct={summary.totalUnrealizedGainPct}
                  valueColor={summary.totalUnrealizedGain >= 0 ? 'text-emerald-400' : 'text-red-400'}
                />
                <SummaryCard
                  label="Today's Change"
                  value={fmt(Math.abs(summary.totalDayChange))}
                  pct={summary.totalDayChangePct}
                  valueColor={summary.totalDayChange >= 0 ? 'text-emerald-400' : 'text-red-400'}
                />
                <SummaryCard
                  label="Dividends (month)"
                  value={fmt(dividends.thisMonthTotal)}
                  sub={`All-time: ${fmt(dividends.allTimeTotal)}`}
                  valueColor="text-emerald-400"
                />
              </div>
              <AllocationBar holdings={summary.holdings} />
            </>
          ) : null}
        </div>
      )}

      {/* ---- HOLDINGS ---- */}
      {tab === 'holdings' && (
        isLoading
          ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {symbols.map(s => (
                <div key={s} className="h-64 animate-pulse rounded-xl bg-zinc-800" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(summary?.holdings ?? []).map(h => (
                <HoldingCard
                  key={h.symbol}
                  h={h}
                  divThisMonth={dividends.bySymbol[h.symbol]?.thisMonth ?? 0}
                  divAllTime={dividends.bySymbol[h.symbol]?.allTime ?? 0}
                />
              ))}
            </div>
          )
      )}

      {/* ---- HISTORY ---- */}
      {tab === 'history' && <PortfolioHistoryChart />}

      {/* ---- DIVIDENDS ---- */}
      {tab === 'dividends' && (
        <div className="space-y-4">
          {/* Totals */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs text-zinc-400">Dividends this month</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-400">
                {fmt(dividends.thisMonthTotal)}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="text-xs text-zinc-400">All-time received</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-white">
                {fmt(dividends.allTimeTotal)}
              </p>
            </div>
          </div>

          {/* Annual bar chart */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="mb-4 text-sm font-semibold text-zinc-300">Dividends by Year</h3>
            {dividends.isLoading ? (
              <div className="h-24 animate-pulse rounded bg-zinc-800" />
            ) : dividends.annual.length ? (
              <DividendBarChart data={dividends.annual} color="bg-sky-500" height={96} />
            ) : (
              <p className="py-8 text-center text-xs text-zinc-600">
                No dividend history found for your holdings
              </p>
            )}
          </div>

          {/* Monthly bar chart */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <h3 className="mb-4 text-sm font-semibold text-zinc-300">
              Dividends by Month <span className="font-normal text-zinc-500">(last 24 months)</span>
            </h3>
            {dividends.isLoading ? (
              <div className="h-24 animate-pulse rounded bg-zinc-800" />
            ) : (
              <DividendBarChart data={dividends.monthly} color="bg-emerald-500" height={96} />
            )}
          </div>

          {/* Recent payments list */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
            <div className="border-b border-zinc-800 px-4 py-3">
              <h3 className="text-sm font-semibold text-zinc-300">Recent Payments</h3>
            </div>
            {dividends.isLoading ? (
              <div className="divide-y divide-zinc-800/50">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div className="h-8 w-8 animate-pulse rounded-lg bg-zinc-800" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
                      <div className="h-2.5 w-24 animate-pulse rounded bg-zinc-800" />
                    </div>
                    <div className="h-4 w-14 animate-pulse rounded bg-zinc-800" />
                  </div>
                ))}
              </div>
            ) : dividends.recentPayments.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-zinc-600">
                No dividend payments found for your holdings
              </p>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {dividends.recentPayments.map((p, idx) => (
                  <Link
                    key={`${p.symbol}-${p.date}-${idx}`}
                    href={`/stocks/${p.symbol}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-800">
                      <Image
                        src={`https://assets.parqet.com/logos/symbol/${p.symbol}?format=png`}
                        alt={p.symbol} width={32} height={32} className="object-contain" unoptimized
                        onError={(e) => {
                          const t = e.target as HTMLImageElement
                          t.style.display = 'none'
                          t.parentElement!.innerHTML = `<span class="text-[10px] font-bold text-zinc-400">${p.symbol.slice(0,2)}</span>`
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{p.symbol}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-emerald-400">
                      +{fmt(p.amount)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---- NEWS ---- */}
      {tab === 'news' && <PortfolioNews />}

      {showModal && <AddTransactionModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
