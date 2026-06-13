import { IndexCards } from '@/components/market/IndexCards'
import { HomeHeatmap } from '@/components/market/HomeHeatmap'
import { HomeRankings } from '@/components/market/HomeRankings'
import { DividendCalendarWidget } from '@/components/market/DividendCalendarWidget'
import { EarningsCalendarWidget } from '@/components/market/EarningsCalendarWidget'
import { PortfolioWidget } from '@/components/portfolio/PortfolioWidget'
import { HomeNewsWidget } from '@/components/market/HomeNewsWidget'
import { WidgetBoundary } from '@/components/ui/WidgetBoundary'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">US Markets</h1>
        <p className="text-sm text-zinc-400">Real-time data · Updates every 60s during market hours</p>
      </div>

      <WidgetBoundary label="Portfolio">
        <PortfolioWidget />
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

      <WidgetBoundary label="Market Heatmap">
        <HomeHeatmap />
      </WidgetBoundary>

      <WidgetBoundary label="Market News">
        <HomeNewsWidget />
      </WidgetBoundary>
    </div>
  )
}
