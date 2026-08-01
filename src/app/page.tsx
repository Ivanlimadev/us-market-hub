import type { Metadata } from 'next'
import { IndexCards } from '@/components/market/IndexCards'

export const metadata: Metadata = {
  title: 'Stock Market ROI — US Stock Market Data & Analysis',
  description: 'Free US stock market data: quotes, interactive charts, portfolio tracker, stock screener, earnings calendar, dividends, market heatmap and AI-powered analysis.',
  alternates: { canonical: 'https://stockmarketroi.com' },
}
import { HomeHeatmap } from '@/components/market/HomeHeatmap'
import { HomeRankings } from '@/components/market/HomeRankings'
import { DividendCalendarWidget } from '@/components/market/DividendCalendarWidget'
import { EarningsCalendarWidget } from '@/components/market/EarningsCalendarWidget'
import { PortfolioWidget } from '@/components/portfolio/PortfolioWidget'
import { HomeBlogWidget } from '@/components/market/HomeBlogWidget'
import { CryptoHomeWidget } from '@/components/crypto/CryptoHomeWidget'
import { WidgetBoundary } from '@/components/ui/WidgetBoundary'
import { AppDownloadCard } from '@/components/app/AppDownloadCard'
import { HeroSearch } from '@/components/home/HeroSearch'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
      <HeroSearch />

      <div>
        <h2 className="text-2xl font-bold text-white">US Markets</h2>
        <p className="text-sm text-zinc-400">Updates every 60s during market hours</p>
      </div>

      <WidgetBoundary label="Portfolio">
        <PortfolioWidget />
      </WidgetBoundary>

      <WidgetBoundary label="Market Heatmap">
        <HomeHeatmap />
      </WidgetBoundary>

      <WidgetBoundary label="Market Indices">
        <IndexCards />
      </WidgetBoundary>

      <WidgetBoundary label="Rankings">
        <HomeRankings />
      </WidgetBoundary>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WidgetBoundary label="Upcoming Dividends">
          <DividendCalendarWidget />
        </WidgetBoundary>
        <WidgetBoundary label="Upcoming Earnings">
          <EarningsCalendarWidget />
        </WidgetBoundary>
      </div>

      <WidgetBoundary label="Our Blog">
        <HomeBlogWidget />
      </WidgetBoundary>

      <AppDownloadCard variant="hero" />

      <WidgetBoundary label="Crypto Markets">
        <CryptoHomeWidget />
      </WidgetBoundary>
    </div>
  )
}
