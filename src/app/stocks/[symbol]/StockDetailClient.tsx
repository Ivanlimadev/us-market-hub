'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useStockDetail, type StockDetailData } from '@/lib/hooks/useStockDetail'
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
import { WatchlistButton } from '@/components/watchlist/WatchlistButton'
import { AlertButton } from '@/components/watchlist/AlertButton'
import { AuthRequiredModal } from '@/components/auth/AuthRequiredModal'
import { useAuth } from '@/lib/hooks/useAuth'
import { Plus } from 'lucide-react'
import { recordView } from '@/lib/recently-viewed'
import { EarningsHistory } from '@/components/stock/EarningsHistory'
import { SecFilings } from '@/components/stock/SecFilings'
import { StockAnalysisSummary } from '@/components/stock/StockAnalysisSummary'
import { StockAIInsight } from '@/components/stock/StockAIInsight'
import { StockRelatedPosts } from '@/components/stock/StockRelatedPosts'
import { WidgetBoundary } from '@/components/ui/WidgetBoundary'

function fmtLarge(n: number | null): string {
  if (n === null) return ''
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  return `$${n.toLocaleString()}`
}

export function StockDetailClient({ symbol, initialData }: { symbol: string; initialData?: StockDetailData }) {
  const { data, isLoading, error } = useStockDetail(symbol, initialData)
  const { user } = useAuth()
  const [showAddTx, setShowAddTx] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

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

  // fetchStockData uses Promise.allSettled and never returns null — a delisted
  // or unknown symbol yields a degenerate object (price 0, no real fundamentals).
  // Require a live price OR a real market cap; otherwise show a clean notice
  // instead of a $0 page full of "—" placeholders.
  const hasData =
    data.currentPrice > 0 ||
    (data.info?.marketCap ?? 0) > 0
  if (!hasData) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-white">{symbol} data unavailable</h1>
        <p className="mt-2 text-sm text-zinc-400">
          We couldn&rsquo;t load market data for{' '}
          <span className="font-semibold text-zinc-200">{symbol}</span>. This symbol may be
          delisted, renamed, or not covered by our data sources.
        </p>
        <Link
          href="/stocks"
          className="mt-6 inline-block rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800"
        >
          Browse stocks
        </Link>
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
              <h1 className="text-xl font-bold text-white">
                {symbol}
                {data.name && data.name !== symbol && (
                  <span className="ml-2 text-base font-normal text-zinc-400">— {data.name}</span>
                )}
              </h1>
              {data.exchange && (
                <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                  {data.exchange}
                </span>
              )}
            </div>
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
          <div className="flex items-center gap-1">
            <WatchlistButton
              symbol={symbol}
              name={data.name}
              asset_type="stock"
            />
            <AlertButton
              symbol={symbol}
              name={data.name}
              asset_type="stock"
              currentPrice={data.currentPrice}
            />
            <button
              onClick={() => user ? setShowAddTx(true) : setShowAuthModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-400"
            >
              <Plus className="h-3.5 w-3.5" /> Add to Portfolio
            </button>
          </div>
        </div>
      </div>

      <WidgetBoundary label="Price Chart">
        <PriceChart
          symbol={symbol}
          currentPrice={data.currentPrice}
          prevClose={data.prevClose}
        />
      </WidgetBoundary>

      <WidgetBoundary label="Performance">
        <PerformanceStrip symbol={symbol} />
      </WidgetBoundary>

      <WidgetBoundary label="Stock Analysis">
        <StockAnalysisSummary data={data} />
      </WidgetBoundary>

      <WidgetBoundary label="AI Insight">
        <StockAIInsight symbol={symbol} />
      </WidgetBoundary>

      <WidgetBoundary label="Related Articles">
        <StockRelatedPosts symbol={symbol} />
      </WidgetBoundary>

      {/* Wide widgets keep full width (charts + simulator need the room) */}
      <WidgetBoundary label="Financial Charts">
        <FinancialCharts symbol={symbol} />
      </WidgetBoundary>

      {/* Masonry — packs the analysis cards with no empty columns */}
      <div className="gap-5 [column-fill:balance] columns-1 lg:columns-2 [&>div]:mb-5 [&>div]:break-inside-avoid">
        <div>
          <WidgetBoundary label="Earnings">
            <EarningsCard data={data} />
          </WidgetBoundary>
        </div>
        <div>
          <WidgetBoundary label="Fundamentals">
            <FundamentalsCard data={data} />
          </WidgetBoundary>
        </div>
        <div>
          <WidgetBoundary label="Dividends">
            <DividendsSection data={data} />
          </WidgetBoundary>
        </div>
        <div>
          <WidgetBoundary label="Fair Value">
            <FairValueCard data={data} />
          </WidgetBoundary>
        </div>
        <div>
          <WidgetBoundary label="Earnings History">
            <EarningsHistory symbol={symbol} />
          </WidgetBoundary>
        </div>
        <div>
          <WidgetBoundary label="Magic Number">
            <MagicNumber data={data} />
          </WidgetBoundary>
        </div>
        <div>
          <WidgetBoundary label="Buy & Hold Checklist">
            <BuyHoldChecklist data={data} />
          </WidgetBoundary>
        </div>
        <div>
          <WidgetBoundary label="SEC Filings">
            <SecFilings symbol={symbol} />
          </WidgetBoundary>
        </div>
      </div>

      <WidgetBoundary label="Investment Simulator">
        <InvestmentSimulator data={data} />
      </WidgetBoundary>


      <WidgetBoundary label="Related Assets">
        <RelatedAssets symbol={symbol} sector={data.info?.sector ?? null} />
      </WidgetBoundary>

      <WidgetBoundary label="Company Info">
        <CompanyInfo data={data} />
      </WidgetBoundary>

      <p className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-[11px] leading-relaxed text-zinc-500">
        <strong className="text-zinc-400">Disclaimer:</strong> This page — including any buy/hold/avoid view,
        fair value or price estimate — is generated from market data for informational and educational
        purposes only and does <strong className="text-zinc-400">not constitute financial, investment or
        trading advice</strong>. Data may be delayed or inaccurate. Always do your own research and consult
        a licensed financial advisor before making any investment decision.
      </p>

      {showAddTx && <AddTransactionModal defaultSymbol={symbol} onClose={() => setShowAddTx(false)} />}
      {showAuthModal && <AuthRequiredModal feature="portfolio" onClose={() => setShowAuthModal(false)} />}
    </div>
  )
}
