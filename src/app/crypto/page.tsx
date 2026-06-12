import type { Metadata } from 'next'
import { GlobalCryptoStats } from '@/components/crypto/GlobalCryptoStats'
import { CryptoHeatmap } from '@/components/crypto/CryptoHeatmap'
import { CryptoTable } from '@/components/crypto/CryptoTable'
import { FearGreedGauge } from '@/components/crypto/FearGreedGauge'
import { CryptoTrending } from '@/components/crypto/CryptoTrending'
import { CryptoGainersLosers } from '@/components/crypto/CryptoGainersLosers'

export const metadata: Metadata = {
  title: 'Crypto | Stock Market ROI',
  description: 'Live cryptocurrency prices, heatmap, and market data powered by CoinGecko and Kraken.',
}

export default function CryptoPage() {
  return (
    <main className="mx-auto max-w-screen-xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Cryptocurrency Market</h1>
        <p className="text-sm text-zinc-500 mt-0.5">
          Live prices via Kraken · Market data via CoinGecko
        </p>
      </div>

      {/* Global stats */}
      <GlobalCryptoStats />

      {/* Fear & Greed + Trending + Gainers/Losers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <FearGreedGauge />
        <CryptoTrending />
        <CryptoGainersLosers />
      </div>

      {/* Heatmap */}
      <CryptoHeatmap />

      {/* Full table */}
      <CryptoTable />
    </main>
  )
}
