'use client'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useStockDetail } from '@/lib/hooks/useStockDetail'
import { PriceChart } from '@/components/stock/PriceChart'
import { PerformanceStrip } from '@/components/stock/PerformanceStrip'
import { FundamentalsCard } from '@/components/stock/FundamentalsCard'
import { DividendsSection } from '@/components/stock/DividendsSection'
import { InvestmentSimulator } from '@/components/stock/InvestmentSimulator'
import { CompanyInfo } from '@/components/stock/CompanyInfo'
import { RelatedAssets } from '@/components/stock/RelatedAssets'
import { MagicNumber } from '@/components/stock/MagicNumber'
import { FinancialCharts } from '@/components/stock/FinancialCharts'
import { FairValueCard } from '@/components/stock/FairValueCard'
import { BuyHoldChecklist } from '@/components/stock/BuyHoldChecklist'
import { EarningsCard } from '@/components/stock/EarningsCard'
import { ChangeBadge } from '@/components/ui/change-badge'
import { AddTransactionModal } from '@/components/portfolio/AddTransactionModal'
import { Plus } from 'lucide-react'
import { recordView } from '@/lib/recently-viewed'

function fmtLarge(n: number | null): string {
  if (n === null) return ''
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  return `$${n.toLocaleString()}`
}

export function StockDetailClient({ symbol }: { symbol: string }) {
  const { data, isLoading, error } = useStockDetail(symbol)
  const [showAddTx, setShowAddTx] = useState(false)

  // Track visit for "Mais Visitadas" on home page
  useEffect(() => { if (data?.name) recordView(symbol, data.name) }, [symbol, data?.name])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-8 space-y-4">
        <div className="h-20 animate-pulse rounded-xl bg-zinc-800" />
        <div className="h-80 animate-pulse rounded-xl bg-zinc-800" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-xl bg-zinc-800 lg:col-span-2" />
          <div className="h-64 animate-pulse rounded-xl bg-zinc-800" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-400">
        Failed to load {symbol}
      </div>
    )
  }

  const marketCap = fmtLarge(data.info?.marketCap ?? null)

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-zinc-800 shrink-0">
            <Image
              src={`https://assets.parqet.com/logos/symbol/${symbol}?format=png`}
              alt={symbol}
              width={56}
              height={56}
              className="object-contain"
              onError={(e) => {
                const t = e.target as HTMLImageElement
                t.style.display = 'none'
                t.parentElement!.innerHTML = `<span class="text-lg font-bold text-zinc-400">${symbol.slice(0, 2)}</span>`
              }}
              unoptimized
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{symbol}</h1>
              {data.exchange && (
                <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                  {data.exchange}
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-400">{data.name}</p>
            {(data.info?.sector || data.info?.industry) && (
              <p className="text-xs text-zinc-500">
                {[data.info.sector, data.info.industry].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold tabular-nums text-white">
              ${data.currentPrice.toFixed(2)}
            </span>
            <ChangeBadge value={data.changePct} size="md" />
          </div>
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            {marketCap && <span>Mkt Cap: <span className="text-zinc-300">{marketCap}</span></span>}
            {data.info?.dividendYield && (
              <span>
                DY: <span className="text-emerald-400">{(data.info.dividendYield * 100).toFixed(2)}%</span>
              </span>
            )}
          </div>
          <button
            onClick={() => setShowAddTx(true)}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400"
          >
            <Plus className="h-3.5 w-3.5" /> Add to Portfolio
          </button>
        </div>
      </div>

      {/* Chart */}
      <PriceChart
        symbol={symbol}
        currentPrice={data.currentPrice}
        prevClose={data.prevClose}
      />

      {/* Performance */}
      <PerformanceStrip symbol={symbol} />

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left col: Financials + Dividends + Magic Number + Simulator */}
        <div className="space-y-5 lg:col-span-2">
          <FinancialCharts symbol={symbol} />
          <DividendsSection data={data} />
          <MagicNumber data={data} />
          <InvestmentSimulator data={data} />
        </div>

        {/* Right col: Earnings + Fundamentals + Fair Value + Buy&Hold */}
        <div className="space-y-5">
          <EarningsCard data={data} />
          <FundamentalsCard data={data} />
          <FairValueCard data={data} />
          <BuyHoldChecklist data={data} />
        </div>
      </div>

      {/* Penultimate: Related assets */}
      <RelatedAssets symbol={symbol} sector={data.info?.sector ?? null} />

      {/* Last: About the company (full-width) */}
      <CompanyInfo data={data} />

      {showAddTx && <AddTransactionModal defaultSymbol={symbol} onClose={() => setShowAddTx(false)} />}
    </div>
  )
}
