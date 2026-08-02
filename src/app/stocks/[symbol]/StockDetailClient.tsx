'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useStockDetail, type StockDetailData } from '@/lib/hooks/useStockDetail'
import { PriceChart } from '@/components/stock/PriceChart'
import { PerformanceStrip } from '@/components/stock/PerformanceStrip'
import { FundamentalsCard } from '@/components/stock/FundamentalsCard'
import { DividendsSection } from '@/components/stock/DividendsSection'
import { StockGrowthComparison } from '@/components/stock/StockGrowthComparison'
import { CompanyInfo } from '@/components/stock/CompanyInfo'
import { RelatedAssets } from '@/components/stock/RelatedAssets'
import { MagicNumber } from '@/components/stock/MagicNumber'
import { DividendCalculator } from '@/components/stock/DividendCalculator'
import { FinancialCharts } from '@/components/stock/FinancialCharts'
import { FairValueCard } from '@/components/stock/FairValueCard'
import { AnalystRatingsCard } from '@/components/stock/AnalystRatingsCard'
import { BuyHoldChecklist } from '@/components/stock/BuyHoldChecklist'
import { EarningsCard } from '@/components/stock/EarningsCard'
import { KeyStatsStrip } from '@/components/stock/KeyStatsStrip'
import { AddTransactionModal } from '@/components/portfolio/AddTransactionModal'
import { WatchlistButton } from '@/components/watchlist/WatchlistButton'
import { AlertButton } from '@/components/watchlist/AlertButton'
import { AppDownloadCard } from '@/components/app/AppDownloadCard'
import { AuthRequiredModal } from '@/components/auth/AuthRequiredModal'
import { useAuth } from '@/lib/hooks/useAuth'
import { Plus } from 'lucide-react'
import { recordView } from '@/lib/recently-viewed'
import { EarningsHistory } from '@/components/stock/EarningsHistory'
import { SecFilings } from '@/components/stock/SecFilings'
import { InsiderTransactions } from '@/components/stock/InsiderTransactions'
import CommentsSection from '@/components/comments/CommentsSection'
import { StockAIInsight } from '@/components/stock/StockAIInsight'
import { StockRelatedPosts } from '@/components/stock/StockRelatedPosts'
import { WidgetBoundary } from '@/components/ui/WidgetBoundary'
import type { ReactNode } from 'react'

/** A titled page section (visible h2 + grouped widgets). Optional `id` makes it
 *  a scroll anchor for the header quick-nav (scroll-mt clears the sticky nav). */
function Section({ id, title, children }: { id?: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className={`space-y-5${id ? ' scroll-mt-24' : ''}`}>
      <h2 className="border-b border-zinc-800 pb-2 text-lg font-bold text-white">{title}</h2>
      {children}
    </section>
  )
}

/** Two cards side-by-side on desktop, stacked on mobile (top-aligned). */
function Pair({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">{children}</div>
}

export function StockDetailClient({
  symbol,
  initialData,
  seoIntro,
  seoFaq,
  relatedLinks,
}: {
  symbol: string
  initialData?: StockDetailData
  seoIntro?: ReactNode
  seoFaq?: ReactNode
  relatedLinks?: ReactNode
}) {
  const { data, isLoading } = useStockDetail(symbol, initialData)
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

  // Only show the failure screen when we truly have no data. A transient refetch
  // error (e.g. rate limit) keeps the last good data, so the page stays put
  // instead of flickering to "unavailable".
  if (!data) {
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

  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-5">
      {/* Investidor10-style dark header band: identity + quick-nav (center) + actions.
          Neutral colors (not remapped by the light-mode zinc inversion) keep text
          light on the dark band in both themes. */}
      <div className="rounded-2xl bg-neutral-800 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          {/* Identity — shrinks & truncates on mobile so it never overflows the viewport */}
          <div className="flex min-w-0 flex-1 items-center gap-3 md:flex-none md:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-neutral-900">
              <Image
                src={`https://assets.parqet.com/logos/symbol/${symbol}?format=png`}
                alt={symbol}
                width={56}
                height={56}
                className="object-contain"
                onError={(e) => {
                  const t = e.target as HTMLImageElement
                  t.style.display = 'none'
                  t.parentElement!.innerHTML = `<span class="text-lg font-bold text-neutral-400">${symbol.slice(0, 2)}</span>`
                }}
                unoptimized
              />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                {/* Inline colors so the title stays visible even if the dev CSS
                    chunk is stale in the browser cache (neutral-* utilities). */}
                {/* Ticker never truncates (shrink-0); only the company name does. */}
                <h1 className="flex min-w-0 items-baseline text-xl font-bold" style={{ color: '#fafafa' }}>
                  <span className="shrink-0">{symbol}</span>
                  {data.name && data.name !== symbol && (
                    <span className="ml-2 truncate text-base font-normal" style={{ color: '#d4d4d4' }}>— {data.name}</span>
                  )}
                </h1>
                {symbol.toUpperCase().endsWith('.TO') && (
                  <span className="shrink-0 rounded-md bg-neutral-700 px-2 py-0.5 text-[10px] font-bold text-neutral-200" title="Toronto Stock Exchange — prices in Canadian dollars">
                    🇨🇦 CAD
                  </span>
                )}
              </div>
              {(data.info?.sector || data.info?.industry) && (
                <p className="truncate text-xs" style={{ color: '#a3a3a3' }}>
                  {[data.info.sector, data.info.industry].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="ml-auto flex shrink-0 items-center gap-1">
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
              <Plus className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Add to Portfolio</span>
            </button>
          </div>
        </div>
      </div>

      {/* Key-stats card strip */}
      <KeyStatsStrip symbol={symbol} initialData={data} />

      {/* 1 — Price & Performance */}
      <Section title="Price & Performance">
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
      </Section>

      {/* 2 — Analysis & Verdict */}
      <Section title="Analysis & Verdict">
        <WidgetBoundary label="AI Insight">
          <StockAIInsight symbol={symbol} />
        </WidgetBoundary>
        <WidgetBoundary label="Analyst Ratings">
          <AnalystRatingsCard data={data} />
        </WidgetBoundary>
        <Pair>
          <WidgetBoundary label="Fair Value">
            <FairValueCard data={data} />
          </WidgetBoundary>
          <WidgetBoundary label="Buy & Hold Checklist">
            <BuyHoldChecklist data={data} />
          </WidgetBoundary>
        </Pair>
      </Section>

      {/* 3 — Financials */}
      <Section id="indicators" title="Financials">
        <WidgetBoundary label="Financial Charts">
          <FinancialCharts symbol={symbol} />
        </WidgetBoundary>
        <Pair>
          <WidgetBoundary label="Fundamentals">
            <FundamentalsCard data={data} />
          </WidgetBoundary>
          <WidgetBoundary label="Earnings">
            <EarningsCard data={data} />
          </WidgetBoundary>
        </Pair>
      </Section>

      {/* 4 — SEC Filings & Reported Financials (the two SEC blocks together) */}
      <Section id="results" title="SEC Filings & Reported Financials">
        <WidgetBoundary label="Earnings History">
          <EarningsHistory symbol={symbol} />
        </WidgetBoundary>
        <WidgetBoundary label="SEC Filings">
          <SecFilings symbol={symbol} />
        </WidgetBoundary>
        <WidgetBoundary label="Insider Transactions">
          <InsiderTransactions symbol={symbol} />
        </WidgetBoundary>
      </Section>

      {/* 5 — Dividends & Income */}
      <Section id="dividends" title="Dividends & Income">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">
          <WidgetBoundary label="Dividends">
            <DividendsSection data={data} />
          </WidgetBoundary>
          <div className="flex flex-col gap-5">
            <WidgetBoundary label="Magic Number">
              <MagicNumber data={data} />
            </WidgetBoundary>
            <WidgetBoundary label="Dividend Calculator">
              <DividendCalculator data={data} />
            </WidgetBoundary>
          </div>
        </div>
      </Section>

      {/* 6 — Tools */}
      <Section title="Tools & Simulators">
        <WidgetBoundary label="Growth Comparison">
          <StockGrowthComparison data={data} />
        </WidgetBoundary>
      </Section>

      {/* Discussion — shared with the mobile app */}
      <CommentsSection entityType="stock" entityId={symbol} />

      {/* 7 — Discover (related content at the end) */}
      <Section title="Discover">
        <WidgetBoundary label="Related Assets">
          <RelatedAssets symbol={symbol} sector={data.info?.sector ?? null} />
        </WidgetBoundary>
        {/* Server-rendered sector peer links — crawlable in initial HTML (SEO) */}
        {relatedLinks}
        <WidgetBoundary label="Related Articles">
          <StockRelatedPosts symbol={symbol} />
        </WidgetBoundary>
        <div id="company" className="scroll-mt-24">
          <WidgetBoundary label="Company Info">
            <CompanyInfo data={data} />
          </WidgetBoundary>
        </div>
      </Section>

      <AppDownloadCard variant="hero" />

      {/* SEO intro — moved to the end so the mobile page opens on the chart/data,
          not a wall of text (kept indexable, just lower on the page). */}
      {seoIntro}

      {seoFaq}

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
