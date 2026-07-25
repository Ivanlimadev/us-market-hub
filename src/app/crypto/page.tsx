import type { Metadata } from 'next'
import { GlobalCryptoStats } from '@/components/crypto/GlobalCryptoStats'
import { CryptoHeatmap } from '@/components/crypto/CryptoHeatmap'
import { CryptoTable } from '@/components/crypto/CryptoTable'
import { FearGreedGauge } from '@/components/crypto/FearGreedGauge'
import { CryptoTrending } from '@/components/crypto/CryptoTrending'
import { CryptoGainersLosers } from '@/components/crypto/CryptoGainersLosers'
import { DominanceChart } from '@/components/crypto/DominanceChart'
import { DefiTVLWidget } from '@/components/crypto/DefiTVLWidget'
import { FundingRates }    from '@/components/crypto/FundingRates'
import { LongShortRatio } from '@/components/crypto/LongShortRatio'
import { WidgetBoundary } from '@/components/ui/WidgetBoundary'

export const metadata: Metadata = {
  title: 'Crypto — Live Prices, Market Cap & Analysis',
  description: 'Live cryptocurrency prices, heatmap, and market data powered by CoinGecko and Kraken.',
  alternates: { canonical: 'https://stockmarketroi.com/crypto' },
}

export default function CryptoPage() {
  return (
    <main className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Cryptocurrency Market</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Live prices via Kraken · Market data via CoinGecko · DeFi via DefiLlama
        </p>
      </div>

      <WidgetBoundary label="Global Stats">
        <GlobalCryptoStats />
      </WidgetBoundary>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <WidgetBoundary label="Fear & Greed">
          <FearGreedGauge />
        </WidgetBoundary>
        <WidgetBoundary label="Trending">
          <CryptoTrending />
        </WidgetBoundary>
        <WidgetBoundary label="Gainers & Losers">
          <CryptoGainersLosers />
        </WidgetBoundary>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WidgetBoundary label="Dominance Chart">
          <DominanceChart />
        </WidgetBoundary>
        <WidgetBoundary label="DeFi TVL">
          <DefiTVLWidget />
        </WidgetBoundary>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WidgetBoundary label="Funding Rates">
          <FundingRates />
        </WidgetBoundary>
        <WidgetBoundary label="Long/Short Ratio">
          <LongShortRatio />
        </WidgetBoundary>
      </div>

      <WidgetBoundary label="Crypto Heatmap">
        <CryptoHeatmap />
      </WidgetBoundary>

      <WidgetBoundary label="Crypto Table">
        <CryptoTable />
      </WidgetBoundary>
    </main>
  )
}
