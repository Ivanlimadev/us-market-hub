import { IndexCards } from '@/components/market/IndexCards'
import { HomeHeatmap } from '@/components/market/HomeHeatmap'
import { HomeRankings } from '@/components/market/HomeRankings'
import { MarketTreemap } from '@/components/market/MarketTreemap'
import { DividendCalendarWidget } from '@/components/market/DividendCalendarWidget'
import { EarningsCalendarWidget } from '@/components/market/EarningsCalendarWidget'
import { PortfolioWidget } from '@/components/portfolio/PortfolioWidget'

export default function HomePage() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">US Markets</h1>
        <p className="text-sm text-zinc-400">Real-time data · Updates every 60s during market hours</p>
      </div>

      {/* Portfolio widget — only renders when user has holdings */}
      <PortfolioWidget />

      {/* Binance-style treemap */}
      <MarketTreemap />

      {/* Market index cards */}
      <IndexCards />

      {/* Rankings */}
      <HomeRankings />

      {/* Upcoming dividends + earnings side by side */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DividendCalendarWidget />
        <EarningsCalendarWidget />
      </div>

      {/* Sector heatmap */}
      <HomeHeatmap />
    </div>
  )
}
